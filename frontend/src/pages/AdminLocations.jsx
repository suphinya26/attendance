import React, { useEffect, useState } from "react";
import axios from "../axiosInstance";

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: 200,
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  const fetchLocations = async () => {
    const res = await axios.get("/api/admin/locations");
    setLocations(res.data);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`/api/admin/locations/${editId}`, form);
        setMessage("✅ อัปเดตข้อมูลสำเร็จ");
      } else {
        await axios.post("/api/admin/locations", form);
        setMessage("✅ เพิ่มสถานที่สำเร็จ");
      }
      setForm({ name: "", latitude: "", longitude: "", radius: 200 });
      setEditId(null);
      fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ต้องการลบสถานที่นี้ใช่ไหม?")) return;
    await axios.delete(`/api/admin/locations/${id}`);
    fetchLocations();
  };

  const handleEdit = (loc) => {
    setEditId(loc.id);
    setForm({
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.radius,
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>จัดการสถานที่ (Admin)</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          placeholder="ชื่อสถานที่"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Latitude"
          type="number"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          required
          step="any"
        />
        <input
          placeholder="Longitude"
          type="number"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          required
          step="any"
        />
        <input
          placeholder="Radius (m)"
          type="number"
          value={form.radius}
          onChange={(e) => setForm({ ...form, radius: e.target.value })}
          required
        />
        <button type="submit">
          {editId ? "บันทึกการแก้ไข" : "เพิ่มสถานที่"}
        </button>
      </form>

      <p>{message}</p>

      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>ชื่อสถานที่</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Radius</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id}>
              <td>{loc.id}</td>
              <td>{loc.name}</td>
              <td>{loc.latitude}</td>
              <td>{loc.longitude}</td>
              <td>{loc.radius}</td>
              <td>
                <button onClick={() => handleEdit(loc)}>แก้ไข</button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  style={{ marginLeft: 8, color: "red" }}
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
