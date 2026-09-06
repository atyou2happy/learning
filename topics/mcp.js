/* mcp.js — 全部交互演示（node --check 可直接校验） */
(function () {
  'use strict';
  var C = {
    blue: '#58a6ff', pink: '#f778ba', green: '#7ee787',
    orange: '#ffa657', purple: '#a371f7', red: '#f85149',
    dim: '#8b949e', dark: '#30363d', bg: '#0a0d12', text: '#c9d1d9'
  };
  var FONT = '13.5px sans-serif';
  var MONO = 'bold 13.5px monospace';

  function fit(id) {
    var cv = document.getElementById(id);
    if (!cv) return null;
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth || 600;
    var h = cv.clientHeight || 200;
    cv.width = w * dpr; cv.height = h * dpr;
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cv: cv, ctx: ctx, w: w, h: h };
  }

  var redraws = [];
  window.addEventListener('resize', function () {
    redraws.forEach(function (fn) { fn(); });
  });

  /* ============ 图1 · M×N 死结 ============ */
  (function () {
    function draw() {
      var c = fit('meshCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左列 5 模型, 右列 8 工具 */
      var M = 5, N = 8;
      var mY = [], tY = [];
      var i, j;
      for (i = 0; i < M; i++) mY.push(50 + i * 30);
      for (j = 0; j < N; j++) tY.push(34 + j * 22);
      /* 连线 40 条 */
      ctx.strokeStyle = 'rgba(248,81,73,.25)';
      for (i = 0; i < M; i++) {
        for (j = 0; j < N; j++) {
          ctx.beginPath();
          ctx.moveTo(90, mY[i]);
          ctx.lineTo(c.w - 110, tY[j]);
          ctx.stroke();
        }
      }
      /* 模型块 */
      for (i = 0; i < M; i++) {
        ctx.fillStyle = 'rgba(88,166,255,.2)';
        ctx.fillRect(30, mY[i] - 11, 60, 22);
        ctx.strokeStyle = C.blue; ctx.strokeRect(30, mY[i] - 11, 60, 22);
        ctx.fillStyle = C.text; ctx.font = '11px monospace';
        ctx.fillText('模型 ' + (i + 1), 38, mY[i] + 4);
      }
      /* 工具块 */
      var tnames = ['终端', '浏览器', '数据库', 'GitHub', '搜索', '邮件', '文件', '日历'];
      for (j = 0; j < N; j++) {
        ctx.fillStyle = 'rgba(126,231,135,.15)';
        ctx.fillRect(c.w - 100, tY[j] - 9, 70, 18);
        ctx.strokeStyle = C.green; ctx.strokeRect(c.w - 100, tY[j] - 9, 70, 18);
        ctx.fillStyle = C.text; ctx.font = '10.5px monospace';
        ctx.fillText(tnames[j], c.w - 92, tY[j] + 4);
      }
      ctx.fillStyle = C.red; ctx.font = MONO;
      ctx.fillText('5 × 8 = 40 份胶水代码', 16, 20);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('每出一个新模型或新工具, 全体重写 — 集成地狱', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · MCP 总线 ============ */
  (function () {
    function draw() {
      var c = fit('busCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var M = 5, N = 8;
      var mY = [], tY = [];
      var i, j;
      for (i = 0; i < M; i++) mY.push(50 + i * 30);
      for (j = 0; j < N; j++) tY.push(34 + j * 22);
      var midX = c.w / 2;
      /* 模型 -> 中枢 */
      for (i = 0; i < M; i++) {
        ctx.strokeStyle = 'rgba(88,166,255,.5)';
        ctx.beginPath(); ctx.moveTo(90, mY[i]); ctx.lineTo(midX - 60, c.h / 2); ctx.stroke();
      }
      /* 中枢 -> 工具 */
      for (j = 0; j < N; j++) {
        ctx.strokeStyle = 'rgba(126,231,135,.5)';
        ctx.beginPath(); ctx.moveTo(midX + 60, c.h / 2); ctx.lineTo(c.w - 110, tY[j]); ctx.stroke();
      }
      /* 模型块 */
      for (i = 0; i < M; i++) {
        ctx.fillStyle = 'rgba(88,166,255,.2)';
        ctx.fillRect(30, mY[i] - 11, 60, 22);
        ctx.strokeStyle = C.blue; ctx.strokeRect(30, mY[i] - 11, 60, 22);
        ctx.fillStyle = C.text; ctx.font = '11px monospace';
        ctx.fillText('模型 ' + (i + 1), 38, mY[i] + 4);
      }
      var tnames = ['终端', '浏览器', '数据库', 'GitHub', '搜索', '邮件', '文件', '日历'];
      for (j = 0; j < N; j++) {
        ctx.fillStyle = 'rgba(126,231,135,.15)';
        ctx.fillRect(c.w - 100, tY[j] - 9, 70, 18);
        ctx.strokeStyle = C.green; ctx.strokeRect(c.w - 100, tY[j] - 9, 70, 18);
        ctx.fillStyle = C.text; ctx.font = '10.5px monospace';
        ctx.fillText(tnames[j], c.w - 92, tY[j] + 4);
      }
      /* MCP 中枢 */
      ctx.fillStyle = 'rgba(255,166,87,.25)';
      ctx.fillRect(midX - 60, c.h / 2 - 26, 120, 52);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5;
      ctx.strokeRect(midX - 60, c.h / 2 - 26, 120, 52);
      ctx.lineWidth = 1;
      ctx.fillStyle = C.orange; ctx.font = 'bold 15px monospace';
      ctx.fillText('MCP', midX - 22, c.h / 2 - 4);
      ctx.fillStyle = C.text; ctx.font = '10.5px monospace';
      ctx.fillText('开放协议', midX - 22, c.h / 2 + 16);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('5 + 8 = 13 份 (省 68%)', midX - 80, 20);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('USB-C 思想: 谁都不为谁定制, 都只为协议实现 — 20×50 规模省 93%', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 协议三步 (播放器推进) ============ */
  (function () {
    var step = 0;
    var steps = [
      { t: '① discover', d: 'client: server/discover → 版本/能力/身份 (_meta 每请求自带)', code: '{"method":"server/discover",\n "_meta":{"protocolVersion":"2026-07-28"}}' },
      { t: '② tools/list', d: 'server 返回工具卡: name + description + inputSchema', code: '{"tools":[{"name":"weather_current",\n  "inputSchema":{"expression":"string..."}}]}' },
      { t: '③ 塞进 prompt', d: 'host 把工具卡写进 system prompt — 模型的 toolbox', code: 'system: 你有工具 weather_current(location)...' },
      { t: '④ tools/call', d: '模型吐 tool_call → host 路由到 server 执行 → 结果回填', code: '{"method":"tools/call",\n "name":"weather_current",\n "arguments":{"location":"SF"}}' }
    ];
    function draw() {
      var c = fit('protoCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* client / server 两个框 */
      ctx.strokeStyle = C.blue;
      ctx.strokeRect(40, 40, 150, c.h - 80);
      ctx.fillStyle = C.blue; ctx.font = MONO;
      ctx.fillText('Host+Client', 62, 60);
      ctx.strokeStyle = C.green;
      ctx.strokeRect(c.w - 210, 40, 170, c.h - 80);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('Server', c.w - 160, 60);
      /* 当前步骤 */
      var s = steps[step];
      ctx.fillStyle = C.orange; ctx.font = 'bold 14px monospace';
      ctx.fillText(s.t, 16, 24);
      /* 消息气泡 */
      var dir = step % 2 === 0 ? '→' : '←';
      ctx.fillStyle = 'rgba(255,166,87,.15)';
      ctx.fillRect(210, 70, c.w - 430, 30);
      ctx.strokeStyle = C.orange; ctx.strokeRect(210, 70, c.w - 430, 30);
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText(dir + '  ' + s.code.split('\n')[0], 222, 90);
      if (s.code.split('\n')[1]) {
        ctx.font = '11px monospace';
        ctx.fillText(s.code.split('\n')[1], 240, 136);
      }
      /* 说明 */
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText(s.d, 210, 170);
      /* 步骤点 */
      steps.forEach(function (st, i) {
        ctx.fillStyle = i === step ? C.orange : C.dark;
        ctx.beginPath();
        ctx.arc(230 + i * 110, 200, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i === step ? C.text : C.dim;
        ctx.font = '10.5px monospace';
        ctx.fillText(st.t, 216 + i * 110, 222);
      });
    }
    var btn = document.getElementById('mcpBtn');
    if (btn) btn.addEventListener('click', function () {
      step = (step + 1) % 4;
      btn.textContent = '下一步 → (' + (step + 1) + '/4)';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 三原语 ============ */
  (function () {
    function draw() {
      var c = fit('primCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('Server 能给的三样东西 + Client 能反过来给的一样', 16, 22);
      var prims = [
        { n: 'Tools', zh: '执行动作', d: 'terminal / API / 数据库写', col: C.orange, ex: 'tools/call' },
        { n: 'Resources', zh: '读数据', d: '文件内容 / schema / 记录', col: C.blue, ex: 'resources/read' },
        { n: 'Prompts', zh: '模板', d: '可复用交互模板 / few-shot', col: C.purple, ex: 'prompts/get' }
      ];
      prims.forEach(function (p, i) {
        var x = 16 + i * (c.w / 3 - 8);
        ctx.fillStyle = p.col + '16';
        ctx.fillRect(x, 40, c.w / 3 - 30, 100);
        ctx.strokeStyle = p.col; ctx.strokeRect(x, 40, c.w / 3 - 30, 100);
        ctx.fillStyle = p.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(p.n, x + 12, 64);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(p.zh, x + 100, 64);
        ctx.font = '11.5px monospace';
        ctx.fillStyle = C.dim;
        ctx.fillText(p.ex, x + 12, 88);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(p.d, x + 12, 116);
      });
      /* elicitation */
      ctx.fillStyle = 'rgba(247,120,186,.12)';
      ctx.fillRect(16, 152, c.w - 32, 34);
      ctx.strokeStyle = C.pink; ctx.strokeRect(16, 152, c.w - 32, 34);
      ctx.fillStyle = C.pink; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('Elicitation (client→)', 24, 172);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('server 反过来问用户: 「确认删除?」— 危险动作的人肉刹车', 170, 172);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('已废弃 (2026-07-28): sampling (server 借 LLM) — 新实现直接调 LLM API', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · Hermes 一天的 MCP 时刻 ============ */
  (function () {
    function draw() {
      var c = fit('hermesCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('你每天在用的架构 (agent 页的协议层)', 16, 22);
      /* Hermes host */
      ctx.fillStyle = 'rgba(88,166,255,.15)';
      ctx.fillRect(30, 44, 200, 120);
      ctx.strokeStyle = C.blue; ctx.strokeRect(30, 44, 200, 120);
      ctx.fillStyle = C.blue; ctx.font = 'bold 14px monospace';
      ctx.fillText('AI 应用 (Host)', 80, 68);
      ctx.fillStyle = C.text; ctx.font = '12px monospace';
      ['MCP Client × N', '路由 tool_call', '回填结果进对话'].forEach(function (t, i) {
        ctx.fillText('· ' + t, 44, 92 + i * 22);
      });
      /* servers */
      var svrs = [
        { n: 'terminal', d: 'stdio 本地' },
        { n: '浏览器', d: 'stdio 本地' },
        { n: 'GitHub', d: 'Streamable HTTP 远程' },
        { n: '搜索', d: 'HTTP 远程' }
      ];
      svrs.forEach(function (s, i) {
        var y = 40 + i * 34;
        ctx.fillStyle = 'rgba(126,231,135,.12)';
        ctx.fillRect(330, y, 240, 26);
        ctx.strokeStyle = C.green; ctx.strokeRect(330, y, 240, 26);
        ctx.fillStyle = C.text; ctx.font = '12px monospace';
        ctx.fillText('Server: ' + s.n, 340, y + 18);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText(s.d, 460, y + 18);
        /* 连线 */
        ctx.strokeStyle = 'rgba(255,166,87,.5)';
        ctx.beginPath(); ctx.moveTo(230, 104); ctx.lineTo(330, y + 13); ctx.stroke();
      });
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('每个 server 一个专属 client — 连接隔离, 各司其职', 16, 184);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('本地工具走 stdio (进程管道, 零网络开销); 远程走 Streamable HTTP + OAuth', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 生态与安全 ============ */
  (function () {
    function draw() {
      var c = fit('ecoCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('2026: 事实标准 + 双刃剑', 16, 22);
      /* 左: 时间线 */
      var tl = [
        ['2024.11', 'Anthropic 开源 MCP', C.blue],
        ['2025.03', 'OpenAI 官宣支持', C.green],
        ['2025.04', 'Google 跟进', C.purple],
        ['2026', '生态爆发: 数千 server', C.orange]
      ];
      tl.forEach(function (t, i) {
        var y = 46 + i * 30;
        ctx.fillStyle = t[2];
        ctx.beginPath(); ctx.arc(80, y, 5, 0, Math.PI * 2); ctx.fill();
        if (i < tl.length - 1) {
          ctx.strokeStyle = 'rgba(139,148,158,.4)';
          ctx.beginPath(); ctx.moveTo(80, y + 5); ctx.lineTo(80, y + 25); ctx.stroke();
        }
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(t[0], 96, y + 4);
        ctx.font = FONT;
        ctx.fillText(t[1], 170, y + 4);
      });
      /* 右: 安全 */
      ctx.fillStyle = 'rgba(248,81,73,.1)';
      ctx.fillRect(c.w / 2 + 20, 40, c.w / 2 - 40, 130);
      ctx.strokeStyle = C.red; ctx.strokeRect(c.w / 2 + 20, 40, c.w / 2 - 40, 130);
      ctx.fillStyle = C.red; ctx.font = 'bold 13px monospace';
      ctx.fillText('安全: 攻击面也标准化了', c.w / 2 + 34, 62);
      ctx.fillStyle = C.text; ctx.font = '12.5px sans-serif';
      ['· 提示注入: 工具描述里藏指令', '· 混淆代理: 恶意 server 借模型之手', '· elicitation 钓鱼: 假装确认框'].forEach(function (t, i) {
        ctx.fillText(t, c.w / 2 + 34, 88 + i * 24);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('缓解: 最小权限 / 白名单 / 人工确认高危工具', c.w / 2 + 34, 158);
      ctx.fillStyle = C.pink; ctx.font = FONT;
      ctx.fillText('协议赢得生态, 生态赢得时代 — USB/HTTP/以太网的历史一再重演', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
