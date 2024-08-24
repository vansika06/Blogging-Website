import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Bookmark } from "../models/bookmark.models.js";
import Mongoose from "mongoose";
const toggleBookmark=asyncHandler(async(req,res)=>{
    const {blogId}=req.body
    console.log(blogId)
    //const objectId = new Mongoose.Types.ObjectId(blogger);
    //if(!isValidObjectId(blogger)){
    ///    throw new ApiError(404,"Invalid object id")
    //}
    const isMarked=await Bookmark.findOne({user:req.user._id,blog:blogId})
    
    if(!isMarked){
        const mark=await Bookmark.create({user:req.user._id,blog:blogId})
    if(!mark){
        throw new ApiError(500,"something went wrong while marking ")
    }
    
   // const follow=await Follower.create({follower:req.user._id,blogger})
    
   // 
   return res
    .status(200)
    .json(new ApiResponse(200,mark,"successfully bookmarked"))
    //const populatedFollow = await Follower.findById(follow._id).populate('follower').populate('blogger');
   // console.log(populatedFollow)
} 
else{
    const unmark=await Bookmark.findByIdAndDelete(isMarked._id)
    if(!unmark){
        throw new ApiError(500,"something went wrong while unmarking")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,null,"successfully unmarked"))
}
})
const getAllbookmarks=asyncHandler(async(req,res)=>{
    const objectId= new Mongoose.Types.ObjectId(req.user._id);
    const markedPosts=await Bookmark.find({user:objectId}).populate({path:'blog',populate:{
        path:'owner',
        select:'username avatar fullname _id'
    },}).lean()
    if(markedPosts.length==0){
        return res.status(200).json(new ApiResponse(200,null,"No Posts Liked Yet"))
    }
    else{
        return res.status(200).json(new ApiResponse(200,markedPosts," Liked Posts "))
    }
})
export {toggleBookmark,getAllbookmarks}