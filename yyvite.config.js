//C:\Users\USER\Downloads\project2_modulaire\vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 🔹 Assure que le serveur tourne bien sur ce port
  },
  define: {
    "process.env": {}, // 🔹 Corrige l'erreur "process is not defined"
  },
});
