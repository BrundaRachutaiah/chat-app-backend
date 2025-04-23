const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const user = require("../models/user.js")
const dotenv = require("dotenv")
dotenv.config()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET

router.post("/register", async (req,res) => {
    const {username, password} = req.body
    try {
        const existingUser = await user.findOne({username})
        if(existingUser){
            return res.status(400).json({message: "User already existes. Please login"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const User = new user({username: username, password: hashedPassword})
        await User.save()

        const token = jwt.sign({id: user._id}, JWT_SECRET, {expiresIn: "4h"})
        res.status(201).json({message: "User registers successfully", token, username})
    } catch (error) {
        res.status(500).json({message: "server error", error: error})
    }
})

router.post("/login", async (req,res) => {
    const {username, password} = req.body
    try {
        const User = await user.findOne({username})
        if(!User){
            return res.status(404).json({message: "user not found."})
        }
        const isPasswordMatch = await User.comparePassword(password)
        if(!isPasswordMatch){
            return res.status(400).json({message: "Invalid credentials"})
        }
        res.status(200).json({message: "login successfull", username: User.username})
    } catch (error) {
        res.status(500).json({message: "server error while login", error: error})
    }
})

module.exports = router
