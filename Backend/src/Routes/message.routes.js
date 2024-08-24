import {Router} from "express"

import { getAllmessages, getUserMessage, sendMessage } from "../controllers/message.controller.js"
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
const router=Router()
router.route("/send").post(verifyJWT,upload.single('image'),sendMessage)
router.route("/all/:id1").get(verifyJWT,getAllmessages)
router.route('/userConversations').get(verifyJWT,getUserMessage)
export default router