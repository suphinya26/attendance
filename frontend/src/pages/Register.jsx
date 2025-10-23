import React, { useState } from "react";
import axios from "../axiosInstance";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [face, setFace] = useState(null);
  const [message, setMessage] = useState("");
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setMessage("❌ รหัสผ่านไม่ตรงกัน");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (face) formData.append("face", face);

    try {
      await axios.post("/api/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("✅ สมัครสมาชิกสำเร็จ! กำลังนำไปหน้าเข้าสู่ระบบ...");
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 420, margin: "40px auto" }}>
      <h2>สมัครสมาชิก</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>ชื่อ-นามสกุล</label>
          <br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>อีเมล</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>รหัสผ่าน</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>ยืนยันรหัสผ่าน</label>
          <br />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>อัปโหลดรูปใบหน้า (ถ้ามี)</label>
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFace(e.target.files[0])}
          />
          {face && (
            <div style={{ marginTop: 10 }}>
              <img
                src={URL.createObjectURL(face)}
                alt="preview"
                width={150}
                style={{ borderRadius: "8px" }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        >
          สมัครสมาชิก
        </button>
      </form>

      <p style={{ marginTop: 10 }}>
        มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
      </p>

      <p>{message}</p>
    </div>
  );
}
