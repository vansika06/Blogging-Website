import { Router } from "express";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { addComment,editComment,deleteComment ,getAllComments, commentedPosts} from "../controllers/comment.controllers.js";
const router=Router()
router.route('/post').post(verifyJWT,addComment)
router.route('/edit').post(verifyJWT,editComment)
router.route('/delete').post(verifyJWT,deleteComment)
router.route('/commentedPost').get(verifyJWT,commentedPosts)
router.route('/allComments/:blogId').get(verifyJWT,getAllComments)
export default router