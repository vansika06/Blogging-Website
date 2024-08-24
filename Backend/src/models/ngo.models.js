import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const ngoSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    Id:{
        type:String,
        required:true 
    },
    address:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    email:{
    type:String,
    required:true,
     lowercase:true,
    trim:true,
    },
    password:{
        type:String,
        required:[true,'Password is required']
     },
     avatar:{
        type:String, //cloudinary se url use
       // required:true
     },
     refreshToken:{
        type:String
     },
     verifyToken:{
        type:String
     },
     verifyTokenExpiry:{
        type:Date
     },
     forgetToken:{
        type:String
     },
     forgetTokenExpiry:{
        type:Date
     },
     isVerified:{
        type:Boolean,
        default:false
     },
     pNumber:{
      type:String,
      required:true
     }
},{timestamps:true})

ngoSchema.pre("save",async function(next){
   if(!this.isModified("password")) return next()
   this.password=await bcrypt.hash(this.password,10)
   next()
})



ngoSchema.methods.isPasswordCorrect=async function (password) {
   return await  bcrypt.compare(password,this.password)
}


ngoSchema.methods.generateAToken=function(){
   return  jwt.sign({
       _id:this._id,
       email:this.email,
       name:this.name,
       
   },process.env.ACCESS_TOKEN_SECRET,
   {
       expiresIn:process.env.ACCESS_TOKEN_EXPIRY
   })
}
ngoSchema.methods.generateRToken=function(){
   return  jwt.sign({
       _id:this._id,
      
   },process.env.REFRESH_TOKEN_SECRET,
   {
       expiresIn:process.env.REFRESH_TOKEN_EXPIRY
   })
}
export const Ngo=mongoose.model("Ngo",ngoSchema)