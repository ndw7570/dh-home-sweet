import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// 개발 모드에서만 프록시가 필요 (프로덕션은 브라우저가 백엔드 URL을 직접 호출).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_TARGET || "http://localhost:8000";
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5353,
      proxy: { "/api": { target, changeOrigin: true } },
    },
    preview: { host: "0.0.0.0", port: 5353 },
  };
});
