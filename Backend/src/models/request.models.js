import mongoose from "mongoose";
const requestSchema=new mongoose.Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    receiver:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})
export const Request=mongoose.model("Request",requestSchema)