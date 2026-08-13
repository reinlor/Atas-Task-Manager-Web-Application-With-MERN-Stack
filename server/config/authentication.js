const jwt = require('jsonwebtoken')

const secretkey = process.env.JWT_SECRET;

module.exports = function authenticationToken(req, res, next) {
    const token = req.cookies.token;
    console.log("token: ", token);

    if (token == null) return res.status(401).json({ message: 'Token not found' });

    jwt.verify(token, secretkey, (err, user) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(403).json({ message: "Token is Expired" });
            }
            return res.status(403).json({ message: "Invalid Token", error: err.message });
        }

        req.user = user;
        console.log("user: ", req.user);
        next();
    });
};