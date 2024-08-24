import mongoose from "mongoose";
const channelSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    participants:[{type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }],
    lastmessage:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Groupmessage"
    }]
},{timestamps:true})
export const Channel=mongoose.model("Channel",channelSchema)