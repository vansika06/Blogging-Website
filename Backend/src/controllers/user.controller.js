import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js"
import {Blog} from "../models/Blog.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../utils/email.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose, { Mongoose } from "mongoose";
import { fetchBlog } from "../utils/blog.js";
import { Ngo } from "../models/ngo.models.js";
const generateAccessAndRefreshToken=async(userId)=>{///jb pswd wgerah validate ho ja rha h tb yeh kr rhe isliye user obj jo banaye h usse asani se id nikal kr pass kr skte
      try{
         const user=await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
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
const registerUser=asyncHandler(async(req,res)=>{
   const {username,email,fullname,password}=req.body
   console.log("Email:",email);
  // console.log(req.body);---
  /*[Object: null prototype] {
  email: 'aasa@lls.com',
  username: 'abcd',
  password: '246810',
  fullname: 'abbbc'
} aisa dikhta h req.body */
    //agar koi bhi field trim krne k baad empty h toh y true return kr dega
   if([username,email,fullname,password].some((field)=>(field?.trim()===""))){
        throw new ApiError(400,"All fields are required")
   }
  const existedUser= await User.findOne({
      $or:[{username},{email}]
   })
   if(existedUser){
      throw new ApiError(409,"User with email or username exists")
   }
   //console.log(req.files);
   //if we do req.files it is a array of objects and we are acceessing the first object and under that path
   //it looks like--
   /*avatar: [
    {
      fieldname: 'avatar',
      originalname: '54a7adf55416d65d6ef72657cf56a58b--rental-websites-renting.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: './public/temp',
      filename: '54a7adf55416d65d6ef72657cf56a58b--rental-websites-renting.jpg',
      path: 'public\\temp\\54a7adf55416d65d6ef72657cf56a58b--rental-websites-renting.jpg',
      size: 31170
    }
  ] */  
 console.log(req.files)
const avatarLocalPath=req.file?.path
//const avatarLocalPath=req.body.avatar.File.name;

   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar is required")
   }
  const avatar= await uploadOnCloudinary(avatarLocalPath)//jo response return  aaya
  
  if(!avatar){
   throw new ApiError(400,"Avatar is required")
  }
 const user=await User.create({fullname,
               avatar:avatar.url,
               verifyToken:null,
               verifyTokenExpiry:null,
               forgetToken:null,
               forgetTokenExpiry:null,
               isVerified:false,       
               email,
               password,
               username:username.toLowerCase(),

            })
 const createUser=await User.findById(user._id).select("-password -refreshToken")
 console.log(createUser)
   if(!createUser){
      throw new ApiError(500,"something went wrong while registering the user")
   }
   const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
   const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
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
const verifyEmail=asyncHandler(async(req,res)=>{
   const {email,userId,userType}=req.body
   const received=sendEmail({email,userId,type:"VERIFY",userType})
   console.log(received)
   return res.status(200).json(new ApiResponse(200,"Email sent successfully"))

})

const verifyOtp=asyncHandler(async(req,res)=>{
   const {token,userId,userType}=req.body
   console.log(token)
   console.log(userId)
   if(!token || !userId){
      throw new ApiError(404,"otp is required to verify")
   }
   if(userType==="USER"){
   const user=await User.findById(userId.toString()).select("-password -refreshToken")
   if(!user){
      throw new ApiError(500,"unable to save user details sign up again")
   }
   if(user.verifyTokenExpiry<Date.now()){
      throw new ApiError(400,"Token Expired.Please request again")
   }
   const isCorrect= await  bcrypt.compare(token,user.verifyToken)
  if(!isCorrect){
   throw new ApiError(400,"Invalid token")

  }
  console.log(isCorrect)
 var updated=  await User.findByIdAndUpdate(userId.toString()
      ,{
         $unset:{
            verifyToken:1,
           verifyTokenExpiry:1
            
         },
         isVerified:true
      }
      ,{new:true})}
      else{
         const user=await Ngo.findById(userId.toString()).select("-password -refreshToken")
         if(!user){
            throw new ApiError(500,"unable to save user details sign up again")
         }
         if(user.verifyTokenExpiry<Date.now()){
            throw new ApiError(400,"Token Expired.Please request again")
         }
         const isCorrect= await  bcrypt.compare(token,user.verifyToken)
        if(!isCorrect){
         throw new ApiError(400,"Invalid token")
      
        }
        console.log(isCorrect)
       var updated=  await Ngo.findByIdAndUpdate(userId.toString()
            ,{
               $unset:{
                  verifyToken:1,
                 verifyTokenExpiry:1
                  
               },
               isVerified:true
            }
            ,{new:true})
      }
  console.log(updated)
  return res.status(200).json(new ApiResponse(200,updated,"Verified successfully"))
  
})



const loginUser=asyncHandler(async(req,res)=>{
      const {email,username,password}=req.body
      //jo diya uske basis pr login
      console.log(email);
      if(!username && !email){
         throw new ApiError(400,"username or email is required")
      }

      //checking if the given username or email exists in th db

    const user=  await User.findOne({
         $or:[{username},{email}]
      })

      if(!user){
         throw new ApiError(404,"user does not exist")
      }
      //User mongodb k banaya hua obj h ispr mongodb k func hi laga skte user hmara banaya obj h ispr hmare defined obj h
      const isPasswordValid=await user.isPasswordCorrect(password)//jo body se nikale
      if(!isPasswordValid){
         throw new ApiError(401,"Invalid User credentials");
      } 
      const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
      //updating user as function k andar change ho gya h
      const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
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


const logOutUser=asyncHandler(async(req,res)=>{
   console.log(req.user._id)
         await User.findByIdAndUpdate(req.user._id,{
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

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const refreshTokenReceived=req.cookies.refreshToken||req.body.refreshToken
   if(!refreshTokenReceived){
      throw new ApiError(401,"unauthorized request")
   }
     try {
       const decodedToken=  jwt.verify(refreshTokenReceived,process.env.REFRESH_TOKEN_SECRET)
      const user= await User.findById(decodedToken?._id)
      if(!user){
       throw new ApiError(401,"Invalid Refresh Token")
    }
    if(refreshTokenReceived!==user?.refreshToken){
       throw new ApiError(401,"Refresh Token expired or used")
    }
    const options={
       httpOnly:true,
       secure:true
    }
    console.log(user._id)
   const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id);
   console.log('Access Token:', accessToken);
   console.log(' Refresh Token:', refreshToken);
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
       new ApiResponse(
          200,
          {
             accessToken,refreshToken
          },
          "Access Token Refreshed"
       )
    )
     } catch (error) {
      throw new ApiError(401,error?.message||"invalid refresh token")
     }
}

)

const changeCurrentPassword=asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword}=req.body
   const user=await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid old password")
   }
   user.password=newPassword
   await user.save({validateBeforeSave:false})
   return res
         .status(200)
         .json(new ApiResponse(200,{},"password changed"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  // console.log("1")
  // console.log(req.user._id)
  // console.log("1")
   //console.log(new mongoose.Types.ObjectId(req.user._id))
   return res
   .status(200)
   .json(new ApiResponse(200,req.user,"current user fetched"))

})

const getUserById=asyncHandler(async(req,res)=>{
   const {owner}=req.body
   console.log("1")
   console.log(owner)
   const user=await User.findById(owner)
   console.log(user)
   if(!user){
      throw new ApiError(400,"invalid id")
   }
   return res.status(200).json(new ApiResponse(200,user,"fetched successfully"))

})
const getParticularuser=asyncHandler(async(req,res)=>{
   const {userId}=req.params
   console.log(userId)
   console.log("hi")
   if(!(userId?.trim())){
      throw new ApiError(400,"userid is missing")
   }
   const user=await User.findById(userId)
   const page=0;
   const blogsPerPage=10 
   const postDetails=await fetchBlog({_id: { $in: user.postHistory }},null,blogsPerPage*page,blogsPerPage)
  console.log(user)
if(!postDetails){
   throw new ApiError(400,"invalid id")
}
return res.status(200).json(new ApiResponse(200,postDetails,"fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
   //jo jo allowed h update krne k liye
   const {fullname,email}=req.body
   if(!fullname || !email){
      throw new ApiError(400,"All fields required")

   }
  const user= await User.findByIdAndUpdate(
      req.user?._id
      ,{
         $set:{
            fullname,
           email: email
            
         }
      }
      ,{new:true}
   ).select("-password")
   return res.status(200)
            .json(new ApiResponse(200,user,"Account details updated successfully"))
})


const updateAvatar=asyncHandler(async(req,res)=>{
   const avatarLocalPath=req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is missing")
   }
   const avatar=await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new ApiError(400,"Error while uploading")
   }
   const user=await User.findByIdAndUpdate(req.user?._id,
      {
        $set:{ avatar:avatar.url } 
      },
      {
         new:true
      }
   ).select("-password")
   return res.status(200)
            .json(new ApiResponse(200,user,"avatar updated"))

})

const updateCoverImage=asyncHandler(async(req,res)=>{
   const CoverImageLocalPath=req.file?.path
   if(!CoverImageLocalPath){
      throw new ApiError(400," file is missing")
   }
   const CoverImage=await uploadOnCloudinary(CoverImageLocalPath)
   if(!CoverImage.url){
      throw new ApiError(400,"Error while uploading")
   }
   const user=await User.findByIdAndUpdate(req.user?._id,
      {
        $set:{ coverImage:CoverImage.url } 
      },
      {
         new:true
      }
   ).select("-password")
   
   return res.status(200)
            .json(new ApiResponse(200,user,"cover image updated"))
})


const getUserChannelProfile=asyncHandler(async(req,res)=>{
   const {username}=req.params
   if(!(username?.trim())){
      throw new ApiError(400,"userid is missing")
   }
   //const user=await User.findById(userId)
   //user.postHistory.forEach((p)=>populate('p'))
   const channel=await User.aggregate([
      {
         $match:{
            username:username.toLowerCase()
         }
      },
     
     
      
      {
         $project:{
            fullname:1,
            username:1,
            
            avatar:1,
            _id:1,
            email:1
         }
      }
      

   ])
   if(!(channel?.length)){
      throw new ApiError(404,"user does not exist")
   }
   return res
   .status(200)
   .json(
      new ApiResponse(200,channel[0],"User fetched successfully")
   )
})


const getWatchHistory=asyncHandler(async(req,res)=>{
   console.log(req.user._id)
      const user=await User.aggregate([

         {
           $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)

           } 
         },
         {
            $lookup:{
               from:"videos",
               localField:"watchHistory",
               foreignField:"_id",
               as:"watchHistory",
               pipeline:[
                  {
                     $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                           {
                              $project:{
                                 fullname:1,
                                 username:1,
                                 avatar:1
                              }
                           },
                        {
                         $addFields:{
                           owner:{
                              $first:"$owner"
                           }
                         }  
                        }
                        ]
                     }
                  }
               ]
            }
         }
      ])

      return res
            .status(200)
            .json(new ApiResponse(200,user[0].watchHistory,"watch history"))

})

const getUserFollowers=asyncHandler(async(req,res)=>{
   const user=await User.aggregate([
      {
         $match:{
            _id:new Mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup:{
            from:"followers",
            localField:"_id",
            foreignField:""
         }
      }
   ])
})




export {registerUser,
   loginUser,
   logOutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateAvatar,
   updateCoverImage,
   getUserChannelProfile,
   getWatchHistory,
getUserById,
verifyEmail,
verifyOtp,
getParticularuser,generateAccessAndRefreshToken}