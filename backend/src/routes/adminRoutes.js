import express from "express";
import prisma from "../../prisma/client.js";
import { authenticate } from "./userRoutes.js";

const router = express.Router();

// ✅ ตรวจ role admin
const isAdmin = (req, res, next) => {
  if (req.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }
  next();
};

// 🟩 ดึงสถานที่ทั้งหมด
router.get("/locations", authenticate, isAdmin, async (req, res) => {
  const locations = await prisma.location.findMany({
    orderBy: { id: "asc" },
  });
  res.json(locations);
});

// 🟩 เพิ่มสถานที่ใหม่
router.post("/locations", authenticate, isAdmin, async (req, res) => {
  try {
    const { name, latitude, longitude, radius } = req.body;
    const newLocation = await prisma.location.create({
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius) || 200,
      },
    });
    res.json({ message: "เพิ่มสถานที่สำเร็จ", location: newLocation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟩 แก้ไขสถานที่
router.put("/locations/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius } = req.body;
    const updated = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius),
      },
    });
    res.json({ message: "อัปเดตข้อมูลสำเร็จ", location: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟩 ลบสถานที่
router.delete("/locations/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.location.delete({ where: { id: parseInt(id) } });
    res.json({ message: "ลบสถานที่สำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 [NEW] GET /employees - ดึงรายการพนักงานทั้งหมด
router.get("/employees", authenticate, isAdmin, async (req, res) => {
  try {
    // ดึง User ทั้งหมดที่มี role เป็น 'employee'
    const employees = await prisma.user.findMany({
      where: {
        role: "employee",
      },
      // เลือกเฉพาะฟิลด์ที่จำเป็น (ยกเว้นรหัสผ่าน)
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        faceImage: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ error: "Failed to retrieve employee list." });
  }
});

export default router;
