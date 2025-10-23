const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require("./src/routes/userRoutes.js");
const locationRoutes = require("./src/routes/locationRoutes.js");
const attendanceRoutes = require("./src/routes/attendanceRoutes.js");
const uploadRoutes = require("./src/routes/uploadRoutes.js");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => res.send("✅ Attendance API is running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
