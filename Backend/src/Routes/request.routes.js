import {Router} from "express"
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { getFollowers, getRequest,sendRequest } from "../controllers/request.controller.js";
const router=Router()
router.route('/send').post(verifyJWT,sendRequest)
router.route('/get').get(verifyJWT,getRequest)
router.route('/friend').get(verifyJWT,getFollowers)
export default router