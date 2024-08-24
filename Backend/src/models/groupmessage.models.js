import mongoose from "mongoose";
const groupmessageSchema=new mongoose.Schema({
    message:{
        type:String,
        
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    image:{
        type:String,
        default:""
    },
    groupId:{
         type:mongoose.Schema.Types.ObjectId,
        ref:"Channel"
    }
},{timestamps:true})
export const Groupmessage=mongoose.model("Groupmessage",groupmessageSchema)