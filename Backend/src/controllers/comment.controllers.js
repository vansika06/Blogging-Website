import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.models.js";
import  Mongoose ,{ObjectId } from "mongoose";
const addComment=asyncHandler(async(req,res)=>{
    const {comment,blog}=req.body;
    if(!(comment||blog)){
        throw new ApiError(400,"comment and post are required")
    }
    console.log(comment)
    console.log(blog)
    const createComment=await Comment.create({
        blog:blog,
        content:comment,
        user:req.user?._id
    })
    if(!createComment){
        throw new ApiError(400,"something went wrong while creating the comment")
    }
    return res.status(200).json(new ApiResponse(200,createComment,"comment added sucessfully"))
})
const commentedPosts=asyncHandler(async(req,res)=>{
    const objectId= new Mongoose.Types.ObjectId(req.user._id);
    const post=await Comment.find({user:objectId}).populate({
        path:'blog',
        populate:{
            path:'owner',
            select:'username fullname avatar _id'
        }
    }).lean()
    if(!post){
        return res.status(200).json(new ApiResponse(200,null,"no posts"))
    }
    return res.status(200).json(new ApiResponse(200,post,"posts"))
})


const editComment=asyncHandler(async(req,res)=>{

})
const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"comment not found")
    }
    if(comment.user!==req.user._id){
        throw new ApiError(400,"Only owner can delete the comment")
    }
    else{
        await Comment.findByIdAndDelete(
          commentId  
        )
        return res.status(200)
        .json(new ApiResponse(200,null,"comment deleted successfully"))
    }
})

const getAllComments=asyncHandler(async(req,res)=>{
    const {blogId}=req.params
    const comments= await Comment.aggregate([
        {
            $match:{
                blog:new Mongoose.Types.ObjectId(blogId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"user",
                foreignField:"_id",
                as:"commentOwner",
                pipeline:[
                    {
                        $project:{
                            fullname:1,
                            username:1,
                             avatar:1,
                             email:1,

                        }
                    }
                ]

            }
        },
        {
            $addFields:{
                commentOwner:{
                    $first:"$commentOwner"
                }
            }
        }
    ])
    if(comments.length==0){
        return  res
        .status(200)
        .json(new ApiResponse(200,null,"No Comments Yet"))
    }
    else{
        return res.status(200).json(new ApiResponse(200,comments,"Allcomments fetched successfully"))
    }
})
export {addComment,editComment,deleteComment,getAllComments,commentedPosts}