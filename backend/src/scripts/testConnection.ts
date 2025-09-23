import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testConnection() {
    try {
        console.log("🔄 Testing database connection...");
        console.log("DB_URL:", process.env.DB_URL || "mongodb://localhost:27017/locals");
        
        // Connect to database
        await mongoose.connect(process.env.DB_URL || "mongodb://localhost:27017/locals");
        console.log("✅ Connected to database successfully");
        
        // Test basic operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("📋 Available collections:", collections.map(col => col.name));
        
        console.log("🎉 Database connection test completed!");
        
    } catch (error) {
        console.error("❌ Connection test failed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed");
    }
}

testConnection();
