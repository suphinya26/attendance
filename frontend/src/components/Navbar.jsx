import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../axiosInstance";

// กำหนดรายการเมนูลิงก์แบบคงที่
const NAV_LINKS = [
  { path: "/attendance", label: "ลงเวลา" },
  { path: "/history", label: "ประวัติ" },
  { path: "/profile", label: "โปรไฟล์" },
];

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontWeight: "500",
  padding: "4px 8px",
  borderRadius: "4px",
  transition: "background-color 0.15s ease",
};

const Navbar = () => {
  const [state, setState] = useState({
    user: null,
    isLoading: true,
    error: null,
  });
  const { user, isLoading } = state;

  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. Fetch User Data ---
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState({ user: null, isLoading: false, error: null });
      return;
    }

    try {
      const res = await axios.get("/api/users/me");
      setState({ user: res.data, isLoading: false, error: null });
    } catch (err) {
      console.error("Authentication check failed:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setState({
        user: null,
        isLoading: false,
        error: "Authentication failed",
      });
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [location.pathname, fetchUserData]);

  // --- 2. Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setState((s) => ({ ...s, user: null, error: null }));
    navigate("/login");
  };

  // --- 3. Render Logic ---
  if (isLoading) {
    return (
      <nav
        style={{
          backgroundColor: "#00796b",
          color: "white",
          padding: "12px 24px",
        }}
      >
        <span style={{ fontSize: "14px" }}>...กำลังโหลดข้อมูลผู้ใช้</span>
      </nav>
    );
  }

  if (!user) {
    return null;
  }

  // C. แสดง Navbar ด้วย Inline Styles
  return (
    <nav
      style={{
        backgroundColor: "#00796b", // สีเขียวเข้ม (แทน bg-blue-600)
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 24px",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
        fontSize: "16px",
      }}
    >
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <h3
          style={{ fontWeight: "bold", fontSize: "20px", letterSpacing: "1px" }}
        >
          <Link to="/attendance" style={{ ...linkStyle, fontWeight: "bold" }}>
            🕒 Attendance
          </Link>
        </h3>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              ...linkStyle,
              fontWeight: location.pathname === link.path ? "bold" : "500",
              textDecoration:
                location.pathname === link.path ? "underline" : "none",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "14px" }}>👋 สวัสดี, **{user.name}**</span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc3545", // สีแดง (แทน bg-red-500)
            color: "white",
            padding: "6px 12px",
            borderRadius: "20px", // แทน rounded-full
            fontSize: "14px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s ease",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#c82333")
          } // Hover effect
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#dc3545")
          }
        >
          ออกจากระบบ
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
