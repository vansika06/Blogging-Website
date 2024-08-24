import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import Mongoose, { isValidObjectId,ObjectId }  from "mongoose";
import { receiverSocket,io } from "../app.js";
import { Follow } from "../models/followers.models.js";
const toggleFollow=asyncHandler(async(req,res)=>{
    const {blogger}=req.body
    console.log(blogger)
    const objectId = new Mongoose.Types.ObjectId(blogger);
    //if(!isValidObjectId(blogger)){
    ///    throw new ApiError(404,"Invalid object id")
    //}
    const following=await Follow.findOne({follower:req.user._id,blogger})
    console.log(following)
    if(!following){
        const follow=await Follow.create({follower:req.user._id,blogger})
    if(!follow){
        throw new ApiError(500,"something went wrong while following")
    }
    
   // const follow=await Follower.create({follower:req.user._id,blogger})
    
   // 
   return res
    .status(200)
    .json(new ApiResponse(200,follow,"successfully followed"))
    //const populatedFollow = await Follower.findById(follow._id).populate('follower').populate('blogger');
   // console.log(populatedFollow)
} 
else{
    const unfollow=await Follower.findByIdAndDelete(following._id)
    if(!unfollow){
        throw new ApiError(500,"something went wrong while unfollowing")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,null,"successfully unfollowed"))
}
})

const sendFollow=asyncHandler(async(req,res)=>{
    const {blogger}=req.body
    console.log(blogger)
    const objectId = new Mongoose.Types.ObjectId(blogger);
    const user=await User.findById(objectId)
    if(!user){
        throw new ApiError(400,"User not found")
    }
    const receiverSocketId=receiverSocket(objectId)
    io.to(receiverSocketId).emit()
})






export {toggleFollow} 