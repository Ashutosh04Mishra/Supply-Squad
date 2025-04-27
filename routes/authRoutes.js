import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const SECRET_KEY = "supersecret123";

router.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            password: hashedPassword,
            role: role || "Admin"
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            SECRET_KEY,
            { expiresIn: "24h" }
        );

        res.json({ 
            message: "Login successful",
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

export default router;