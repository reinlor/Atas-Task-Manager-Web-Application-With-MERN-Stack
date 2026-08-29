const account = require('../models/accountModel')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const nodemailer = require('nodemailer')


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

const generateConfirmationToken = (id, secret = process.env.JWT_SECRET) => {
    return jwt.sign({ id, type: "email_confirmation" }, secret, { expiresIn: '15m' })
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

async function generateConfirmationLink(user, isChangePass = false) {
    const { _id, email, username } = user
    const verificationToken = isChangePass
        ? generateConfirmationToken(_id, process.env.JWT_FORGOT_PASS_SECRET)
        : generateConfirmationToken(_id, process.env.JWT_VERIFICATION_SECRET)

    const finalUrl = isChangePass
        ? `${process.env.ORIGIN_URI}/forgot-pass?token=${verificationToken}`
        : `${process.env.ORIGIN_URI}/verify-email?token=${verificationToken}`;

    // TODO: Remove this log before production
    console.log("Sending email...")
    await transporter.sendMail({
        from: `"Atas-App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: isChangePass ? "Password Change Request" : "Verify your email address",
        html: `
        <h3>${isChangePass ? "Password Reset Request" : `Welcome to Atas App, ${username}!`}</h3>
        <p>${isChangePass ? "Please click the link below to reset your password:" : "Please click the link below to confirm your email address:"}</p>
        <a href="${finalUrl}">${finalUrl}</a>
        <p>This link will expire in 15 minutes.</p>`,
    });
    // TODO: Remove this log before production
    console.log("Free from email service")
}

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

        generateConfirmationLink(newAccount).catch(err =>
            console.error("Background email error (Sign Up):", err)
        );

        return res.status(201).json({
            _id: newAccount._id,
            username: newAccount.username,
            email: newAccount.email,
            message: "Registration Succesful! please check your email to verify your account"
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
        if (!myaccount.isVerified) {
            generateConfirmationLink(myaccount).catch(err =>
                console.error("Background email error (Login):", err)
            );

            return res.status(403).json({
                message: "Email is not verified yet. A new confirmation link has been sent to your email!"
            });
        }

        const token = generateToken(myaccount._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // TODO: Delete before production
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
                password: randomPassword,
                isVerified: true
            });
        }

        const token = generateToken(myGoogleAcc._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
        });

        // TODO: Delete before production
        console.log("token: ", req.cookies.token)

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

// Controller to verify user account after registration
exports.verifyAccount = async (req, res) => {
    try {
        const { token } = req.body;
        jwt.verify(token, process.env.JWT_VERIFICATION_SECRET)

        const { id } = jwt.decode(token, process.env.JWT_VERIFICATION_SECRET)
        const user = await account.findById(id)

        if (user.isVerified)
            return res.status(401).json({
                message: "User is Already Verified"
            })

        user.isVerified = true

        const updatedUser = await user.save();

        return res.status(200).json({
            message: "Account Verified Successfully",
            payload: user
        })
    } catch (error) {
        if (error.name === 'TokenExpiredError')
            return res.status(500).json({
                error: error.message,
                message: 'Token Expired'
            })
        return res.status(500).json({
            error: error.message,
            message: 'Server Error'
        })
    }
}

exports.forgotPassUrl = async (req, res) => {
    try {
        const { email } = req.body

        const myaccount = await account.findOne({ email })
        // instead of displaying an error message for hackers to scan, it is best to leave it as is 😏
        if (myaccount) {
            generateConfirmationLink(myaccount, true).catch(err =>
                console.error("Background email error (Sign Up):", err)
            );
        }

        return res.status(200).json({ message: "Change password url sent on email" })

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: 'Server Error'
        })
    }
}

exports.forgotPass = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body
        jwt.verify(token, process.env.JWT_FORGOT_PASS_SECRET)
        const { id } = jwt.decode(token, process.env.JWT_FORGOT_PASS_SECRET)

        // Might as well double check password again on the server muehuehueeae
        if (newPassword !== confirmPassword)
            return res.status(400).json({ message: 'Password does not match' })

        const user = await account.findById(id)
        user.password = confirmPassword
        await user.save()

        return res.status(200).json({ message: "Password succesfully changed!" })
    } catch (error) {
        if (error.name === 'TokenExpiredError')
            return res.status(500).json({
                error: error.message,
                message: 'Token Expired'
            })
        return res.status(500).json({
            error: error.message,
            message: 'Server Error'
        })
    }
}

// Controller to find user(s)
const mongoose = require('mongoose');

// Controller to find user(s) by username, email, or exact id
exports.getUser = async (req, res) => {
    try {
        const { info } = req.params;

        if (!info || info.trim() === '') {
            return res.status(400).json({ message: "Search parameter is required" });
        }

        const queryConditions = [
            { username: { $regex: info, $options: 'i' } },
            { email: { $regex: info, $options: 'i' } }
        ];

        if (mongoose.Types.ObjectId.isValid(info)) {
            queryConditions.push({ _id: info });
        }

        const users = await account.find({
            $or: queryConditions
        })
        .select('_id username email')
        .limit(10);

        return res.status(200).json({
            count: users.length,
            users
        });
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const me = await account.findById(req.user.id).select('_id username email');
        if (!me) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json(me);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};