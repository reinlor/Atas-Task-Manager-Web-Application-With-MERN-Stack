const account = require('../models/accountModel')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

// Controller to gather user Data

// Controller to create or register a user account
exports.createAccount = async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const accountExits = await account.findOne({ email })
        if (accountExits) return res.status(400).json({ message: "User already exist!" });

        const newAccount = await account.create({
            username,
            password,
            email
        })
        const token = generateToken(newAccount._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
        })

        return res.status(201).json({
            _id: newAccount._id,
            username: newAccount.username,
            email: newAccount.email
        })
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

// Controller to Login user account
exports.loginAccount = async (req, res) => {
    const { email, password } = req.body;

    try {
        const myaccount = await account.findOne({ email });
        if (!myaccount) return res.status(401).json({ message: "Invalid email or password " });
        const checkPassword = await myaccount.matchPassword(password);
        if (!checkPassword) return res.status(401).json({ message: "Invalid email or password " });

        const token = generateToken(myaccount._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        console.log("token: ", req.cookies.token)

        res.json({
            _id: myaccount._id,
            username: myaccount.username,
            email: myaccount.email
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

// Controlelr to Login user via Google Login
exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken)
        return res.status(400).json({ message: "Google Token is Missing" })

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload();
        const { email, name, sub } = payload;

        let myGoogleAcc = await account.findOne({ email });

        if (!myGoogleAcc) {
            const randomPassword = Math.random().toString(36).slice(-8) + sub;

            myGoogleAcc = await account.create({
                username: name,
                email: email,
                password: randomPassword
            });
        }

        const token = generateToken(myGoogleAcc._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
        });

        return res.status(200).json({
            _id: myGoogleAcc._id,
            username: myGoogleAcc.username,
            email: myGoogleAcc.email
        });

    } catch (error) {
        return res.status(400).json({
            message: "Google authentication failed",
            error: error.message
        });
    }
}

// Controller to logout user cleanly
exports.logoutAccount = async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    res.status(200).json({ message: 'Logged out successfully' });
};

// Sample get account data for authentication testing will soon be deleted
exports.getMyInfo = async (req, res) => {
    try {
        const myId = req.user.id
        const user = await account.findById(myId)
        return res.status(200).send(user);
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message })
    }
}