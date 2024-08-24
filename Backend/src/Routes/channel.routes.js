import {Router} from "express"

import { createChannel, getChannelMessage, getChannels, sendMessage } from "../controllers/channel.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
const router=Router()
router.route("/create").post(verifyJWT,createChannel)
router.route("/get").get(verifyJWT,getChannels)
router.route("/sendMsg").post(verifyJWT,upload.single("image"),sendMessage)
router.route("/getMsg/:groupId").get(verifyJWT,getChannelMessage)
export default router