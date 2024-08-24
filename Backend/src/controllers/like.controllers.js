import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";

import Mongoose, { isValidObjectId,ObjectId }  from "mongoose";

import { Like } from "../models/like.models.js";
const toggleLike=asyncHandler(async(req,res)=>{
    const {blogId}=req.body
    console.log(blogId)
    //const objectId = new Mongoose.Types.ObjectId(blogger);
    //if(!isValidObjectId(blogger)){
    ///    throw new ApiError(404,"Invalid object id")
    //}
    const isLiked=await Like.findOne({likedBy:req.user._id,blog:blogId})
    console.log(isLiked)
    if(!isLiked){
        const like=await Like.create({likedBy:req.user._id,blog:blogId})
    if(!like){
        throw new ApiError(500,"something went wrong while liking ")
    }
    
   // const follow=await Follower.create({follower:req.user._id,blogger})
    
   // 
   return res
    .status(200)
    .json(new ApiResponse(200,like,"successfully liked"))
    //const populatedFollow = await Follower.findById(follow._id).populate('follower').populate('blogger');
   // console.log(populatedFollow)
} 
else{
    const unlike=await Like.findByIdAndDelete(isLiked._id)
    if(!unlike){
        throw new ApiError(500,"something went wrong while unliking")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,null,"successfully unliked"))
}
})


const getAllLikedPosts=asyncHandler(async(req,res)=>{
    const objectId= new Mongoose.Types.ObjectId(req.user._id);
   /* const likedPosts=await Like.aggregate([
        {$match:{
            likedBy:objectId
        }},
        {
            $lookup:{
                from:"blogs",
                localField:"blog",
                foreignField:"_id",
                as:"blogDetails",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"ownerDetails",
                            pipeline:[{
                                $project:{
                                    usename:1,
                                    avatar:1,
                                    fullname:1
                                }
                            }

                            ]
                        }},

                        {
                            $addFields:{
                                ownerDetails:{
                                    
                                        $first:"$ownerDetails"
                                     
                                }
                            }
                        }]
                       
                    }
                
            }
        ,
        {
            $addFields:{
                blogDetails:{
                    
                        $first:"$blogDetails"
                     
                }
            }
        }
    ])
    console.log(likedPosts)*/
    const likedPosts=await Like.find({likedBy:objectId}).populate({path:'blog',populate:{
        path:'owner',
        select:'username avatar fullname _id'
    },}).lean()
    if(likedPosts.length==0){
        return res.status(200).json(new ApiResponse(200,null,"No Posts Liked Yet"))
    }
    else{
        return res.status(200).json(new ApiResponse(200,likedPosts," Liked Posts "))
    }

})
const userPostLike=asyncHandler(async(req,res)=>{
    
})

export {toggleLike,getAllLikedPosts} 