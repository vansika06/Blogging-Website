import {Router} from "express"
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { verifyJWTNgo } from "../Middlewares/ngo.middleware.js";
import { register,addEvent,getAllEvents,loginNgo,logOutNgo } from "../controllers/ngo.controller.js";
const router=Router()
router.route('/registerNgo').post(upload.single("avatar"),register)
router.route("/loginNgo").post(loginNgo)
router.route("/logoutNgo").get(verifyJWTNgo,logOutNgo)
router.route("/addEvent").post(verifyJWTNgo,upload.single("image"),addEvent)
router.route('/getAllEvents').get(verifyJWTNgo,getAllEvents)
export default router