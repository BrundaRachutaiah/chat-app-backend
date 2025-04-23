const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const http = require("http")
dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())
const authRouters = require("./routers/auth.js")
const {Server} = require("socket.io")
const message = require("./models/message.js")
const user = require("./models/user.js")
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
})

io.on("connection", (socket) => {
    console.log("User connected", socket.id)
    socket.on("send_message", async(data) => {
        const {sender, receiver, message} = data
        const newMessage = new message({sender, receiver, message})
        await newMessage.save()
        socket.broadcast.emit("receive_message", data)
    })
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id)
    })
}) 

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("mongodb connected"))
    .catch(error => console.error(error))

app.use("/auth", authRouters)

app.get("/message", async (req,res) => {
    const {sender, receiver} = req.query
    try {
        const Message = await message.find({
            $or: [{sender, receiver}, {sender: receiver, receiver: sender}]
        }).sort({createdAt:1})
        res.json(Message)
    } catch (error) {
        res.status(500).json({message: "Error frtching messages"})
    }
})

app.get("/users", async (req,res) => {
    const {currentUser} = req.query
    try {
        const users = await user.find({
            username: {$ne: currentUser}
        })
        res.json(users)
    } catch (error) {
        res.status(500).json({message: "error fetching users"})
    }
})

const PORT = process.env.PORT || 5001

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})


