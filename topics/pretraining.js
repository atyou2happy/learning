/* pretraining.js — 全部交互演示（node --check 可直接校验） */
(function () {
  'use strict';
  var C = {
    blue: '#58a6ff', pink: '#f778ba', green: '#7ee787',
    orange: '#ffa657', purple: '#a371f7', red: '#f85149',
    dim: '#8b949e', dark: '#30363d', bg: '#0a0d12', text: '#C9D1D9'.toLowerCase()
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

  /* ============ 图1 · 猜词游戏: 压缩即智能 ============ */
  (function () {
    function draw() {
      var c = fit('gameCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('任务只有一个: 猜下一个词', 16, 24);
      var rows = [
        ['「白日依山___」', '尽', '诗词规律', C.blue],
        ['「def add(a, b): return___」', 'a+b', '代码语法', C.green],
        ['「地球绕着___转」', '太阳', '世界知识', C.orange],
        ['「她说谢谢, 他回答___」', '不客气', '社交惯例', C.purple]
      ];
      rows.forEach(function (r, i) {
        var y = 44 + i * 32;
        ctx.fillStyle = r[3] + '18';
        ctx.fillRect(16, y, c.w - 32, 26);
        ctx.fillStyle = C.text; ctx.font = '12.5px monospace';
        ctx.fillText(r[0], 24, y + 18);
        ctx.fillStyle = r[3];
        ctx.fillText('→ ' + r[1], c.w / 2 + 20, y + 18);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r[2], c.w - 110, y + 18);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('想猜得准, 就必须懂诗词/代码/天文/人情 — 压缩即智能', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 幂律 + Chinchilla (核心交互) ============ */
  (function () {
    function lossN(N) { return 1.69 + 406.4 * Math.pow(N, -0.34); }
    function draw() {
      var c = fit('scalingCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 64, y0 = c.h - 40, x1 = c.w - 24, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('loss', 12, y1 + 8);
      ctx.fillText('参数量 N (log) →', x0 + 40, c.h - 12);
      /* 幂律曲线: log-log 上近似直线 */
      var Ns = [1e8, 1e9, 1e10, 1e11, 1e12];
      function px(n) { return x0 + (Math.log10(n) - 8) / 4 * (x1 - x0); }
      function py(l) { return y0 - (l - 1.6) / 0.95 * (y0 - y1); }
      /* y 刻度 */
      [1.7, 1.8, 2.0, 2.2, 2.5].forEach(function (v) {
        var y = py(v);
        ctx.strokeStyle = 'rgba(139,148,158,.15)';
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.fillStyle = C.dim;
        ctx.fillText(v.toFixed(1), x0 - 30, y + 4);
      });
      Ns.forEach(function (n) {
        ctx.fillStyle = C.dim;
        ctx.fillText('1e' + Math.round(Math.log10(n)), px(n) - 12, y0 + 16);
      });
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var n = 1e8; n <= 1e12; n *= 1.15) {
        var X = px(n), Y = py(lossN(n));
        if (n === 1e8) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('L(N) = 1.69 + 406·N^-0.34 — 平滑可预测的幂律', x0 + 30, y1 + 16);
      /* 关键点标注 */
      var marks = [
        { n: 1.75e11, lbl: 'GPT-3 175B', col: C.red, note: 'L≈1.76' },
        { n: 7e10, lbl: 'Chinchilla 70B', col: C.green, note: 'L≈1.77 (同算力更优)' }
      ];
      marks.forEach(function (m) {
        var X = px(m.n), Y = py(lossN(m.n));
        ctx.fillStyle = m.col;
        ctx.beginPath(); ctx.arc(X, Y, 6, 0, 7); ctx.fill();
        ctx.fillStyle = m.col; ctx.font = MONO;
        ctx.fillText(m.lbl, X - 30, Y - 24);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(m.note, X - 20, Y + 20);
      });
      /* 拐点说明 */
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('渐近线 1.69: 熵的下界 — 语料本身的不可预测性', x1 - 300, py(1.70) - 8);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('惊人之处: 从小模型外推大模型的 loss — 军备竞赛的理论依据', x0, y0 + 30);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · tok/param 审计 (Chinchilla) ============ */
  (function () {
    function draw() {
      var c = fit('ratioCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: 'GPT-3 175B', r: 1.7, col: C.red, note: '训练不足 11x' },
        { n: 'LLaMA-1 65B', r: 18.5, col: C.green, note: '贴近最优' },
        { n: 'Chinchilla 70B', r: 20, col: C.green, note: '最优基准' },
        { n: 'Llama-3 70B', r: 214, col: C.purple, note: '过训 10x: 为推理期省钱' }
      ];
      var maxR = 220;
      rows.forEach(function (r, i) {
        var y = 24 + i * ((c.h - 60) / 4);
        var w = r.r / maxR * (c.w - 420);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(170, y, Math.max(6, w), 24);
        ctx.strokeStyle = r.col; ctx.strokeRect(170, y, Math.max(6, w), 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 17);
        ctx.font = MONO;
        ctx.fillText(r.r + ' tok/param', 176 + Math.max(6, w) + 8, y + 17);
        ctx.fillStyle = r.col; ctx.font = FONT;
        ctx.fillText(r.note, c.w - 190, y + 17);
      });
      /* 最优带 */
      var bx = 170 + 20 / maxR * (c.w - 420);
      ctx.strokeStyle = C.green;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(bx, 14); ctx.lineTo(bx, c.h - 44); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('C = 6ND · 同样算力: GPT-3 堆参数(175B), Chinchilla 堆数据(70B) — 后者更强', 16, c.h - 22);
      ctx.fillText('推理时代转向: 训练期过训 (贵一次), 换推理期小模型多服务 (省每次)', 16, c.h - 6);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 成本演进 ============ */
  (function () {
    function draw() {
      var c = fit('costCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var models = [
        { n: 'GPT-2 1.5B', m: 0.05, col: C.dim },
        { n: 'GPT-3 175B', m: 4.6, col: C.blue },
        { n: 'PaLM 540B', m: 12, col: C.green },
        { n: 'GPT-4 (传闻)', m: 100, col: C.red },
        { n: 'DeepSeek-V3 671B', m: 5.58, col: C.orange }
      ];
      var maxM = 110;
      models.forEach(function (m, i) {
        var y = 20 + i * ((c.h - 66) / 5);
        var w = m.m / maxM * (c.w - 300);
        ctx.fillStyle = m.col + '55';
        ctx.fillRect(190, y, Math.max(5, w), 22);
        ctx.strokeStyle = m.col; ctx.strokeRect(190, y, Math.max(5, w), 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(m.n, 16, y + 16);
        ctx.font = MONO;
        ctx.fillText('$' + m.m + 'M', 196 + Math.max(5, w) + 8, y + 16);
      });
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('DS-V3: 671B 参数只要 $5.58M — FP8 训练 + MoE 5.5% 激活 + MFU 工程优化', 16, c.h - 26);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('效率革命的三大件都在本知识库: FP8(量化页) · MoE(MoE页) · FlashAttention(训练引擎页)', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 涌现曲线 ============ */
  (function () {
    function draw() {
      var c = fit('emergeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 56, y0 = c.h - 40, x1 = c.w - 24, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('准确率', 8, y1 + 8);
      ctx.fillText('训练算力 (log) →', x0 + 40, c.h - 12);
      /* 两条任务曲线 */
      function smooth(x) { return 1 / (1 + Math.exp(-x)); }
      /* 平滑任务: 低位缓慢升 */
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= 100; i++) {
        var X = x0 + i / 100 * (x1 - x0);
        var Y = y0 - (0.15 + 0.55 * i / 100) * (y0 - y1);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      /* 涌现任务: 平坦后突跳 */
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var j = 0; j <= 100; j++) {
        var X2 = x0 + j / 100 * (x1 - x0);
        var prog = smooth((j - 62) * 0.5);
        var Y2 = y0 - (0.02 + 0.88 * prog) * (y0 - y1);
        if (j === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('加法/翻译: 平滑提升', x0 + 16, y1 + 44);
      ctx.fillStyle = C.pink;
      ctx.fillText('多位数乘法/代码: 「突然会了」', x0 + (x1 - x0) * 0.42, y1 + 22);
      /* 涌现点 */
      var ex = x0 + (x1 - x0) * 0.62;
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(ex, y0); ctx.lineTo(ex, y1 + 30); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('涌现阈值', ex - 24, y1 + 18);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('争论: 突跳是真实相变还是离散度量(过线才算对)的幻觉? 连续度量下往往变回平滑', x0, c.h - 4);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 数据配比 ============ */
  (function () {
    function draw() {
      var c = fit('mixCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var segs = [
        { n: '网页文本', pct: 40, col: C.blue },
        { n: '代码', pct: 20, col: C.green },
        { n: '数学/论文', pct: 15, col: C.orange },
        { n: '多语言', pct: 15, col: C.purple },
        { n: '百科/书籍', pct: 10, col: C.pink }
      ];
      var total = 100, x = 20;
      segs.forEach(function (s) {
        var w = s.pct / total * (c.w - 40);
        ctx.fillStyle = s.col + '55';
        ctx.fillRect(x, 40, w - 4, 46);
        ctx.strokeStyle = s.col; ctx.strokeRect(x, 40, w - 4, 46);
        ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
        ctx.fillText(s.pct + '%', x + w / 2 - 14, 58);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(s.n, x + w / 2 - 24, 76);
        x += w;
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('为什么必须掺代码和数学? 推理链的燃料', 20, 24);
      var notes = [
        '代码: 结构严格 (if/for/缩进) — 学会「一步一步」的结构化思维, 迁移到推理',
        '数学: 符号操作密集 — CoT 与 R1 的地基 (Reasoning 页)',
        '多语言: 中文问题英文答也能对 — 但注意 Tokenizer 页: 词表偏英文则中文贵'
      ];
      ctx.fillStyle = C.dim; ctx.font = FONT;
      notes.forEach(function (n, i) {
        ctx.fillText('· ' + n, 20, 112 + i * 20);
      });
    }
    draw(); redraws.push(draw);
  })();

})();
