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
  // 💡 อนุญาต Origin ที่ถูกต้อง และ HTTPS
  const allowedOrigins = [
    "https://attendance-34i1b5u1b-suphinyas-projects.vercel.app",
    "http://localhost:5173",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // ตั้งค่า Header ที่จำเป็นอื่นๆ สำหรับ Preflight
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // สำหรับ OPTIONS request (Preflight) ให้ส่ง 200/204 กลับไปทันที
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // 💡 ปิด CORS ด้วยตัวเอง
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
