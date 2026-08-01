const express = require('express');
const router = express.Router();
const { createAccount, loginAccount, logoutAccount, googleLogin, getMyInfo, verifyAccount } = require('../controllers/accountController')

router.post("/create", createAccount);
router.post("/login", loginAccount);
router.post("/logout", logoutAccount);
router.post("/auth/google", googleLogin);

router.get("/get", getMyInfo)
router.post("/verify", verifyAccount)

module.exports = router