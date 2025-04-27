// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
const SECRET_KEY = "supersecret123";

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                console.error("Token verification error:", err);
                return res.status(403).json({ error: "Invalid token" });
            }

            req.user = user;
            console.log("Authenticated user:", user);
            next();
        });
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({ error: "Authentication error" });
    }
};

export const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        next();
    };
};