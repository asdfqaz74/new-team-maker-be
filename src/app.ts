import dotenv from "dotenv";

// 환경에 따라 다른 .env 파일 로드 (다른 모듈보다 먼저 실행)
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "@/config/db";
import routes from "@/routes";

// Connect to Database
connectDB();

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // 프론트엔드 주소
    credentials: true, // 쿠키 허용
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api", routes);

// Base route
app.get("/", (req: Request, res: Response) => {
  res.send("Team Maker Backend API is running!");
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
