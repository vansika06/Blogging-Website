import mongoose from "mongoose";
const followerSchema=new mongoose.Schema({
    follower:{//one who is following
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    blogger:{
        type:mongoose.Schema.Types.ObjectId,//one to whom following
        ref:"User",
        required:true
    }
},{timestamps:true})
export const Follow=mongoose.model("Follow",followerSchema)