import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./src/routes/userRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  // 1. กำหนด Origin ที่อนุญาต
  const allowedOrigins = [
    // 🔑 ใช้ HTTPS:// สำหรับ Vercel เสมอ
    "https://attendance-34i1b5u1b-suphinyas-projects.vercel.app",
    "http://localhost:5173",
  ];
  const origin = req.headers.origin;

  // 2. ตรวจสอบและ Set Header Access-Control-Allow-Origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // ถ้าคุณต้องการอนุญาตทุก Origin ใน Production ชั่วคราว:
  // res.setHeader('Access-Control-Allow-Origin', '*');

  // 3. กำหนด Header อื่น ๆ ที่จำเป็นสำหรับ CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // 4. จัดการ OPTIONS Request (Preflight) ให้ถูกต้อง
  if (req.method === "OPTIONS") {
    // ส่ง 200/204 กลับไปทันที เพื่อให้เบราว์เซอร์อนุญาตการเรียกจริง
    return res.sendStatus(200);
  }

  next();
});

// app.use(
//   cors({
//     origin: [
//       "https://attendance-34i1b5u1b-suphinyas-projects.vercel.app",
//       "http://localhost:5173",
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );

app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("✅ Attendance API is running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
