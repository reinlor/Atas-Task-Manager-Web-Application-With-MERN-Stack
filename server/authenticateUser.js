const jwt = require('jsonwebtoken');

exports.authenticateUser = (req, res, next) => {
    try {
        const secretKey = process.env.JWT_SECRET;
        const token = req.cookies.token
        console.log("token: ", req.cookies.token)
        if (!token)
            return res.status(403).json({ message: "Forbidden! please log-in again" })

        jwt.verify(token, secretKey, (err, user) => {
            if (err)
                return res.status(403).json({ message: "Forbidden! please log-in again", error: err.message })

            req.user = user
            next()
        })
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message })
    }
}