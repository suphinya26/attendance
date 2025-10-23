// src/pages/AdminPage.jsx
import React, { useState, useEffect } from "react";
import axios from "../axiosInstance";

// Styles สำหรับ AdminPage (ใช้ Inline CSS ต่อเนื่อง)
const adminStyles = {
  // ... (คุณสามารถเพิ่ม style สำหรับหน้า Admin เช่น container, table ได้เอง)
  button: {
    backgroundColor: "#00796b",
    color: "white",
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  },
  // ...
};

const AdminPage = () => {
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 1. ดึงข้อมูลพนักงานและ Location ทั้งหมด
  useEffect(() => {
    const fetchData = async () => {
      try {
        // สมมติว่ามี Endpoint สำหรับดึงพนักงานและ Location ทั้งหมด
        const [empRes, locRes] = await Promise.all([
          axios.get("/api/admin/employees"),
          axios.get("/api/locations"),
        ]);
        setEmployees(empRes.data);
        setLocations(locRes.data);
      } catch (error) {
        setMessage("Error loading admin data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. ฟังก์ชันสำหรับเปลี่ยน Location ให้พนักงาน
  const handleLocationChange = async (userId, newLocationId) => {
    try {
      setMessage(`Setting location for User ID ${userId}...`);
      await axios.post("/api/admin/set-employee-location", {
        userId,
        locationId: newLocationId,
      });
      setMessage(`Location updated successfully for User ID ${userId}.`);

      // อัปเดต State พนักงานหลังจากเปลี่ยนสำเร็จ
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === userId ? { ...emp, locationId: newLocationId } : emp
        )
      );
    } catch (error) {
      setMessage("Failed to update location.");
      console.error(error);
    }
  };

  if (isLoading)
    return <div style={{ padding: "20px" }}>Loading Admin Panel...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "auto" }}>
      <h2
        style={{
          fontSize: "24px",
          borderBottom: "1px solid #ddd",
          paddingBottom: "10px",
        }}
      >
        Admin: Manage Employee Locations
      </h2>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#e0f7fa",
        }}
      >
        {message}
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#00796b", color: "white" }}>
            <th style={{ padding: "10px" }}>Name</th>
            <th style={{ padding: "10px" }}>Current Location</th>
            <th style={{ padding: "10px" }}>Change Location</th>
            <th style={{ padding: "10px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px" }}>{employee.name}</td>
              <td style={{ padding: "10px" }}>
                {locations.find((l) => l.id === employee.locationId)?.name ||
                  "N/A"}
              </td>
              <td style={{ padding: "10px" }}>
                <select
                  style={{ padding: "5px", width: "150px" }}
                  value={employee.locationId || ""}
                  onChange={(e) =>
                    handleLocationChange(employee.id, Number(e.target.value))
                  }
                >
                  <option value="">-- Select Location --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "10px" }}>
                <button
                  style={adminStyles.button}
                  onClick={() =>
                    handleLocationChange(employee.id, employee.locationId)
                  }
                >
                  Set
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;
