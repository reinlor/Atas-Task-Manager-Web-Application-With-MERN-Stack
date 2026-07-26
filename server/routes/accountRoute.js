const express = require('express');
const router = express.Router();
const {createAccount, loginAccount, logoutAccount, googleLogin, getMyInfo} = require('../controllers/accountController')

router.post("/create", createAccount);
router.post("/login", loginAccount);
router.post("/logout", logoutAccount);
router.post("/auth/google", googleLogin);

router.get("/get", getMyInfo)

module.exports = router