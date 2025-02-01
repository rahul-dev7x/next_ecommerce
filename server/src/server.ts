import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv"
import express, { Request, Response } from "express"
import cookieParser from "cookie-parser";
import cors from "cors"
import authRoutes from "./routes/authRoutes"




dotenv.config({})
const app = express()
const PORT = process.env.PORT || 9000

export const prisma = new PrismaClient();


const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "UPDATE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}


app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use("/api/auth", authRoutes);





app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running" })
})





app.listen(PORT, () => {
    console.log(`Server is Running on:${PORT}`)
})