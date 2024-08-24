import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import Mongoose, { isValidObjectId,ObjectId }  from "mongoose";
import { receiverSocket,io } from "../app.js";
import { Follow } from "../models/followers.models.js";
import { Request } from "../models/request.models.js";
const sendRequest=asyncHandler(async(req,res)=>{
    const {blogger}=req.body
    console.log(blogger)
    const objectId = new Mongoose.Types.ObjectId(blogger);
    const user=await User.findById(objectId)
    if(!user){
        throw new ApiError(400,"User not found")
    }
    const r=await Request.find({sender:req.user._id,
        receiver:blogger})
        if(r.length==0){
    var request=await Request.create({sender:req.user._id,
        receiver:blogger
        
    })
    if(!request){
        throw new ApiError(500,"Unable to send friend req")
    }}
    
    const receiverSocketId=receiverSocket(objectId)
    if(receiverSocketId){
        io.to(receiverSocketId).emit("requestReceived",request)
    }
    return res.status(200).json(new ApiResponse(200,request,"request made successfully"))
    
})

const getRequest=asyncHandler(async(req,res)=>{
    const requests=await Request.find({receiver:req.user._id}).populate("sender","_id username fullname avatar ")
    if(requests.length===0){
        return res.status(200).json(new ApiResponse(200,null,"no requests yet"))
    }
    else{
        return res
        .status(200)
        .json(new ApiResponse(200,requests,"requests fetched successfully"))
    }
})
const getFollowers=asyncHandler(async(req,res)=>{
    const followers=await Follow.find({$or:[{blogger:req.user._id},{follower:req.user._id}]}).populate("blogger","_id username avatar fullname").populate("follower","_id username avatar fullname")
    if(followers.length==0){
        return res.status(200).json(new ApiResponse(200,null,"no friends yet"))
    }
    return res
    .status(200)
    .json(new ApiResponse(200,followers,"requests fetched successfully"))
})



export{
    getRequest,
    sendRequest,
    getFollowers
}
