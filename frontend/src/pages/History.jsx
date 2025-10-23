import React, { useState, useEffect } from "react";
import axios from "../axiosInstance";

export default function History() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await axios.get("/api/attendance/history");
      setRecords(res.data);
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>ประวัติการลงเวลา</h2>
      {records.length === 0 ? (
        <p>ยังไม่มีข้อมูล</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th>วันที่</th>
              <th>รอบ</th>
              <th>ประเภท</th>
              <th>สถานที่</th>
              <th>ยืนยันใบหน้า</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
                <td>{r.sessionType}</td>
                <td>{r.checkType}</td>
                <td>{r.location?.name}</td>
                <td>{r.verified ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
