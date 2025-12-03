import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// 获取当前项目的绝对根路径
const projectRoot = process.cwd();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 1. 明确设置根目录为 client 文件夹，这样 Vite 才能找到 index.html
  root: path.join(projectRoot, "client"),
  resolve: {
    alias: {
      // 2. 设置 @ 别名指向 client/src
      "@": path.join(projectRoot, "client/src"),
      "db": path.join(projectRoot, "db"),
    },
  },
  build: {
    // 3. 将打包结果输出到项目根目录下的 dist 文件夹 (即 client 的上一级)
    // 这样 Vercel 才能正确识别构建产物
    outDir: path.join(projectRoot, "dist"),
    emptyOutDir: true,
  },
});