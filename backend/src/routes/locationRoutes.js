import express from "express";
import prisma from "../../prisma/client.js";

const router = express.Router();

// เพิ่มสถานที่
router.post("/", async (req, res) => {
  try {
    const { name, latitude, longitude, radius } = req.body;
    const location = await prisma.location.create({
      data: { name, latitude, longitude, radius },
    });
    res.json(location);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ดูสถานที่ทั้งหมด
router.get("/", async (req, res) => {
  const locations = await prisma.location.findMany();
  res.json(locations);
});

export default router;
