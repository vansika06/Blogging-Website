import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getParticularuser, getUserById, getUserChannelProfile, getWatchHistory, logOutUser, loginUser, refreshAccessToken, registerUser,updateAccountDetails, updateAvatar, updateCoverImage,verifyEmail,verifyOtp } from "../controllers/user.controller.js"
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
const router=Router()


router.route("/register").post(upload.single("avatar"),registerUser)
router.route("/login").post(loginUser)


//secured routes

router.route("/logout").get(verifyJWT,logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/currentUser").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)
router.route("/user").post(verifyJWT,getUserById)
router.route("/xyz/:userId").get(verifyJWT,getParticularuser)
router.route("/sendmail").post(verifyEmail)
router.route("/verify").post(verifyOtp)

export default router