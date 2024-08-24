import  nodemailer from 'nodemailer'
import {User} from "../models/user.models.js"
import bcrypt from "bcrypt"
import { asyncHandler } from "./asyncHandler.js";
import {ApiError} from "./ApiError.js"
import { ApiResponse } from "./ApiResponse.js";
import {Ngo} from '../models/ngo.models.js'
 const sendEmail=async({email,type,userId,userType})=>{
  //const {email,type,userId}=req.body
  console.log(email)
  console.log(userId)
  
 try {
   const transporter = nodemailer.createTransport({
     host:"sandbox.smtp.mailtrap.io",
     // service:"gmail",
       port: 587,
       secure: false, // Use `true` for port 465, `false` for all other ports
       auth: {
         user: "4b7f1492f7e078",
         pass: "3926c0a9b25c81",
       },
     });
     if(userType=="USER"){
   const user=await User.findById(userId.toString())
   if(!user){
     throw new ApiError(400,"User not found")
   }
   var token=(Math.floor(1000+Math.random()*9000)).toString()
   
   const hashedOtp=await bcrypt.hash(token,10);
   if(type==="VERIFY"){
       const updated=await User.findByIdAndUpdate(
         userId
         ,{
            $set:{
               verifyToken:hashedOtp,
               verifyTokenExpiry:Date.now()+3600000
              
               
            }
         }
         ,{new:true}
      ).select("-password -refreshToken")
      if(!updated){
       throw new ApiError(500,"Something went wrong while generating the otp")
      }}
 
      else if(type==="FORGET"){
       const updated=await User.findByIdAndUpdate(
         userId
         ,{
            $set:{
               forgetToken:hashedOtp,
               forgetTokenExpiry:Date.now()+3600000
              
               
            }
         }
         ,{new:true}
      ).select("-password -refreshToken")
      if(!updated){
       throw new ApiError(500,"Something went wrong while generating the otp")
      }
 
      }}
      else{
        const user=await Ngo.findById(userId.toString())
        if(!user){
          throw new ApiError(400,"User not found")
        }
        var token=(Math.floor(1000+Math.random()*9000)).toString()
        
        const hashedOtp=await bcrypt.hash(token,10);
        if(type==="VERIFY"){
            const updated=await Ngo.findByIdAndUpdate(
              userId
              ,{
                 $set:{
                    verifyToken:hashedOtp,
                    verifyTokenExpiry:Date.now()+3600000
                   
                    
                 }
              }
              ,{new:true}
           ).select("-password -refreshToken")
           if(!updated){
            throw new ApiError(500,"Something went wrong while generating the otp")
           }}
      
           else if(type==="FORGET"){
            const updated=await Ngo.findByIdAndUpdate(
              userId
              ,{
                 $set:{
                    forgetToken:hashedOtp,
                    forgetTokenExpiry:Date.now()+3600000
                   
                    
                 }
              }
              ,{new:true}
           ).select("-password -refreshToken")
           if(!updated){
            throw new ApiError(500,"Something went wrong while generating the otp")
           }
      
           }
      }
      const mailOptions={
       from:"blogbites@gmail.com",
       to:email,
       subject:type==="VERIFY"?"Verify your email":"Reset your password",
       html:type==="VERIFY"?`<p>The otp for your email  verification is  <b>${token}</b>.Enter the otp to verify your email.Happy Blogging!!!!!</p>`:
       `<p>The otp to reset your password is  <b>${token}</b>.Enter the otp to reset your password.Happy Blogging!!!!!`
     }
      
      await transporter.sendMail(mailOptions)
      .then((r)=>{ console.log(r) 
    console.log("email sent")
     // return res.status(200).json(new ApiResponse(200,{user:userId,email},"Email sent successfully"))
     return r})
 } catch (error) {
  console.log(error)
  throw new ApiError(500,"unable to send email")
 }

 }
 export {sendEmail}