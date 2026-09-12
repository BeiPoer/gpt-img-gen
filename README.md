# gpt-image-gen2

这是一个前端工程化版本。源码被拆分到 `src/`，生产环境通过 `npm run build` 输出到 `dist/`。

项目的构建脚本只依赖本机 Node.js，不需要额外安装打包器。构建时会生成 hash 命名的静态资源，并且不输出 sourcemap。

## 开发

先复制运行时配置示例：

```powershell
Copy-Item app.config.example.json app.config.json
```

然后在 `app.config.json` 中填写接口配置：

```json
{
  "apiUrl": "https://你的接口域名",
  "apiKey": "你的默认 API Key，也可以留空",
  "apiPathPrefix": "/v1",
  "keyUrl": "获取专属 key 的页面地址，也可以留空",
  "apiKeyButtonText": "填充默认key",
  "apiKeyNotice": "当前使用配置文件中的默认 API Key。"
}
```

`app.config.json` 是本地和部署环境的运行时配置文件，已加入 `.gitignore`，不要把真实 API Key 写进 `src/`、`index.html` 或提交到仓库。生产构建会优先复制 `app.config.json` 到 `dist/app.config.json`；如果该文件不存在，则复制空值示例配置。

访问页面时追加 `?nokey=true` 会隐藏“填充默认key”和“获取专属key”入口，并且不会自动填入配置文件中的默认 API Key；API URL 仍会按配置默认填充，用户手动输入并保存配置的行为不变。

访问页面时追加 `?noheader=true` 会隐藏页面头部，并将主内容 `.shell` 的顶部外边距设为 `20px`。两个参数可以组合使用，例如 `?nokey=true&noheader=true`。

访问页面时追加 `?url=https%3A%2F%2Fexample.com` 会把 API URL 固定为该地址且禁止用户更改；该值优先于本地保存配置和 `app.config.json` 默认值，保存配置时仍会保存当前固定 API URL 和用户输入的 API Key。

仅使用 Images API 生成图片。在“生成模式”下方选择图片模型，默认使用 `gpt-image-2`；测试连接成功后，下拉框会显示接口返回的 `gpt-image` 系列模型。文生图、图生图和局部重绘请求使用当前选中的模型。

页面也支持 Banana / Gemini 图片模型：切换“生图服务”为 Banana 后，手动填写其 API URL 和 API Key。支持 `gemini-2.5-flash-image`、`gemini-3.1-flash-image-preview`、`gemini-3-pro-image-preview`，请求使用 `/v1beta/models/{model}:generateContent`，支持文生图、多参考图图生图、宽高比、3.x 模型的 1K/2K/4K 分辨率，以及 1–10 张顺序生成。Banana 不支持局部重绘；多张生成中途取消会保留已完成结果。GPT 与 Banana 的配置分别保存在浏览器中。使用 `?bananaUrl=...` 可单独锁定 Banana API 地址。

```bash
npm run dev
```

## 生产构建

```bash
npm run build
```

实际部署时只部署 `dist/` 目录，不要把项目源码目录作为静态站点根目录。

前端工程化只能提高直接复制完整 HTML 源码的难度，不能防止浏览器端资源被抓取或反混淆。如果需要保护密钥、接口策略或计费逻辑，应放到服务端处理。
