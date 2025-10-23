const express = require("express");
const prisma = require("../../prisma/client");
const jwt = require("jsonwebtoken");

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

    // ตรวจว่าผู้ใช้ลงภายในรัศมีไหม
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });
    const distance = calcDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );

    if (distance > location.radius) {
      return res.status(400).json({ error: "Outside allowed area" });
    }

    const record = await prisma.attendance.create({
      data: {
        userId: req.userId,
        locationId,
        checkType,
        sessionType,
        latitude,
        longitude,
        verified: true, // สมมติว่ายืนยันใบหน้าแล้ว
      },
    });

    res.json({ message: "Attendance recorded", record });
  } catch (err) {
    res.status(400).json({ error: err.message });
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

module.exports = router;
