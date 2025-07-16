# 🔐 genpass-uuid-worker

一个部署在 Cloudflare Workers 上的 **密码和 UUID 生成器**，纯前端实现，无需后端调用。支持自定义密码设置、本地历史记录保存、一键复制生成结果，适合快速生成安全标识符并托管在边缘节点。

---

## ✨ 功能特点

- ✅ 支持生成密码（可自定义长度、字符类型）
- ✅ 支持生成 UUID v4
- ✅ 所有逻辑由浏览器前端完成，无需 API 请求
- ✅ 历史记录保存至浏览器本地 `localStorage`
- ✅ 一键复制，带弹出提示，自动隐藏
- ✅ 部署至 Cloudflare Workers，极速加载

---

## 📦 在线演示

部署后访问 [https://tools.tmpple.workers.dev/](https://tools.tmpple.workers.dev/) 即可使用。  
如你尚未部署，请参考下方安装说明。

---

## 🚀 快速开始（Cloudflare Workers）

通过 Cloudflare 官方后台界面部署本项目

### 🧭 步骤如下：

1. 登录你的 Cloudflare 账号：https://dash.cloudflare.com  
2. 在左侧菜单中点击 **「计算 (Workers)」**，然后选择 **「Workers & Pages」**  
3. 进入「概览」页面后，点击右上角的 **「创建应用」**  
4. 选择 **「Start from a template → Hello World」**，点击 **「开始使用」**  
5. 为你的 Worker 取一个唯一的名称，例如：`genpass-uuid`  
6. 点击 **「部署」**  
7. 部署完成后，点击右上角的 **「编辑代码」**，进入在线代码编辑器  
8. 删除默认的全部代码  
9. 打开本仓库中的 `index.js` 文件，复制其所有内容  
10. 将复制的代码粘贴到 Cloudflare Worker 编辑器中  
11. 点击编辑器右上角的 **「保存并部署」** 按钮  
12. 现在你就可以访问你的 Worker 链接
