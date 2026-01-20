# SkillTools (本地 Skills 可视化工具)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-orange.svg)
![React](https://img.shields.io/badge/React-v19-blue.svg)

> 🤖 **Note**: 本项目完全由 AI IDE 辅助开发完成。

**SkillTools** 是一个优雅、现代化的本地 （Skills）管理与可视化工具。它能够帮助你统一管理来自不同生态（Antigravity, Cursor, Claude 等）的技能文件，提供类似 IDE 的编辑体验和实时 Markdown 预览。


> *统一管理你的 本地 Skills ，跨平台无缝转换，让 Prompt Engineering 更加优雅。*

## ✨ 核心特性

- **📚 多生态支持**：原生支持 Antigravity、Cursor、Claude 等多种技能格式，并支持**自定义格式**。
- **📝 强大的编辑器**：
  - **实时预览**：双栏布局，左侧编辑 Markdown，右侧实时渲染。
  - **文件树管理**：完整展示技能目录结构（scripts, examples, resources）。
  - **多文件编辑**：支持点击文件树直接编辑 `.java`, `.py`, `.sql`, `.json` 等文件。
  - **语法高亮**：内置 20+ 种编程语言的语法高亮支持。
- **📂 智能库管理**：
  - 自动识别文件夹格式。
  - 支持多目录导入。
  - 可以在应用内直接创建新技能（自动生成标准目录结构）。
- **🎨 现代化 UI**：
  - 基于 TailwindCSS v4 的玻璃拟态（Glassmorphism）设计。
  - 流畅的动画交互（Framer Motion）。
  - 完美适配深色模式。
- **🔒 安全隐私**：
  - **完全本地运行**：所有数据均存储在本地文件系统，绝不上传云端。
  - **开源透明**：基于 Tauri 构建，安全可控。

## 🛠️ 技术栈

*   **Frontend**: React 19, TypeScript, TailwindCSS v4, Framer Motion, Zustand
*   **Backend**: Rust, Tauri v2
*   **Editor**: React Markdown, Prism React Renderer

## 🚀 快速开始

### 开发环境

确保你已经安装了：
*   Node.js (v18+)
*   Rust (最新的 stable 版本)

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run tauri dev
```

### 构建发布版本

```bash
npm run tauri build
```

## 📂 目录结构规范

SkillTools 推荐采用以下标准技能目录结构：

```
my-skill-name/
├── SKILL.md          # 核心技能描述文件 (Markdown + Frontmatter)
├── scripts/          # 可执行脚本 (.py, .js, .sh)
├── examples/         # 示例代码或输入输出样例
└── resources/        # 配置文件或其他静态资源
```

## 🤝 贡献与反馈

欢迎提交 Issue 或 Pull Request！如果你有新的想法或发现了 Bug，请随时告诉我们。

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源。
