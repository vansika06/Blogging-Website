import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const blogSchema=new mongoose.Schema({
    image:{
        type:String,//cloudinary url
        required:true,
        
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    description:{
        type:String,
        required:true
    },
    
    views:{
        type:Number,
        default:0
    },
   
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    category:{
        type:String,
        enum:["Health","Technology","Coding","Entertainment","General","Business"],
        required:true
    },
    status:{
        type:String,
        enum:["active","inactive"],
        required:true
    }
    ,media:{
        type:String,
        default:null
    }

},{timestamps:true})
blogSchema.plugin(mongooseAggregatePaginate)
export const Blog=mongoose.model("Blog",blogSchema)