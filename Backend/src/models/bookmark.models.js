import mongoose from "mongoose";
const bookmarkSchema=new mongoose.Schema({
    blog:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Blog",
        reqired:true
    },
    
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        }
    
},{timestamps:true})
export const Bookmark=mongoose.model("Bookmark",bookmarkSchema)
