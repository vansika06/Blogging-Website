import dotenv from "dotenv"
import mongoose, { connect } from "mongoose"
import {DB_NAME} from "./constants.js"
import connectDB from "./db/index.js"
import { app,io,server } from "./app.js"
dotenv.config({
    path:'./env'
})
connectDB()
.then(()=>{
  server.on("error",(e)=>{
    console.log(e);
    throw e
  })
  server.listen(process.env.PORT||8000,()=>{
    console.log(`Server running at :${process.env.PORT||8000}`)
  })
})
.catch((e)=>{
  console.log("MongoDb connection failed::",e)
})