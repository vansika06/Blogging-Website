import { Router } from "express";

import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { toggleBookmark,getAllbookmarks } from "../controllers/bookmark.controller.js";
const router=Router()
router.route('/toggle').post(verifyJWT,toggleBookmark)
router.route('/show').get(verifyJWT,getAllbookmarks)
export default router