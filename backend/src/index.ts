import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDatabase } from "./config/database";
import userRoute from "./routes/userRoutes";
import storeRoute from "./routes/storeRoutes";
import productRoute from "./routes/productRoutes";
import uploadRoute from "./routes/uploadRoutes";
import orderRoute from "./routes/orderRoutes";
import deliveryRoute from "./routes/deliveryRoutes";
import favoriteRoute from "./routes/favoriteRoutes";
import paymentRoute from "./routes/paymentRoutes";
import merchantOrderRoute from "./routes/merchantOrderRoutes";
import codRoute from "./routes/codRoutes";
import storeRatingRoute from "./routes/storeRatingRoutes";
import deliveryAssignmentRoute from "./routes/deliveryAssignmentRoutes";
import settlementRoute from "./routes/settlementRoutes";
import { initializeRazorpay } from "./controllers/paymentController";
import { requestTimeout } from "./middleware/timeout";
// import { sanitizeInput } from "./middleware/sanitize"; // Disabled for now, will enable in production

dotenv.config();
const app = express();

connectDatabase();

// Initialize Razorpay (support multiple env var names)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEYID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_API_SECRET;

if (razorpayKeyId && razorpayKeySecret) {
  initializeRazorpay(razorpayKeyId, razorpayKeySecret);
} else {
  console.warn("Razorpay credentials not found. Payment functionality will not work.");
}

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization middleware - DISABLED FOR DEVELOPMENT
// TODO: Enable in production by uncommenting the line below
// app.use(sanitizeInput);

// Global request timeout middleware (30 seconds default)
app.use(requestTimeout(30000));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/store", storeRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/upload", uploadRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/delivery", deliveryRoute);
app.use("/api/v1/favorite", favoriteRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/merchant-order", merchantOrderRoute);
app.use("/api/v1/cod", codRoute);
app.use("/api/v1/stores", storeRatingRoute);
app.use("/api/v1/delivery-assignment", deliveryAssignmentRoute);
app.use("/api/v1/settlement", settlementRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});