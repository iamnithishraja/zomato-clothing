import dotenv from "dotenv";
dotenv.config()
import mongoose from "mongoose";

function connectDatabase() {
    mongoose.connect(process.env.DB_URL || "").then(
        () => { console.log("Database connected successfully") }
    ).catch(err => {
        console.log("Database connection error:", err);
    });
}

export { connectDatabase };