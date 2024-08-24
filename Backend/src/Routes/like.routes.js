import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import {getAllLikedPosts, toggleLike} from '../controllers/like.controllers.js'
const router=Router()
router.route('/handleLike').post(verifyJWT,toggleLike)
router.route("/userliked").get(verifyJWT,getAllLikedPosts)

//router.route('/unfollow').post(unfollow)
export default router