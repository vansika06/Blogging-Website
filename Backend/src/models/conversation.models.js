import mongoose from "mongoose";
const conversationSchema=new mongoose.Schema({
    participants:[
       { type:mongoose.Schema.Types.ObjectId,
        ref:"User"}
    ],
    lastMsg:
       { sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
        },
    message:{
        type:String,
        required:true
    }}
    
        
    
},{timestamps:true})
 export const Conversation= mongoose.model("Conversation",conversationSchema)