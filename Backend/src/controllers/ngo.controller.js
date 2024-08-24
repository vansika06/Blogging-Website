import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Ngo } from "../models/ngo.models.js";
import { Event } from "../models/events.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../utils/email.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose, { Mongoose } from "mongoose";
import { fetchBlog } from "../utils/blog.js";
import {generateAccessAndRefreshToken} from './user.controller.js'

const generateTokens=async(userId)=>{///jb pswd wgerah validate ho ja rha h tb yeh kr rhe isliye user obj jo banaye h usse asani se id nikal kr pass kr skte
   try{
      console.log("hi")
      const user=await Ngo.findById(userId)
      console.log(user)
     const accessToken= user.generateAToken()
     const refreshToken=user.generateRToken()
     user.refreshToken=refreshToken
    await user.save({
      validateBeforeSave:false
     })

     console.log('Generated Access Token:', accessToken);
     console.log('Generated Refresh Token:', refreshToken);
     return{accessToken,refreshToken}
   }
   catch{
    throw new ApiError(500,"Something went wrong while generating refresh and access token")  
   }
}
const register=asyncHandler(async(req,res)=>{
    
        const {name,email,password,pNumber,address,state,Id}=req.body
        
        if([name,email,pNumber,password,address,state,Id].some((field)=>(field?.trim()===""))){
             throw new ApiError(400,"All fields are required")
        }
       const existedUser= await Ngo.findOne({
           $or:[{name},{email},{Id}]
        })
        if(existedUser){
           throw new ApiError(409,"Ngo with email or name or id exists")
        }
         
      console.log(req.files)
     const avatarLocalPath=req.file?.path
        if(!avatarLocalPath){
           throw new ApiError(400,"Avatar is required")
        }
       const avatar= await uploadOnCloudinary(avatarLocalPath)//jo response return  aaya
       
       if(!avatar){
        throw new ApiError(400,"Avatar is required")
       }
      const user=await Ngo.create({name,
                    avatar:avatar.url,
                    verifyToken:null,
                    verifyTokenExpiry:null,
                    forgetToken:null,
                    forgetTokenExpiry:null,
                    isVerified:false,       
                    email,
                    password,
                    name:name.toLowerCase(),
                    pNumber,
                    state,
                    address,
                    Id
     
                 })
      const createNgo=await Ngo.findById(user._id).select("-password -refreshToken")
      console.log(createNgo)
        if(!createNgo){
           throw new ApiError(500,"something went wrong while registering the user")
        }
        const{accessToken,refreshToken}=await generateTokens(user._id)
        const loggedInUser=await Ngo.findById(user._id).select("-password -refreshToken")
        //send verification email
      //  await sendEmail({email,type:"VERIFY",userId:loggedInUser._id})
     
           const options={
              httpOnly:true,
              secure:true
           }
           res
           .status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",refreshToken,options)
           .json(
              new ApiResponse(200,{
                 user:loggedInUser,accessToken,refreshToken
              },
           "User registered successfully")
           )
     
})
const loginNgo=asyncHandler(async(req,res)=>{
   const {email,Id,password}=req.body
   //jo diya uske basis pr login
   console.log(email);
   if(!Id || !email){
      throw new ApiError(400,"Id or email is required")
   }

   //checking if the given username or email exists in th db

 const ngo=  await Ngo.findOne({
      $or:[{Id},{email}]
   })

   if(!ngo){
      throw new ApiError(404,"ngo does not exist")
   }
   //User mongodb k banaya hua obj h ispr mongodb k func hi laga skte user hmara banaya obj h ispr hmare defined obj h
   const isPasswordValid=await ngo.isPasswordCorrect(password)//jo body se nikale
   if(!isPasswordValid){
      throw new ApiError(401,"Invalid credentials");
   } 
   const{accessToken,refreshToken}=await generateTokens(ngo._id)
   //updating user as function k andar change ho gya h
   const loggedInUser=await Ngo.findById(ngo._id).select("-password -refreshToken")
   const options={
      httpOnly:true,
      secure:true
   }
   res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new ApiResponse(200,{
         user:loggedInUser,accessToken,refreshToken
      },
   "user logged in successfully")
   )

})
const addEvent=asyncHandler(async(req,res)=>{
    const {name,description,startDate,endDate,startime,endtime,address,}=req.body
    if([name,description,startDate,endDate,startime,endtime,address].some((field)=>(field?.trim()===""))){
        throw new ApiError(400,"All fields are required")
   }
   var imgPath=req.file?.path
    if(imgPath){
        var uploadedImg=await uploadOnCloudinary(imgPath)
    }
    const event=await Event.create({
         image:uploadedImg?uploadedImg.url:"",
         name,
         description,
         startDate,
         endDate,
         startime,
         endtime,
         address,
         organiser:req.ngo._id
    })
    if(!event){
       throw new ApiError(500,"unable to create event something went wrong") 
    }
    return res.status(200).json(new ApiResponse(200,event,"event created successfully"))

})
const getAllEvents=asyncHandler(async(req,res)=>{
    const events=await Event.find({}).populate("organiser")
    if(!events){
        throw new ApiError(400,"unable to fetch the events")
    }
    return res.status(200).json(new ApiResponse(200,events,"Events fetched successfully"))
})
const participate=asyncHandler(async(req,res)=>{
    
})
const logOutNgo=asyncHandler(async(req,res)=>{
   console.log(req.ngo._id)
         await Ngo.findByIdAndUpdate(req.ngo._id,{
            $unset:{
               refreshToken:1//this removes the field from doc
            }
         },
      {
         new:true
      })

      const options={
         httpOnly:true,
         secure:true
      }
      return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new ApiResponse(200,{},"user loogged out successfully"))
})

export {register,addEvent,getAllEvents,loginNgo,logOutNgo}