// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // สำคัญ: กำหนดให้ Tailwind สแกนไฟล์โค้ด React ทั้งหมดใน src
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}