import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Attendance from "./pages/Attendance";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import AdminPage from "./pages/AdminPage";
import AdminLocations from "./pages/AdminLocations";

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(userRole)) return <Navigate to="/attendance" />;

  return children;
}

function Layout({ children }) {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/attendance"
          element={
            <PrivateRoute>
              <Attendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          }
        />

        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/admin/locations"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminLocations />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/attendance" />} />
      </Routes>
    </Layout>
  );
}
