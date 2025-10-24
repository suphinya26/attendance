import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import prisma from "../../prisma/client.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ✅ สร้าง Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Middleware ตรวจ Token
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

// ✅ ใช้ multer จัดการไฟล์ใน memory (ไม่บันทึกใน local)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ อัปโหลดรูปใบหน้า
router.post("/face", authenticate, upload.single("face"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileExt = file.originalname.split(".").pop();
    const fileName = `user_${req.userId}_${Date.now()}.${fileExt}`;
    const filePath = `face/${fileName}`;

    // อัปโหลดไฟล์ไป Supabase Storage
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    // สร้าง public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    // บันทึก URL ลงในฐานข้อมูล
    await prisma.user.update({
      where: { id: req.userId },
      data: { faceImage: publicUrl },
    });

    res.json({ message: "✅ Uploaded successfully", url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
