import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import prisma from "../../prisma/client.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer ใช้ memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// สมัครสมาชิก
router.post("/register", upload.single("face"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "กรอกข้อมูลไม่ครบ" });
    }

    // ตรวจว่ามีอีเมลนี้อยู่แล้วหรือไม่
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "อีเมลนี้มีอยู่แล้ว" });

    // เข้ารหัสรหัสผ่าน
    const hashed = await bcrypt.hash(password, 10);

    let faceImageUrl = null;
    if (req.file) {
      const ext = req.file.originalname.split(".").pop();
      const fileName = `face_register_${Date.now()}.${ext}`;
      const filePath = `face/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(filePath);

      faceImageUrl = publicUrl;
    }

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        faceImage: faceImageUrl,
      },
    });

    // สร้าง token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "สมัครสมาชิกสำเร็จ",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        faceImage: faceImageUrl,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// เข้าสู่ระบบ
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "กรอกข้อมูลให้ครบ" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "ไม่พบผู้ใช้นี้" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faceImage: user.faceImage,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" });
  }
});

/**
 * 🟩 Middleware ตรวจ token
 */
export const authenticate = (req, res, next) => {
  // <-- Removed 'export'
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};

/**
 * 🟩 ดึงข้อมูลผู้ใช้ปัจจุบัน
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        faceImage: true,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
