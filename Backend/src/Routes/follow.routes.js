import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import {toggleFollow} from '../controllers/follow.controller.js'
const router=Router()
router.route('/follows').post(verifyJWT,toggleFollow)
//router.route('/unfollow').post(unfollow)
export default router