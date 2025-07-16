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
  <style>
    body { font-family: sans-serif; padding: 2em; max-width: 700px; margin: auto; background: #f9f9f9; }
    h1 { color: #333; }
    form { background: #fff; padding: 1em; margin-bottom: 2em; border-radius: 10px; box-shadow: 0 0 5px rgba(0,0,0,0.1); }
    label { display: block; margin-top: 0.5em; }
    input[type="number"] { width: 60px; }
    .result { margin: 1em 0; font-size: 1.2em; }
    ul { padding-left: 1em; }
    code { background: #eee; padding: 3px 6px; border-radius: 5px; }
    button { margin-top: 0.5em; }
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
    }
    #toast.show {
      opacity: 1;
    }
  </style>
</head>
<body>
  <h1>🔐 密码 / UUID 生成器</h1>

  <form id="generatorForm">
    <h3>密码生成设置</h3>
    <label>长度：<input type="number" id="length" value="12" min="4" max="64"></label>
    <label><input type="checkbox" id="upper" checked> 包含大写字母</label>
    <label><input type="checkbox" id="lower" checked> 包含小写字母</label>
    <label><input type="checkbox" id="number" checked> 包含数字</label>
    <label><input type="checkbox" id="symbol"> 包含符号</label>
    <button type="button" onclick="generatePassword()">生成密码</button>
    <button type="button" onclick="generateUUID()">生成 UUID</button>
  </form>

  <div class="result" id="output"></div>

  <h3>📜 历史记录（最多10条） <button onclick="clearHistory()">🗑 清除</button></h3>
  <ul id="history"></ul>

  <div id="toast">已复制到剪贴板</div>

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
      showToast("历史记录已清除");
    }

    // 初始化历史
    renderHistory();
  </script>
</body>
</html>`;
}
