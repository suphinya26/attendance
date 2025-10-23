import React, { useEffect, useState, useCallback } from "react";
import axios from "../axiosInstance";
import FaceRecognition from "../components/FaceRecognition";

// --- 1. Define Styles --- (Styles remain the same for consistency)
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f7f7f7",
    padding: "40px",
    display: "flex",
    justifyContent: "center",
  },
  cardContainer: {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: "white",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    padding: "30px",
  },
  header: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    marginTop: "20px",
  },
  detailCard: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#f9f9f9",
  },
  verificationCard: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#555",
    marginBottom: "4px",
  },
  select: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "16px",
    marginTop: "4px",
    marginBottom: "15px",
  },
  staticLocationText: {
    // Style สำหรับแสดงชื่อสถานที่
    fontSize: "16px",
    fontWeight: "600",
    color: "#00796b",
    padding: "8px 0",
    borderBottom: "1px solid #ccc",
    marginBottom: "15px",
  },
  messageBox: (isSuccess, isError) => {
    let bgColor = "#e0f7fa";
    let textColor = "#00796b";
    let borderColor = "#80deea";

    if (isSuccess) {
      bgColor = "#e8f5e9";
      textColor = "#2e7d32";
      borderColor = "#a5d6a7";
    } else if (isError) {
      bgColor = "#ffebee";
      textColor = "#c62828";
      borderColor = "#ef9a9a";
    }

    return {
      marginTop: "30px",
      padding: "15px",
      borderRadius: "6px",
      fontWeight: "bold",
      textAlign: "center",
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
    };
  },
};

export default function Attendance() {
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sessionType, setSessionType] = useState("morning");
  const [checkType, setCheckType] = useState("checkin");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // เพิ่ม State สำหรับเก็บชื่อ Location เดียวที่ถูกเลือก
  const [singleLocationName, setSingleLocationName] = useState("");

  // --- Data Fetching: ปรับ Logic การตั้งค่า Location ---
  useEffect(() => {
    (async () => {
      try {
        const [meRes, locRes] = await Promise.all([
          axios.get("/api/users/me"),
          axios.get("/api/locations"),
        ]);

        setUser(meRes.data);
        setLocations(locRes.data);

        // 💡 โค้ดที่ถูกเพิ่ม/ปรับปรุง: ตรวจสอบว่ามีแค่ Location เดียวหรือไม่
        if (locRes.data.length === 1) {
          // ถ้ามีแค่ 1 ที่ ให้ตั้งค่า ID และชื่อของสถานที่นั้นทันที
          const singleLoc = locRes.data[0];
          setSelectedLocation(singleLoc.id);
          setSingleLocationName(
            `${singleLoc.name} (${singleLoc.latitude.toFixed(
              3
            )}, ${singleLoc.longitude.toFixed(3)})`
          );
        } else if (locRes.data.length > 1) {
          // ถ้ามีหลายที่ ให้ตั้งค่าตัวแรกเป็น Default (และจะแสดง Dropdown)
          setSelectedLocation(locRes.data[0].id);
        }
        // -----------------------------------------------------
      } catch (err) {
        console.error("Fetch error:", err);
        setMessage("Error loading data. Please check connection.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // --- Submission Logic (ไม่เปลี่ยนแปลง) ---
  const handleSubmit = useCallback(
    async (verified) => {
      if (!selectedLocation) {
        setMessage("Please select a location first.");
        return;
      }
      // ... (Your original submission logic using selectedLocation)
      setMessage("🚀 Getting geolocation...");

      const getPosition = () =>
        new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
          });
        });

      try {
        const pos = await getPosition();
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setMessage("📡 Sending attendance data...");

        const res = await axios.post("/api/attendance", {
          checkType,
          sessionType,
          latitude: lat,
          longitude: lon,
          locationId: selectedLocation,
          verified: !!verified,
        });

        setMessage(
          `✅ Success! ${
            res.data.message || "Attendance recorded successfully."
          }`
        );
      } catch (err) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "An unknown error occurred.";
        setMessage(`❌ Failed: ${errorMessage}`);
        console.error("Attendance submission error:", err);
      }
    },
    [selectedLocation, checkType, sessionType]
  );

  // --- Verification Result Handler (ไม่เปลี่ยนแปลง) ---
  const handleVerificationResult = useCallback(
    (matched) => {
      // 💡 ปรับปรุง Logic การตัดสินใจ
      if (matched) {
        // 1. ถ้าใบหน้าตรง: อนุญาตให้ส่งข้อมูล
        setMessage("👍 Face Matched! Submitting attendance...");
        handleSubmit(true);
      } else {
        // 2. ถ้าใบหน้าไม่ตรง: ไม่อนุญาตให้ลงเวลาและแสดงข้อความ Error
        setMessage(
          "❌ Verification Failed: Face does not match the reference image. Attendance NOT submitted."
        );
        // **สำคัญ**: เรายกเลิกการเรียก window.confirm และ handleSubmit(false) ออกไป
      }
    },
    [handleSubmit]
  );

  if (isLoading || !user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f7f7f7",
        }}
      >
        <div style={{ fontSize: "18px", color: "#00796b" }}>
          Loading user and locations...
        </div>
      </div>
    );
  }

  const isSuccess = message.includes("Success");
  const isError = message.includes("Failed") || message.includes("Error");

  // --- 💡 ส่วน Render ที่ถูกปรับปรุง ---
  const renderLocationInput = () => {
    if (locations.length === 1) {
      // 1. ถ้ามีแค่ Location เดียว: แสดงเป็นข้อความ
      return <div style={styles.staticLocationText}>{singleLocationName}</div>;
    }

    // 2. ถ้ามีหลาย Location: แสดงเป็น Dropdown (หรือถ้าไม่มีเลย จะแสดง Dropdown ว่าง)
    return (
      <select
        value={selectedLocation || ""}
        onChange={(e) => setSelectedLocation(Number(e.target.value))}
        style={styles.select}
        disabled={locations.length === 0} // ปิดการใช้งานถ้าไม่มี Location เลย
      >
        {locations.length === 0 && (
          <option value="" disabled>
            No locations available
          </option>
        )}
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name} ({l.latitude.toFixed(3)}, {l.longitude.toFixed(3)})
          </option>
        ))}
      </select>
    );
  };
  // ------------------------------------

  return (
    <div style={styles.container}>
      <div style={styles.cardContainer}>
        <h2 style={styles.header}>👋 Welcome, {user.name}</h2>

        {/* Attendance Details and Face Verification (Grid Layout) */}
        <div style={styles.grid}>
          {/* A. Attendance Selection Card */}
          <div style={styles.detailCard}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#00796b",
                marginBottom: "15px",
              }}
            >
              Attendance Details
            </h3>

            {/* Location Display/Selector */}
            <div style={{ marginBottom: "15px" }}>
              <label style={styles.label}>📍 Location</label>
              {renderLocationInput()} {/* เรียกใช้ฟังก์ชันที่ถูกปรับปรุง */}
            </div>

            {/* Session Type */}
            <div style={{ marginBottom: "15px" }}>
              <label style={styles.label}>☀️ Session</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                style={styles.select}
              >
                <option value="morning">Morning (เช้า)</option>
                <option value="noon">Noon (กลางวัน)</option>
                <option value="afternoon">Afternoon (บ่าย)</option>
                <option value="evening">Evening (เย็น)</option>
              </select>
            </div>

            {/* Check Type */}
            <div style={{ marginBottom: "15px" }}>
              <label style={styles.label}>🕰️ Check Type</label>
              <select
                value={checkType}
                onChange={(e) => setCheckType(e.target.value)}
                style={styles.select}
              >
                <option value="checkin">Check-in (เข้างาน)</option>
                <option value="checkout">Check-out (ออกงาน)</option>
              </select>
            </div>
          </div>

          {/* B. Face Recognition Card */}
          <div style={styles.verificationCard}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#00796b",
                marginBottom: "10px",
              }}
            >
              Face Verification
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#777",
                marginBottom: "15px",
                textAlign: "center",
              }}
            >
              Press Verify to compare your live face with the stored image.
            </p>

            <FaceRecognition
              referenceImageUrl={user.faceImage}
              onResult={handleVerificationResult}
            />
          </div>
        </div>

        {/* C. Message Box */}
        <div style={styles.messageBox(isSuccess, isError)}>
          {message || "Ready to verify."}
        </div>
      </div>
    </div>
  );
}
