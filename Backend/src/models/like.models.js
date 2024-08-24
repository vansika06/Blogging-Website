import mongoose,{Schema} from "mongoose";
const likeSchema=new Schema({
    //comment,kaun kiya,post
    
    blog:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Blog"
    },
    likedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
  
},{timestamps:true})
export const Like=mongoose.model("Like",likeSchema)