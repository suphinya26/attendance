import React, { useState } from "react";
import axios from "../axiosInstance";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      setMessage("เข้าสู่ระบบสำเร็จ ✅");
      setTimeout(() => nav("/attendance"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "50px auto" }}>
      <h2>เข้าสู่ระบบ</h2>

      <form onSubmit={handleLogin}>
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

        <button
          type="submit"
          style={{ width: "100%", padding: 8, marginTop: 10 }}
        >
          เข้าสู่ระบบ
        </button>
      </form>

      <p style={{ marginTop: 10 }}>
        ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
      </p>

      <p>{message}</p>
    </div>
  );
}
