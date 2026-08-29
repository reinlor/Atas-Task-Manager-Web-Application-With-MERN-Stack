const express = require('express');
const router = express.Router();
const authToken = require('../config/authentication')
const { createAccount, loginAccount, logoutAccount, googleLogin, getUser, verifyAccount, forgotPassUrl, forgotPass, getMe } = require('../controllers/accountController')

router.post("/create", createAccount);
router.post("/login", loginAccount);
router.post("/logout", logoutAccount);
router.post("/auth/google", googleLogin);

router.post("/verify", verifyAccount)
router.post("/forgotPass", forgotPassUrl)
router.post("/newPass", forgotPass)

router.get("/get/:info", getUser)
router.get('/me', authToken, getMe);

module.exports = router