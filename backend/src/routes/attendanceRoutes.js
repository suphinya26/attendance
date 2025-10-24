import express from "express";
import prisma from "../../prisma/client.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ✅ Middleware ตรวจ token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// 🕓 ฟังก์ชันคำนวณระยะทาง
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 🔹 ลงเวลาเข้า / ออก
router.post("/", authenticate, async (req, res) => {
  try {
    const { checkType, sessionType, latitude, longitude, locationId } =
      req.body;

    // 1. ตรวจสอบว่า locationId มีจริง
    const location = await prisma.location.findUnique({
      where: { id: parseInt(locationId) }, // 💡 ให้แน่ใจว่า id เป็น Int
    });

    // 💡 เพิ่มการจัดการถ้าไม่พบสถานที่
    if (!location) {
      return res.status(404).json({ error: "Location ID not found." });
    }

    // 2. แปลง Lat/Lon เป็นตัวเลขเพื่อความปลอดภัย
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res
        .status(400)
        .json({ error: "Invalid latitude or longitude format." });
    }

    // 3. คำนวณระยะทาง
    const distance = calcDistance(
      lat,
      lon,
      location.latitude,
      location.longitude
    );

    // 4. ตรวจสอบรัศมี
    if (distance > location.radius) {
      // 💡 คืนค่า 403 Forbidden หรือ 400 ตามความเหมาะสม และให้ข้อมูลชัดเจน
      return res.status(403).json({
        error: "Outside allowed area",
        distance: distance.toFixed(2), // แสดงระยะทาง
        allowedRadius: location.radius,
      });
    }

    // 5. สร้าง Record
    const record = await prisma.attendance.create({
      data: {
        userId: req.userId,
        locationId: parseInt(locationId),
        checkType,
        sessionType,
        latitude: lat,
        longitude: lon,
        verified: true,
      },
    });

    res.json({ message: "Attendance recorded", record });
  } catch (err) {
    // 💡 ในกรณีเกิด Error อื่นๆ ที่ไม่คาดคิด (เช่น DB Error)
    console.error("Attendance Post Error:", err.message);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

// 🔹 ดูประวัติย้อนหลังของผู้ใช้
router.get("/history", authenticate, async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      where: { userId: req.userId },
      include: { location: true },
      orderBy: { timestamp: "desc" },
    });
    res.json(records);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
