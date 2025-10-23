import React, { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

// กำหนดค่าคงที่
const MODEL_URL = "/models";
const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;
const MATCH_THRESHOLD = 0.6; // ค่าเกณฑ์ที่ใช้ในการตัดสินว่าใบหน้าตรงกันหรือไม่

// สร้าง State สำหรับสถานะต่างๆ
const INITIAL_STATE = {
  status: "Waiting for model to load...",
  isCameraActive: false,
  isVerifying: false,
  modelsLoaded: false,
};

export default function FaceRecognition({ referenceImageUrl, onResult }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [state, setState] = useState(INITIAL_STATE);

  const { status, isCameraActive, isVerifying, modelsLoaded } = state;

  // --- 1. Load Models ---
  useEffect(() => {
    // โหลดโมเดลทั้งหมดพร้อมกัน
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
      .then(() => {
        setState((s) => ({
          ...s,
          modelsLoaded: true,
          status: "Model loaded. Ready to start camera.",
        }));
      })
      .catch((err) => {
        console.error("Failed to load models:", err);
        setState((s) => ({ ...s, status: "Error loading models." }));
      });
  }, []);

  // --- 2. Camera Controls ---
  const startVideo = useCallback(async () => {
    if (!modelsLoaded) return;
    setState((s) => ({ ...s, status: "Starting camera..." }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setState((s) => ({
        ...s,
        isCameraActive: true,
        status: "Camera active. Ready for verification.",
      }));
    } catch (err) {
      alert("Cannot open camera: " + err.message);
      setState((s) => ({ ...s, status: "Camera start failed." }));
    }
  }, [modelsLoaded]);

  const stopVideo = useCallback(() => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    // ล้าง Canvas เมื่อหยุดกล้อง
    canvasRef.current
      .getContext("2d")
      .clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    setState((s) => ({
      ...s,
      isCameraActive: false,
      status: "Camera stopped.",
    }));
  }, []);

  // --- 3. Verification Logic ---
  const getDescriptor = async (image) => {
    return faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();
  };

  const handleVerify = async () => {
    if (isVerifying) return; // ป้องกันการคลิกซ้ำ

    if (!modelsLoaded) return alert("Models are still loading.");
    if (!referenceImageUrl) {
      alert("No reference image available. Upload one in your profile.");
      return;
    }

    setState((s) => ({
      ...s,
      isVerifying: true,
      status: "Starting verification...",
    }));

    try {
      // A. Load Reference Descriptor
      setState((s) => ({ ...s, status: "Loading reference descriptor..." }));
      const refImg = await faceapi.fetchImage(referenceImageUrl);
      const refDet = await getDescriptor(refImg);

      if (!refDet) {
        setState((s) => ({
          ...s,
          status: "No face found in reference image. Verification failed.",
        }));
        return onResult(false);
      }
      const refDescriptor = refDet.descriptor;

      // B. Start Camera if needed
      if (!isCameraActive) {
        await startVideo();
        await new Promise((r) => setTimeout(r, 1000)); // รอ 1 วิ ให้กล้องพร้อม
      }

      // C. Detect Live Face
      setState((s) => ({ ...s, status: "Detecting live face..." }));
      const liveDetection = await getDescriptor(videoRef.current);

      if (!liveDetection) {
        setState((s) => ({
          ...s,
          status: "No face detected in camera. Verification failed.",
        }));
        return onResult(false);
      }

      const liveDescriptor = liveDetection.descriptor;

      // D. Compute Distance and Match
      const distance = faceapi.euclideanDistance(refDescriptor, liveDescriptor);
      const matched = distance < MATCH_THRESHOLD;

      // E. Update UI and Callback
      setState((s) => ({
        ...s,
        status: `Verification complete. Distance: ${distance.toFixed(
          4
        )} => matched: ${matched}`,
        isVerifying: false,
      }));

      // F. Draw Detection Box
      const dims = faceapi.matchDimensions(
        canvasRef.current,
        videoRef.current,
        true
      );
      const resized = faceapi.resizeResults(liveDetection, dims);
      canvasRef.current
        .getContext("2d")
        .clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      faceapi.draw.drawDetections(canvasRef.current, resized);

      onResult(matched);
    } catch (err) {
      console.error("Verification Error:", err);
      setState((s) => ({
        ...s,
        isVerifying: false,
        status: `Verification failed with error: ${err.message}`,
      }));
      onResult(false);
    } finally {
      // stopVideo(); // เปิดใช้ถ้าต้องการให้กล้องหยุดทันทีหลัง Verify
    }
  };

  // --- 4. Render UI ---
  return (
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        {/* Video element สำหรับแสดงภาพจากกล้อง */}
        <video
          ref={videoRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          style={styles.videoElement}
          muted // ควรปิดเสียงเสมอเมื่อใช้ getUserMedia
        />
        {/* Canvas element สำหรับวาดกรอบใบหน้า (ซ้อนทับ Video) */}
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          style={styles.canvasElement}
        />
      </div>

      <div style={styles.buttonGroup}>
        <button
          onClick={startVideo}
          disabled={!modelsLoaded || isCameraActive || isVerifying}
          style={styles.button}
        >
          {isCameraActive ? "Camera ON" : "Start Camera"}
        </button>
        <button
          onClick={stopVideo}
          disabled={!isCameraActive || isVerifying}
          style={styles.button}
        >
          Stop Camera
        </button>
        <button
          onClick={handleVerify}
          disabled={!modelsLoaded || isVerifying}
          style={{
            ...styles.button,
            backgroundColor: isVerifying ? "#ccc" : "#4CAF50",
            color: "white",
          }}
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </button>
      </div>

      <div style={styles.statusBox}>
        <p style={{ margin: 0, fontSize: "0.9em" }}>
          Model Status: **{modelsLoaded ? "LOADED" : "LOADING..."}**
        </p>
        <p style={{ margin: "4px 0 0 0", fontWeight: "bold" }}>{status}</p>
      </div>
    </div>
  );
}

// Inline Styles ที่ถูกปรับปรุงเพื่อให้ดูดีขึ้น
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    border: "1px solid #eee",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
  },
  videoContainer: {
    position: "relative",
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    marginBottom: "15px",
    borderRadius: "6px",
    overflow: "hidden",
    border: "2px solid #333",
  },
  videoElement: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover", // เพื่อให้ภาพเต็มกรอบ
  },
  canvasElement: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },
  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
  statusBox: {
    padding: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    width: "100%",
    textAlign: "center",
  },
};
