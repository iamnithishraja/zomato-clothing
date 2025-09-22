import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDatabse } from "./config/database";
import userRoute from "./routes/userRoutes";
import storeRoute from "./routes/storeRoutes";
import productRoute from "./routes/productRoutes";


dotenv.config();
const app = express();

connectDatabse();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/store", storeRoute);
app.use("/api/v1/product", productRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
