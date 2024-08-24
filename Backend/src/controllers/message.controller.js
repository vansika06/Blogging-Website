import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Conversation } from "../models/conversation.models.js";
import { Message } from "../models/message.models.js";
import {User} from '../models/user.models.js'
import  mongoose,{ObjectId} from "mongoose";
import { receiverSocket,io } from "../app.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const sendMessage=asyncHandler(async(req,res)=>{
    const {receiverId,msg}=req.body
    
    console.log(msg)
    const receiver= await User.find({_id:receiverId})
    if(!receiver){
        throw new ApiError(400,"User does not exist")
    }
    const senderId=req.user._id;
    let conversation=await Conversation.findOne({
        participants:{$all:[senderId,receiverId]}
    })
    
    //means no earlier conversation
   
        var imgPath=req.file?.path
       
    
   // console.log(imgPath)
    if(imgPath){
        var uploadedImg=await uploadOnCloudinary(imgPath)
    }

   // console.log(uploadedImg)
    if(!conversation){
                     
        conversation=await Conversation.create({
            participants: [senderId, receiverId], 
                  lastMsg: {sender: senderId, message: msg,} 
        })
        if(!conversation){
            throw new ApiError(400,"unable to send")
        }
       
        
        
    }
    const newMessage=await Message.create({
        conversationId:conversation._id,
        message:msg,
        sentBy:senderId,
        image:uploadedImg?uploadedImg.url:""

    })
    //after saving the msg into  the db send it  directly to the receiver
    const receiverSocketId=receiverSocket(receiverId)
    console.log(receiverSocketId)
    if(receiverSocketId){
       io.to(receiverSocketId).emit("newMessage",newMessage)
    }
    

    if(!newMessage){
        throw new ApiError(400,"unable to send")
    }
    
     const newConversation=   await Conversation.findByIdAndUpdate(
            conversation._id,
           { $set:{
            lastMsg:{
                message:msg,
                sender:senderId
            }
            }},
            {new:true}
        )
        if(!newConversation){
            throw new ApiError(400,"Something went wrong while creating the conversation")
        }
       
        return res
        .status(200)
        .json(new ApiResponse(200,newMessage,"conversation made successfully"))

    

})

const getAllmessages=asyncHandler(async(req,res)=>{
    const {id1}=req.params
    const id2=req.user._id
    const conversation=await Conversation.findOne({
        participants:{$all:[id1,id2]}
    })
    if(!conversation){
        return res
        .status(200)
        .json(200,null,"no conversations yet")
    }
    const messages=await Message.find({
        conversationId:conversation._id
    }).sort({
        createdAt:1
    })
    if(!messages){
        throw new ApiError(400,"Something went wrong while fetching the messages")
    }
    return res.status(200)
    .json(new ApiResponse(200,messages,"messages fetched successfully"))


})

const getUserMessage=asyncHandler(async(req,res)=>{
    const conversations=await Conversation.find({
        participants:req.user._id
    }).populate({
        path:"participants",
        select:"username fullname email avatar id"
    })
    if(!conversations){
        return res.status(200).json(new ApiResponse(200,null,"no conversations"))
    }
    conversations.forEach((conversation)=>{
        //if not doing toString() not matching
       conversation.participants= conversation.participants.filter((field)=>field._id.toString()!==req.user._id.toString())
    })
    return res.status(200).json(new ApiResponse(200,conversations,"fetched conversations"))
})



export {sendMessage,getAllmessages,getUserMessage}