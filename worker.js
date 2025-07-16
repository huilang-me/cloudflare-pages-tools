export default {
  async fetch(request) {
    return new Response(generateHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

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
