import {Blog} from '../models/Blog.models.js'

const fetchBlog=async(matchcondition,sortcondition,skip,limit)=>{
    sortcondition=sortcondition||{createdAt:-1}
    console.log(skip)
    console.log(limit)
    try{
        const blogs=await Blog.aggregate([
            {
                $match:
                    matchcondition
                
            },
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
              },
              {
                $lookup:{
                   from:"likes",
                   foreignField:"blog",
                   localField:"_id",
                   as:"liked"
                }
             },
             
             {
                $addFields:{
                  ownerDetails:{
                     $first:"$ownerDetails"
                  },
                  likes:{
                    $size:{
                       $ifNull:["$liked",[]]
                    }
                 },
                  comments:{
                    $size:{$ifNull:["$CommentedBy",[]]}
                  },
                 
                }  
               },
               {
                $sort:sortcondition
             },
             {
                $skip:skip
             },{
                $limit:limit
             }
        ])
        if(blogs.length===0){
            return null
        }
        else{
            console.log(blogs)
            return blogs
            
        }

    }
    catch(e){
        console.log(e)
        return e
    }
}
const fetchParticular=async(matchcondition)=>{
   try{
      const blogs=await Blog.aggregate([
          {
              $match:
                  matchcondition
              
          },
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
            },
            {
              $lookup:{
                 from:"likes",
                 foreignField:"blog",
                 localField:"_id",
                 as:"liked"
              }
           },
           
           {
              $addFields:{
                ownerDetails:{
                   $first:"$ownerDetails"
                },
                likes:{
                  $size:{
                     $ifNull:["$liked",[]]
                  }
               },
                comments:{
                  $size:{$ifNull:["$CommentedBy",[]]}
                },
               
              }  
             },
            
      ])
      if(blogs.length===0){
          return null
      }
      else{
          console.log(blogs)
          return blogs[0]
          
      }

  }
  catch(e){
      console.log(e)
      return e
  }

}


export {fetchBlog,fetchParticular}