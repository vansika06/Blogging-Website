import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from '../models/user.models.js'
import { Channel } from "../models/channel.models.js";
import {ObjectId} from "mongoose"
import  mongoose  from "mongoose";
import { Groupmessage } from "../models/groupmessage.models.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { receiverSocket,io } from "../app.js";
const createChannel=asyncHandler(async(req,res)=>{
    const {name,members}=req.body
    const validUsers=await User.find({_id:{$in:members}})
    if(validUsers.length!==members.length){
        throw new ApiError(400,"some users not valid")
    }
    console.log(name)
    console.log(members)
    const existedChannel=await Channel.findOne({name})
    console.log(existedChannel)
    if(existedChannel){
        throw new ApiError(400,"the channel already  exists")
    }
   // const objectId=new Mongoose.Types.ObjectId(req.user._id)
   const objectId = new mongoose.Types.ObjectId(req.user._id);
   members.push(objectId)
    const channel=await Channel.create({
        name,
        participants:members,

})
    if(!channel){
        throw new ApiError(500,"unable to create the channel")
    }
    return res.status(200).json(new ApiResponse(200,channel,"channel created successfully"))
})
const sendMessage=asyncHandler(async(req,res)=>{
    const {group,msg}=req.body
    console.log(group)
    console.log(msg)
    const channel=await Channel.findById(group)
    if(!channel){
        throw new ApiError("channel not found ")
    }
    var imgPath=req.file?.path
       
    
   // console.log(imgPath)
    if(imgPath){
        var uploadedImg=await uploadOnCloudinary(imgPath)
    }
    const newMessage=await Groupmessage.create({
        groupId:group,
        message:msg,
        sender:req.user._id,
        image:uploadedImg?uploadedImg.url:""

    })
    console.log(newMessage)
    if(!newMessage){
        throw new ApiError(400,"unable to send msg")
    }
    if(channel){
        const senders=channel.participants.filter((member)=>member.toString()!==req.user._id.toString())
        console.log(1)
        console.log(senders)
        senders.forEach((member)=>{
            const receiverSocketId=receiverSocket(member)
            console.log(receiverSocketId)
            if(receiverSocketId){
                io.to(receiverSocketId).emit("newGroupmsg",newMessage)
            }
            
        })
    }
    const newConversation=await Channel.findByIdAndUpdate(group,
        { $set:{
            lastmessage:
               newMessage._id
            
            }},
            {new:true}
    )
    if(!newConversation){
        throw new ApiError(400,"unable to create your conversation")
    }
    console.log(newConversation)
   await newMessage.populate({path:"sender",select:"username fullname email avatar"})
    return res.status(200).json(new ApiResponse(200,newMessage,"mesaage sent successfully"))

})
const getChannels=asyncHandler(async(req,res)=>{
    const channels=await Channel.find({
        participants:req.user._id
    }).populate({path:"participants",select:"username fullname avatar email _id"}).populate("lastmessage")
    if(channels.length===0){
        return res.status(200).json(new ApiResponse(200,null,"you dont have any channels"))
    }
    return res.status(200).json(new ApiResponse(200,channels,"user channels"))
})

const getChannelMessage=asyncHandler(async(req,res)=>{
    const {groupId}=req.params
    const messages=await Groupmessage.find({
        groupId:groupId
    }).populate({path:"sender",
        select:" username fullname avatar email "

})
    if(messages.length===0){
        return res.status(200).json(new ApiResponse(200,null,"No messages yet"))  
    }
    return res.status(200).json(new ApiResponse(200,messages,"group messages"))
})

export{createChannel,getChannels,sendMessage,getChannelMessage}