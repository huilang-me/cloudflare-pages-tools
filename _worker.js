export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;
    const path = url.pathname;
    const params = url.searchParams;

    // 条件1: 子域名前缀是 ip.
    const isIPSubdomain = host.startsWith("ip.");

    // 条件2: 路径是 /ip
    const isIPPath = path === "/ip" || path.startsWith("/ip/") || params.has("ip");

    if (isIPSubdomain || isIPPath) {
      return getIPInfo(request);
    }
  
    return new Response(generateHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

async function getIPInfo(request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const cf = request.cf || {};

  // 1️⃣ 优先使用 ?ip=xxx 查询
  let queryIP = params.get("ip");

  // 2️⃣ 如果 query 没有，再尝试从路径 /ip/xxx 获取
  if (!queryIP) {
    const match = url.pathname.match(/^\/ip\/(.+)$/);
    if (match) queryIP = match[1];
  }

  // 3️⃣ 如果还是没有，并且 host 以 ip. 开头，尝试取路径第一级作为 IP
  if (!queryIP && url.hostname.startsWith("ip.")) {
    const pathMatch = url.pathname.match(/^\/([^\/]+)(\/.*)?$/);
    if (pathMatch) queryIP = pathMatch[1];
  }

  // 简单 IPv4 和 IPv6 校验正则
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;

  // 4️⃣ 如果没有指定 IP 或者ip格式不对 → 使用访问者 IP + CF 信息
  if (!queryIP) {
    const ip = request.headers.get("cf-connecting-ip");
    const data = {
      ip,
      asn: cf.asn || null,
      org: cf.asOrganization || null,
      country: cf.country || null,
      region: cf.region || null,
      city: cf.city || null,
      tz: cf.timezone || null
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    });
  } else if (!ipv4Regex.test(queryIP) && !ipv6Regex.test(queryIP)) {
    return new Response(JSON.stringify({
      error: "无效的 IP 地址",
      ip: queryIP
    }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    });
  }

  // 4️⃣ 如果指定了 IP → 调用第三方 API 获取信息
  try {
    // const res = await fetch(`https://ipwhois.app/json/${queryIP}`);
    const res = await fetch(`https://api.ip.sb/geoip/${queryIP}`);
    const data = await res.json();
    if (data.success) {
      // 只返回需要的字段
      const filtered = {
        ip: data.ip,
        asn: Number(data.asn.replace(/^AS/i, "")),
        // isp: data.isp,
        org: data.org,
        country: data.country_code,
        region: data.region,
        city: data.city,
        tz: data.timezone
      };
      return new Response(JSON.stringify(filtered, null, 2), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      });
    } else {
      // success 为 false 时返回完整的错误信息
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*"
        }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message || "调用第三方 API 失败",
      ip: queryIP
    }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    });
  }
}


function generateHTML() {
  return `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>密码 / UUID 生成器</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 1.5em;
      max-width: 700px;
      margin: auto;
      background: #f9f9f9;
      color: #333;
    }
    h1 { font-size: 1.8em; text-align: center; margin-bottom: 1em; }

    form {
      background: #fff;
      padding: 1em;
      border-radius: 10px;
      box-shadow: 0 0 5px rgba(0,0,0,0.08);
      margin-bottom: 2em;
    }

    label {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin: 0.5em 0;
      font-size: 1em;
    }

    input[type="number"] {
      width: 80px;
      padding: 5px;
    }

    button {
      margin-top: 1em;
      margin-right: 0.5em;
      padding: 0.25em .6em;
      font-size: 12px;
      border: none;
      border-radius: 3px;
      background: #007aff;
      color: white;
      cursor: pointer;
    }

    button:hover {
      background: #005fcc;
    }

    .result {
      margin: 1.5em 0;
      font-size: 1.2em;
    }

    ul {
      padding-left: 1em;
      list-style: none;
    }

    li {
      margin-bottom: 0.5em;
      word-break: break-all;
    }

    code {
      background: #eee;
      padding: 3px 6px;
      border-radius: 5px;
    }

    #toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 999;
      font-size: 0.95em;
      pointer-events: none;
    }

    #toast.show {
      opacity: 1;
    }

    footer {
      margin-top: 3em;
      padding-top: 1em;
      font-size: 0.9em;
      color: #666;
      border-top: 1px solid #ddd;
      text-align: center;
      line-height: 1.5;
    }

    @media (max-width: 480px) {
      body { padding: 1em; font-size: 1em; }
      button { margin-top: 0.7em; }
      form label { flex-direction: row; flex-wrap: wrap; }
      .result { word-break: break-word; }
    }
  </style>
</head>
<body>
  <h1>🔐 密码 / UUID 生成器</h1>

  <form id="generatorForm">
    <h3>密码生成设置</h3>
    <label>长度：
      <input type="number" id="length" value="12" min="4" max="64">
    </label>
    <label><input type="checkbox" id="upper" checked> 包含大写字母</label>
    <label><input type="checkbox" id="lower" checked> 包含小写字母</label>
    <label><input type="checkbox" id="number" checked> 包含数字</label>
    <label><input type="checkbox" id="symbol" checked> 包含符号</label>
    <button type="button" onclick="generatePassword()">生成密码</button>
    <button type="button" onclick="generateUUID()">生成 UUID</button>
  </form>

  <div class="result" id="output"></div>

  <h3>📜 历史记录（最多10条） <button onclick="clearHistory()">🗑 清除</button></h3>
  <ul id="history"></ul>

  <div id="toast">已复制到剪贴板</div>

  <footer>
    <p>🔒 本工具不会收集或上传任何用户数据，所有生成记录仅保存在您的浏览器 <code>localStorage</code> 中。</p>
    <p>⚠️ 请妥善保管生成的密码和 UUID，本站无法恢复历史或数据。</p>
    <p>🔗 <a href="https://github.com/huilang-me/genpass-uuid-cloudflare-worker/" target="_blank">查看项目主页</a></p>
  </footer>

  <script>
    function generatePassword() {
      const length = parseInt(document.getElementById('length').value) || 12;
      const upper = document.getElementById('upper').checked;
      const lower = document.getElementById('lower').checked;
      const number = document.getElementById('number').checked;
      const symbol = document.getElementById('symbol').checked;

      const upperSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowerSet = 'abcdefghijklmnopqrstuvwxyz';
      const numberSet = '0123456789';
      const symbolSet = '!@#$%^&*()-_=+[]{}|;:,.<>?';

      let pool = '';
      if (upper) pool += upperSet;
      if (lower) pool += lowerSet;
      if (number) pool += numberSet;
      if (symbol) pool += symbolSet;

      if (!pool) {
        showToast("请至少选择一个字符类型");
        return;
      }

      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      const password = Array.from(array).map(i => pool[i % pool.length]).join('');

      showResult(password);
    }

    function generateUUID() {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      showResult(uuid);
    }

    function showResult(text) {
      const output = document.getElementById('output');
      output.innerHTML = \`✅ <code>\${text}</code> <button onclick="copyToClipboard('\${text}')">复制</button>\`;
      saveToHistory(text);
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("已复制：" + text);
      });
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 5000);
    }

    function saveToHistory(text) {
      let history = JSON.parse(localStorage.getItem('history') || '[]');
      history.unshift(text);
      history = history.slice(0, 10);
      localStorage.setItem('history', JSON.stringify(history));
      renderHistory(history);
    }

    function renderHistory(history = null) {
      if (!history) {
        history = JSON.parse(localStorage.getItem('history') || '[]');
      }
      const list = document.getElementById('history');
      list.innerHTML = history.map(item =>
        \`<li><code>\${item}</code> <button onclick="copyToClipboard('\${item}')">复制</button></li>\`
      ).join('');
    }

    function clearHistory() {
      localStorage.removeItem('history');
      renderHistory([]);
      document.getElementById('output').innerHTML = '';
      showToast("历史记录已清除");
    }

    // 初始化历史记录显示
    renderHistory();
  </script>
</body>
</html>`;
}
