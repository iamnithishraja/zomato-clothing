import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDatabse } from "./config/database";
import userRoute from "./routes/userRoutes";


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

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
