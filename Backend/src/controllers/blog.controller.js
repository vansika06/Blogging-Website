import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js"
import {Blog} from "../models/Blog.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import Mongoose from "mongoose";
import {ObjectId} from "mongoose"
import { fetchBlog, fetchParticular } from "../utils/blog.js";
const publishPost=asyncHandler(async(req,res)=>{
    const {title,thumbnail,description,category,status}=req.body
    if([title,thumbnail,description,category,status].some((field)=>(field?.trim()===""))){
        throw new ApiError(400,"All fields are required")
   }
   const imageLocalPath=req.files?.image[0]?.path
   let mediaLocalPath;
   if(req.files && Array.isArray(req.files.media)&& req.files.media.length>0){
      mediaLocalPath=req.files.media[0].path
   }

   if(!imageLocalPath){
      throw new ApiError(400,"image is required")
   }
  const image= await uploadOnCloudinary(imageLocalPath)//jo response return  aaya
  const media=await uploadOnCloudinary(mediaLocalPath)
  if(!image){
   throw new ApiError(400,"image is required")
  }
  const user=await User.findById(req.user._id).select("-password -refreshToken")
 const blog=await Blog.create({title,
               image:image.url,
               media:media?media.url:null,
               thumbnail,
               description,
               // owner:
               owner:req.user._id,
               category,
               status,
             
            })
            
  user.postHistory.push(blog._id)
  await user.save()
 const createBlog=await Blog.findById(blog._id)
 console.log(createBlog)
   if(!createBlog){
      throw new ApiError(500,"something went wrong while creating the user")
   }
   return(
      res
      .status(200)
      .json(new ApiResponse(200,createBlog,"Published successfully"))
   )
 
})
const Editpost=asyncHandler(async(req,res)=>{
   const {title,thumbnail,description,category,status,_id}=req.body
   if([title,thumbnail,description,category,status].some((field)=>(field?.trim()===""))){
       throw new ApiError(400,"All fields are required")

  }
  const blog=await Blog.findByIdAndUpdate(_id,{
      $set:{
         title,
         thumbnail,
         description,
         category,
         status

      }
  },{new:true})
  if(!blog){
   throw new ApiError(500,"unable to update blog")
  }
  return res.status(200).json(new ApiResponse(200,blog,"blog updated successfully"))
})
const editImage=asyncHandler(async(req,res)=>{
   const {_id}=req.body
   const imageLocalPath=req.file?.path
   if(!imageLocalPath){
      throw new ApiError(400,"file is missing")
   }
   const image=await uploadOnCloudinary(imageLocalPath)
   if(!image.url){
      throw new ApiError(400,"Error while uploading")
   }
   const blog=await Blog.findByIdAndUpdate(_id,
      {
        $set:{ image:image.url } 
      },
      {
         new:true
      }
   )
   if(!blog){
      throw new ApiError(500,"unable to update")
   }
   return res.status(200)
            .json(new ApiResponse(200,blog,"image updated"))

   
})

const getPostByTitle = asyncHandler(async (req, res) => {
   const { title} = req.params
   if(!(title?.trim())){
      throw new ApiError(400,"title is missing")
   }
   const blog=await User.aggregate([
      {
         $match:{
            title:title?.toLowerCase()
         }
      },])
   //TODO: get video by id
})
const getPostById=asyncHandler(async(req,res)=>{
   const {blogId}=req.params
   const objectId = new Mongoose.Types.ObjectId(blogId);
  // const blog=await Blog.findById(id)
//   const createdBlog=await fetchBlog({
//          _id:blogId
//    },null,0,1)
    const createdBlog=await Blog.aggregate([
     {  $match:{
          _id:objectId
       }},
     {
          $lookup:{
             from:"users",
             localField:"owner",
             foreignField:"_id",
             as:"ownerDetails",
            pipeline:[
               {
                  $lookup:{
                     from:"follows",//hmlog Subscription aise save the models banate hue vo db m subscriptions
                     localField:"_id",
                     foreignField:"blogger",
                     as:"followers"
                  }
               },
               {
                  $lookup:{
                     from:"requests",
                     localField:'_id',
                     foreignField:'receiver',
                     as:"requests"
                  }
               },
               {
                  $addFields:{
                     followersCount:{
                        $size:"$followers"
                     },
                     
                     isFollowing:{
                        $cond:{
                           if:{$in:[req.user?._id,"$followers.follower"]},
                           then:true,
                           else:false
                        }  
                     },
                     reqStat:{
                        $cond:{
                           if:{$in:[req.user?._id,"$requests.sender"]},
                           then:true,
                           else:false
                        }

                     }
                  },
                  
               },
               
             
                             {
                                $project:{
                                   fullname:1,
                                   username:1,
                                  avatar:1,
                                   email:1,
                                   postHistory:1,
                                  _id:1,
                                  followers:1,
                                  followersCount:1,
                                  isFollowing:1,
                                  reqStat:1
                                }
                            },]
          }
       },{
          $lookup:{
             from:"likes",
             localField:"_id",
             foreignField:"blog",
             as:"likedBy",
            
          }
       },
       {
         $lookup:{
            from:"bookmarks",
            localField:'_id',
            foreignField:"blog",
            as:"bookmarked"
         }
       },
       {
         $lookup:{
          from:"comments",
          localField:"_id",
          foreignField:"blog",
          as:"CommentedBy",
          pipeline:[
            {
               $lookup:{
                  from:"users",
                  localField:"user",
                  foreignField:'_id',
                  as:"commentOwner",
                  pipeline:[
                     {
                        $project:{
                           fullname:1,
                           username:1,
                          avatar:1,
                           email:1,
                           
                          _id:1
                        }
                    },
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

          ]
         } 
       }
       ,
        {
               $addFields:{
                 ownerDetails:{
                    $first:"$ownerDetails"
                 },
                 likes:{
                   $size:{$ifNull:["$likedBy",[]]}
                 },
                 comments:{
                   $size:{$ifNull:["$CommentedBy",[]]}
                 },
                isLiked:{
                  $cond:{
                      if:{$in:[req.user?._id,{$ifNull:["$likedBy.likedBy",[]]}]},
                      then:true,
                      else:false
                   }  
                },
                isBookmarked:{
                  $cond:{
                     if:{$in:[req.user?._id,{$ifNull:["$bookmarked.user",[]]}]},
                     then:true,
                     else:false
                  }
                }
               }  
              }
    ])
   // console.log(1);
    console.log(createdBlog)
   if(!createdBlog.length===0){
      throw new ApiError(400,"Blog not found")
   }
   return res
   .status(200)
   .json(new ApiResponse(200,createdBlog[0],"Blog fetched successfully"))
})
const getAllPost=asyncHandler(async(req,res)=>{
      const posts=await Blog.find({})
      if(!posts){
         throw new ApiError(500,"something went wrong while fetching the posts")
      }
      console.log(posts)
      return (res
      .status(200)
      .json(new ApiResponse(200,posts,"all posts fetched")))



})
const getPostByCategory=asyncHandler(async(req,res)=>{
   const {category}=req.params
   const blog=await fetchBlog({category:category},null,0,6)
   if(!blog){
      throw new ApiError(404,"not found")
   }
   console.log(blog)
   return res
   .status(200)
   .json(new ApiResponse(200,blog,"category fetched successfully"))
})
const updateBlog=asyncHandler(async(req,res)=>{
   const {blogId}=req.body
})
const getUserPosts=asyncHandler(async(req,res)=>{
   const userId=req.user._id;
   console.log(userId)
   const objectId = new Mongoose.Types.ObjectId(userId);
   const page=parseInt(req.query.p)||0
      const blogsPerPage=10
   const blog=await fetchBlog({owner:objectId,status:"active"},null,blogsPerPage*page,blogsPerPage)
   if(!blog){
      return res.status(200).json(new ApiResponse(200,null,"no blogs found"))
   }
   return res.status(200).json(new ApiResponse(200,blog,"blogs fetched successully"))
})
const userDrafts=asyncHandler(async(req,res)=>{
   const userId=req.user._id;
   const page=parseInt(req.query.p)||0
      const blogsPerPage=10
      const objectId = new Mongoose.Types.ObjectId(userId);
      const blog=await Blog.find({owner:objectId,status:"inactive"}).populate({path:'owner',select:'username fullname avatar _id'})
   //const blog=await fetchBlog({owner:objectId,status:"inactive"},null,blogsPerPage*page,blogsPerPage)
   if( !blog){
      return res
      .status(200)
      .json(new ApiResponse(200,"You have no drafts"))
   }
   else{
      return res
      .status(200)
      .json(new ApiResponse(200,blog,"Drafts fetched successfully"))
   } 
})
const deletePost=asyncHandler(async(req,res)=>{
   const {blogId}=req.body
  
   const r=await Blog.findByIdAndDelete(blogId)
   console.log(r)
   console.log(blogId)
   const user=await User.findById(r.owner)
   user.postHistory=user.postHistory.filter((id)=>id.toString()!==blogId.toString())
   await user.save()
   if(r){
      return res
      .status(200)
      .json(new ApiResponse(200,user,"post deleted successfully"))
   }
   else{
      throw new ApiError(500,"unable to delete the post ")
   }
})

const getLiked=asyncHandler(async(req,res)=>{
   const userId=req.user._id
   
})

const latestBlogs=asyncHandler(async(req,res)=>{
   const page=parseInt(req.query.p)||0
   const blogsPerPage=15
   const blogs=await fetchBlog({
      status:"active"
   },
   {
      createdAt:-1
   },
   blogsPerPage*page,blogsPerPage
)
   // const blogs=await Blog.aggregate([{
   //    $sort:{
   //       createdAt:-1
   //    }
   // },
   
   // {$match:{
   //       status:"active"
   //    }

   // },
   // {
   //    $lookup:{
   //       from:"users",
   //       localField:"owner",
   //       foreignField:"_id",
   //       as:"Ownerdetails",
   //       pipeline:[
   //          {
   //             $project:{
   //                fullname:1,
   //                username:1,
   //                avatar:1,

   //             }
   //          },]}},
   //          {
   //             $lookup:{
   //                from:"likes",
   //                localField:"_id",
   //                foreignField:"blog",
   //                as:"likedBy"
   //             }
   //          },{
   //            $lookup:{
   //             from:"comments",
   //             localField:"_id",
   //             foreignField:"blog",
   //             as:"CommentedBy"
   //            } 
   //          }
   //          ,
   //           {
   //                  $addFields:{
   //                   Ownerdetails:{
   //                       $first:"$Ownerdetails"
   //                    },
   //                    likes:{
   //                      $size:{
   //                         $ifNull:["$likedBy",[]]
   //                      }
   //                    },
   //                    comments:{
   //                      $size:{
   //                         $ifNull:["$CommentedBy",[]]
   //                      }
   //                    },
   //                    isLiked:{
   //                      $cond:{
   //                         if:{$in:[req.user?._id,{$ifNull:["$likedBy.likedBy",[]]}]},
   //                         then:true,
   //                         else:false
   //                      }  
   //                   }
   //                  }  
   //                 },
   //                 {
   //                   $limit:blogsPerPage
   //                 },
   //                 {
   //                   $skip:
   //                      blogsPerPage*page
                     
   //                 }
         
      

   // ])
   //console.log(blogs)
   //const blogs=await Blog.sort({createdAt:-1}).limit(7);
   if(blogs.length==0){
      return res
      .status(200)
      .json(new ApiResponse(200,null,"not fetched successfully"))
   }
   return res
      .status(200)
      .json(new ApiResponse(200, blogs,"fetched successfully"))
})

const getBlogsOfType=asyncHandler(async(req,res)=>{
      const {type}=req.params
      const page=parseInt(req.query.p)||0
      const blogsPerPage=10
    if(type==="video"){
      // var videoBlogs=await Blog.find({
      //    media: { $ne: null },
      //    media: { $regex: /\.(mp4|avi|mov|wmv|flv)$/i }
      // }).populate('owner','username fullname avatar _id')
      
      // .limit(blogsPerPage).skip(blogsPerPage*page)
      var videoBlogs=await fetchBlog({media:{ $ne: null ,
          $regex: /\.(mp4|avi|mov|wmv|flv)$/i },status:"active"},null,blogsPerPage*page,blogsPerPage)
      if(videoBlogs){   
      videoBlogs.forEach((blog)=>
      blog.isLiked=blog.liked.some((id)=>id.toString()===req.user?._id.toString()))}

      
      if(!videoBlogs){
         throw new ApiError(400,"not found")
      }
      return res.status(200).json(new ApiResponse(200,videoBlogs,"Fetched successfully"))}
      else if(type==="audio"){
         // var audioblogs=await Blog.find({
         //    media:{$ne:null},
          
         //     media: { $regex: /\.(mp3|wav|flac|aac|ogg)$/i }
         // }).limit(blogsPerPage).skip(blogsPerPage*page)

         var audioblogs=await fetchBlog({media:{ $ne: null ,
            $regex: /\.(mp3|wav|flac|aac|ogg)$/i },status:"active"},null,blogsPerPage*page,blogsPerPage)


            if(audioblogs){   
               audioblogs.forEach((blog)=>
               blog.isLiked=blog.liked.some((id)=>id.toString()===req.user?._id.toString()))}
         
         if(!audioblogs){
            throw new ApiError(400,"not found")
         }
         return res.status(200).json(new ApiResponse(200,audioblogs,"Fetched successfully"))}

      
})

const trending=asyncHandler(async(req,res)=>{
   const basis=req.query.q
   const page=parseInt(req.query.p)||0
   const blogsPerPage=15
   if(basis==="likes"){
     
   
   const blogs=await Blog.aggregate([{
      $match:{
         status:"active"
      }
   },
   {
      $lookup:{
         from:"likes",
         foreignField:"blog",
         localField:"_id",
         as:"liked"
      }
   },{
      $addFields:{
         likes:{
            $size:{
               $ifNull:["$liked",[]]
            }
         }
      }
   },{
      $sort:{
         likes:-1,
      }},
            {
               $lookup:{
                  from:"users",
                  foreignField:"_id",
                  localField:"owner",
                  as:"ownerDetails",
                  pipeline:[
                     {
                        $project:{
                           username:1,
                           fullname:1,
                           avatar:1,
                           _id:1
                        }
                     }
                  ]
               },

            },
            {
               $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"blog",
                as:"CommentedBy"
               } 
             }
             ,
              {
                     $addFields:{
                       ownerDetails:{
                          $first:"$ownerDetails"
                       },
                      
                       comments:{
                         $size:{$ifNull:["$CommentedBy",[]]}
                       },
                       isLiked:{
                         $cond:{
                            if:{$in:[req.user?._id,{$ifNull:["$liked.likedBy",[]]}]},
                            then:true,
                            else:false
                         }  
                      }
                     }  
                    },
                   
   {
      $limit:blogsPerPage
    },
    
])
   //const blogs=await Blog.sort({createdAt:-1}).limit(7);
   if(blogs.length==0){
      return res
      .status(200)
      .json(new ApiResponse(200,"no blogs","not fetched successfully"))
   }
   return res
      .status(200)
      .json(new ApiResponse(200, blogs,"fetched successfully"))

}})

const similarPosts=asyncHandler(async(req,res)=>{
   const userId=req.query.u.toString()
   const user=await User.findById(userId)
   if(!user){
      throw new ApiError(400,"User not found")
   }
   const userPosts=user.postHistory
   console.log(userPosts)
   if(userPosts.length>0){
   userPosts.forEach((post)=>post.details=fetchParticular({_id:post}))
   if(!userPosts){
      throw new ApiError(400,"Unable to fetch")
   }
return res.status(200).json(new ApiResponse(200,userPosts," posts from this user")) 
 }
   else{
      return res.status(200).json(new ApiResponse(200,null,"No more posts from this user"))
   }
})

const searchBlog=asyncHandler(async(req,res)=>{
   const {title}=req.body
   console.log(title)
   const page=parseInt(req.query.p)||0
   const blogsPerPage=15
   const blogs=await fetchBlog({
    $or:[  {title:new RegExp(title,'i')},{thumbnail:new RegExp(title,'i')}]
   },
   {
      createdAt:-1
   },
   blogsPerPage*page,blogsPerPage
)
console.log(blogs)
   if( !blogs ){
      return res.status(200).json(new ApiResponse(200,null,"NO results found"))
   }
   return res.status(200).json(new ApiResponse(200,blogs," results found"))
})
export{
    publishPost,
    getAllPost,
    getPostByCategory,
    getUserPosts,
    userDrafts,
    updateBlog,
    getPostById,
    latestBlogs,
    trending,
    getBlogsOfType,
    similarPosts,
    deletePost,
    Editpost,
    editImage,
    searchBlog
}