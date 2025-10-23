import React, { useState, useEffect } from "react";
import axios from "../axiosInstance";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const res = await axios.get("/api/users/me");
      setUser(res.data);
    })();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return alert("กรุณาเลือกรูปภาพก่อน");
    const formData = new FormData();
    formData.append("face", selectedFile);

    try {
      const res = await axios.post("/api/upload/face", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("อัปโหลดสำเร็จ ✅");
      setUser({ ...user, faceImage: res.data.url });
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    }
  };

  if (!user) return <p>กำลังโหลด...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>โปรไฟล์ของฉัน</h2>
      <p>
        <b>ชื่อ:</b> {user.name}
      </p>
      <p>
        <b>อีเมล:</b> {user.email}
      </p>

      <div>
        <h3>ภาพใบหน้า</h3>
        {user.faceImage ? (
          <img
            src={user.faceImage}
            alt="face"
            width={200}
            style={{ borderRadius: "8px", border: "1px solid #ddd" }}
          />
        ) : (
          <p>ยังไม่มีรูปใบหน้า</p>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ marginTop: 10 }}
        />
        <br />
        <button onClick={handleUpload} style={{ marginTop: 10 }}>
          อัปโหลดรูปใบหน้า
        </button>
        <p>{message}</p>
      </div>
    </div>
  );
}
