/* ffn.js — 全部交互演示（分 3 段写入，合并后 node --check 校验） P1 */
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

  /* ============ 图1 · 藏宝图：每层参数饼图 ============ */
  (function () {
    var names = ['FFN 8d² = 134.2M', 'Attention 4d² = 67.1M'];
    var vals = [66.7, 33.3];
    var cols = [C.pink, C.blue];
    function draw() {
      var c = fit('pieCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左：donut */
      var cx = c.h / 2 + 6, cy = c.h / 2 + 6, r = c.h / 2 - 30;
      var a0 = -Math.PI / 2;
      for (var i = 0; i < 2; i++) {
        var a1 = a0 + vals[i] / 100 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a0, a1); ctx.closePath();
        ctx.fillStyle = cols[i] + 'cc'; ctx.fill();
        a0 = a1;
      }
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = C.bg; ctx.fill();
      ctx.fillStyle = C.text; ctx.font = 'bold 17px monospace'; ctx.textAlign = 'center';
      ctx.fillText('67%', cx, cy - 4);
      ctx.font = FONT; ctx.fillStyle = C.dim;
      ctx.fillText('每层的参数', cx, cy + 16);
      ctx.textAlign = 'left';
      /* 右：真实模型对账条 */
      var rx = cx + r + 40, rw = c.w - rx - 16;
      var rows = [
        { n: '标准块 d=4096', p: 66.7, note: 'attn 67.1M / ffn 134.2M' },
        { n: 'Llama-3-8B 每层', p: 69.2, note: 'ffn 151.0M / attn 67.1M' },
        { n: 'Llama-3-8B 全模型', p: 64.4, note: '32层+嵌入摊薄' }
      ];
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('真实模型对账 · FFN 占比', rx, 24);
      rows.forEach(function (b, i) {
        var y = 46 + i * 44;
        ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(b.n, rx, y + 4);
        ctx.fillStyle = C.dark; ctx.fillRect(rx, y + 10, rw, 16);
        ctx.fillStyle = C.pink; ctx.fillRect(rx, y + 10, rw * b.p / 100, 16);
        ctx.fillStyle = C.dim; ctx.font = '12px monospace';
        ctx.fillText(b.p + '%  ' + b.note, rx, y + 38);
      });
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 键值检索动画（stepper） ============ */
  (function () {
    var KNAMES = ['食物上下文', '地理上下文', '形容词槽位', '人物/实体', '首都模板', '弱噪声键'];
    var ACTS = [0.12, 1.95, 0.26, 0.84, 0.93, 0.00];
    var VNOTE = ['', 'v1: France +2.0', '', 'v3: a +0.5', 'v4: France +2.2', ''];
    var COLORS = [C.dim, C.green, C.dim, C.orange, C.pink, C.dim];
    var step = 0, MAXS = 5;
    var btn = document.getElementById('stepBtn');
    var rbtn = document.getElementById('resetBtn');
    if (btn) btn.addEventListener('click', function () {
      step = Math.min(step + 1, MAXS);
      if (btn) btn.textContent = step >= MAXS ? '已完成 ↺' : '下一步 →';
      draw();
    });
    if (rbtn) rbtn.addEventListener('click', function () {
      step = 0; if (btn) btn.textContent = '下一步 →'; draw();
    });
    function draw() {
      var c = fit('kvCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('查询: "The capital of France is __" → x·K 匹配 6 个键', 14, 20);
      var colW = (c.w - 28) / 3;
      /* 列1: 键匹配 */
      ctx.fillStyle = C.dim; ctx.font = 'bold 12px monospace';
      ctx.fillText('① x · K （模式匹配）', 14, 44);
      for (var i = 0; i < 6; i++) {
        var y = 56 + i * 36;
        var lit = ACTS[i] > 0.5;
        ctx.strokeStyle = lit && step >= 1 ? COLORS[i] : C.dark;
        ctx.fillStyle = lit && step >= 1 ? COLORS[i] + '22' : 'rgba(48,54,61,0.25)';
        ctx.fillRect(14, y, colW - 20, 30); ctx.strokeRect(14, y, colW - 20, 30);
        ctx.fillStyle = lit && step >= 1 ? C.text : C.dim;
        ctx.font = lit && step >= 1 ? 'bold 12px monospace' : '12px monospace';
        ctx.fillText(KNAMES[i], 22, y + 13);
        ctx.fillStyle = lit && step >= 1 ? COLORS[i] : C.dim;
        ctx.fillText('act ' + ACTS[i].toFixed(2), 22, y + 26);
      }
      /* 列2: 激活值 */
      var cx2 = 14 + colW;
      ctx.fillStyle = C.dim; ctx.font = 'bold 12px monospace';
      ctx.fillText('② 激活 f(·) （稀疏）', cx2, 44);
      var maxA = 2.0;
      for (i = 0; i < 6; i++) {
        y = 60 + i * 34;
        ctx.fillStyle = C.dark; ctx.fillRect(cx2, y, colW - 30, 14);
        if (step >= 2 && ACTS[i] > 0.05) {
          ctx.fillStyle = ACTS[i] > 0.5 ? COLORS[i] : C.dim;
          ctx.fillRect(cx2, y, (colW - 30) * ACTS[i] / maxA, 14);
        }
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(step >= 2 ? ACTS[i].toFixed(2) : '·', cx2 + colW - 24, y + 12);
      }
      if (step >= 2) {
        ctx.fillStyle = C.orange; ctx.font = 'bold 12px monospace';
        ctx.fillText('top-2 键占激活量 70%', cx2, 274);
      }
      /* 列3: 记忆读出 */
      var cx3 = cx2 + colW;
      ctx.fillStyle = C.dim; ctx.font = 'bold 12px monospace';
      ctx.fillText('③ Σ act·V 写入残差流', cx3, 44);
      var toks = [
        { t: 'France', d: '+5.95', col: C.green },
        { t: 'a', d: '+0.42', col: C.dim },
        { t: 'is', d: '+0.26', col: C.dim },
        { t: 'the', d: '-0.12', col: C.dim }
      ];
      toks.forEach(function (tk, i) {
        y = 56 + i * 36;
        var on = step >= 3 + (i === 0 ? 0 : 1);
        ctx.strokeStyle = on ? (tk.col === C.green ? C.green : C.dark) : C.dark;
        ctx.fillStyle = on && tk.col === C.green ? C.green + '22' : 'rgba(48,54,61,0.25)';
        ctx.fillRect(cx3, y, colW - 14, 30); ctx.strokeRect(cx3, y, colW - 14, 30);
        ctx.fillStyle = on && tk.col === C.green ? C.text : C.dim;
        ctx.font = on && tk.col === C.green ? 'bold 13px monospace' : '12.5px monospace';
        ctx.fillText(tk.t, cx3 + 10, y + 13);
        ctx.fillStyle = on ? tk.col : C.dim; ctx.font = '12px monospace';
        ctx.fillText('logit ' + tk.d, cx3 + 10, y + 26);
      });
      if (step >= 5) {
        ctx.fillStyle = C.green; ctx.font = 'bold 12px monospace';
        ctx.fillText('→ 下一词: France ✓', cx3, 274);
      }
    }
    draw(); redraws.push(draw);
  })();
/* ffn.js P2 — 图3 知识编辑模拟器 + 图4 插卡 */
  /* ============ 图3 · 知识编辑模拟器 ============ */
  (function () {
    var STAGES = [
      { n: '原始模型', note: '键值表原样', fr: 98.3, de: 0.3, other: 0.3, mode: 0 },
      { n: '改 1 个值 (v4)', note: 'ROME rank-one: 只改「首都模板」键', fr: 78.8, de: 12.2, other: 10.4, mode: 1 },
      { n: '改 2 个值 (v4+v1)', note: '连「地理上下文」键一起改 — 彻底翻转', fr: 0.3, de: 98.3, other: 98.2, mode: 2 }
    ];
    var st = 0;
    var ebtn = document.getElementById('editBtn');
    var ubtn = document.getElementById('undoBtn');
    if (ebtn) ebtn.addEventListener('click', function () {
      st = Math.min(st + 1, 2);
      if (ebtn) ebtn.textContent = st >= 2 ? '已彻底翻转 ↺' : '执行编辑 →';
      draw();
    });
    if (ubtn) ubtn.addEventListener('click', function () {
      st = 0; if (ebtn) ebtn.textContent = '执行编辑 →'; draw();
    });
    function draw() {
      var c = fit('editCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var s = STAGES[st];
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('手术台: "The capital of France is __" — ' + s.n, 14, 20);
      ctx.fillStyle = C.dim; ctx.font = '12px monospace';
      ctx.fillText(s.note + '   (数字 = node 实测, 非手写)', 14, 38);
      /* 左：两键状态 */
      var keys = [
        { n: 'v1 地理上下文', v0: 'France +2.0', v1: 'France +2.0', v2: 'Germany +2.0' },
        { n: 'v4 首都模板', v0: 'France +2.2', v1: 'Germany +2.2', v2: 'Germany +2.2' }
      ];
      keys.forEach(function (k, i) {
        var y = 56 + i * 46;
        var edited = st === 2 || (st === 1 && i === 1);
        ctx.strokeStyle = edited ? C.red : C.dark;
        ctx.fillStyle = edited ? C.red + '22' : 'rgba(48,54,61,0.25)';
        ctx.fillRect(14, y, 240, 38); ctx.strokeRect(14, y, 240, 38);
        ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(k.n + (edited ? '  [已改写]' : ''), 22, y + 16);
        ctx.fillStyle = edited ? C.red : C.green; ctx.font = '12px monospace';
        ctx.fillText('记忆: ' + (edited ? k.v2 : k.v0), 22, y + 31);
      });
      /* 右：概率读数 */
      var rx = 280, rw = c.w - rx - 16;
      var rows = [
        { n: '本题 P(France)', p: s.fr, col: C.blue },
        { n: '本题 P(Germany)', p: s.de, col: C.red },
        { n: '别的地理题 P(Germany)', p: s.other, col: C.orange }
      ];
      rows.forEach(function (b, i) {
        var y = 56 + i * 46;
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(b.n, rx, y + 4);
        ctx.fillStyle = C.dark; ctx.fillRect(rx, y + 10, rw, 16);
        ctx.fillStyle = b.col; ctx.fillRect(rx, y + 10, rw * b.p / 100, 16);
        ctx.fillStyle = b.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(b.p.toFixed(1) + '%', rx + rw + 6 - 60, y + 23);
      });
      /* 底部诊断 */
      var msg = [
        '原始: 事实记忆完好 — France 98.3% 由 v1+v4 两个键共同支撑',
        '改 1 个值: 只降 20pp — 一个事实存在多个键里, 单点手术不彻底',
        '彻底翻转 ✓ 但出血: 别的地理题 Germany 98.2% — 共享键被连带改写'
      ][st];
      ctx.fillStyle = st === 2 ? C.red : C.dim;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(msg, 14, c.h - 14);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 三种改表方式 ============ */
  (function () {
    function draw() {
      var c = fit('cardCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var colW = (c.w - 40) / 3;
      var cards = [
        {
          n: 'LoRA 插卡', col: C.purple,
          lines: ['冻结整张键值表', '外挂 W=BA 低秩小卡', '容量 r — 只装得下偏置'],
          verdict: '学会新行为 ✓  新知识 ✗'
        },
        {
          n: 'MoE 分库', col: C.orange,
          lines: ['一张表 → 257 张分库', '路由器按 token 查库', '只有 8 库点火 (5.5%算力)'],
          verdict: '知识分片存放 · 按需检索'
        },
        {
          n: '全参微调', col: C.blue,
          lines: ['重写整张表', '最贵最彻底', '旧记忆易被写花(遗忘)'],
          verdict: '器官级手术 · 慎用'
        }
      ];
      cards.forEach(function (cd, i) {
        var x = 14 + i * (colW + 6);
        ctx.strokeStyle = cd.col;
        ctx.fillStyle = cd.col + '10';
        ctx.fillRect(x, 14, colW, c.h - 40); ctx.strokeRect(x, 14, colW, c.h - 40);
        ctx.fillStyle = cd.col; ctx.font = 'bold 14px monospace';
        ctx.fillText(cd.n, x + 14, 40);
        ctx.fillStyle = C.text; ctx.font = '12.5px monospace';
        cd.lines.forEach(function (ln, j) {
          ctx.fillText('· ' + ln, x + 14, 68 + j * 24);
        });
        ctx.fillStyle = cd.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(cd.verdict, x + 14, c.h - 38);
      });
      ctx.fillStyle = C.dim; ctx.font = '12px monospace';
      ctx.fillText('LoRA 页: 「LoRA 学不会新知识, 那是 RAG 的活」 — 本页给出实体原因: 小卡片插不进具体的记忆行', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
/* ffn.js P3 — 图5 世界观 + 关闭 IIFE */
  /* ============ 图5 · LLM 是一台检索系统 ============ */
  (function () {
    var steps = [
      { n: '预训练', sub: '写入', note: '互联网 → 67% 参数', col: C.blue, href: 'pretraining.html' },
      { n: '推理', sub: '查询', note: '每 token 一次稀疏检索', col: C.green, href: 'kv-cache.html' },
      { n: 'LoRA / ROME', sub: '改卡', note: '插小卡 / rank-one 改行', col: C.purple, href: 'lora.html' },
      { n: '幻觉', sub: '检索失误', note: '查无此键仍读出记忆', col: C.red, href: 'hallucination.html' }
    ];
    function draw() {
      var c = fit('worldCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 中心: FFN 表 */
      var cx = c.w / 2, cy = c.h / 2;
      ctx.strokeStyle = C.pink; ctx.fillStyle = C.pink + '14';
      ctx.fillRect(cx - 110, cy - 34, 220, 68); ctx.strokeRect(cx - 110, cy - 34, 220, 68);
      ctx.fillStyle = C.text; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
      ctx.fillText('FFN 键值表', cx, cy - 6);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('K = 模式探测器 · V = 记忆', cx, cy + 16);
      /* 四角动作 */
      var pos = [
        { x: 150, y: 40 }, { x: c.w - 150, y: 40 },
        { x: 150, y: c.h - 40 }, { x: c.w - 150, y: c.h - 40 }
      ];
      steps.forEach(function (s, i) {
        var p = pos[i];
        ctx.strokeStyle = s.col; ctx.fillStyle = s.col + '18';
        ctx.beginPath(); ctx.arc(p.x, p.y, 44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = s.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(s.n, p.x, p.y - 2);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText(s.sub, p.x, p.y + 14);
        /* 连线 */
        ctx.strokeStyle = s.col + '88';
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(cx + (p.x < cx ? -110 : 110), cy + (p.y < cy ? -30 : 30));
        ctx.stroke();
        /* 连线标注 */
        var mx = (p.x + cx) / 2, my = (p.y + cy) / 2;
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(s.note, mx, my - 6);
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('模型不是数据库 — 但它的知识确实存在可定位、可编辑、也会检索失误的物理结构里', 14, 20);
    }
    draw(); redraws.push(draw);
  })();
})();
