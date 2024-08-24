import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";

import { Ngo } from "../models/ngo.models.js";
import jwt from "jsonwebtoken"
export const verifyJWTNgo=asyncHandler(async(req,res,next)=>{//since middleware next()
   try {
    const token= req.cookies?.accessToken||req.header("Authorizatin")?.replace("Bearer ","")
    if(!token){
     throw new ApiError(401,"Unauthorized request")
    }
    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const ngo=await Ngo.findById(decodedToken?._id).select("-password -refreshToken")
    console.log(ngo)
    if(!ngo){

     throw new ApiError(401,"Invalid Access Token")
    }
    req.ngo=ngo;
    next();
   } catch (error) {
    throw new ApiError(401,"Invalid Access Token")
   }
})