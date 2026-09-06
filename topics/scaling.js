/* scaling.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 幂律: 残酷汇率 ============ */
  (function () {
    function draw() {
      var c = fit('powerCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 60, y0 = c.h - 40, x1 = c.w - 30, y1 = 24;
      /* 轴 */
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('loss', 10, y1 + 8);
      ctx.fillText('算力 (log) →', x0 + 40, c.h - 12);
      /* 幂律曲线 L = 2.0 * C^-0.05 (log-log 为直线) */
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath();
      var i;
      for (i = 0; i <= 100; i++) {
        var lc = Math.pow(10, -2 + i / 100 * 5); /* 0.01e..100e FLOPs区间 */
        var L = 2.57 * Math.pow(lc / 1e20, -0.05);
        var X = x0 + i / 100 * (x1 - x0);
        var Y = y0 - (L - 1.8) / 0.9 * (y0 - y1);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* 阶梯标注: 10倍算力换一丁点loss */
      [[0.22, 'x10 算力'], [0.5, 'x100'], [0.78, 'x1000']].forEach(function (m, k) {
        var X = x0 + m[0] * (x1 - x0);
        var X2 = x0 + (m[0] + (k === 0 ? 0.28 : 0.28)) * (x1 - x0);
        ctx.strokeStyle = C.orange;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y1 + 40); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.orange; ctx.font = '11.5px monospace';
        ctx.fillText(m[1], X - 20, y1 + 54);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('loss = 2.57 · C^(−0.05)', x0 + (x1 - x0) * 0.35, y1 + 18);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('10 倍算力 → loss 只相对降 11% — 残酷但可预测', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · Kaplan vs Chinchilla ============ */
  (function () {
    function draw() {
      var c = fit('vsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('同样 ~5e23 FLOPs, 两种花法 (2020 vs 2022)', 16, 22);
      var twins = [
        { n: 'Gopher', y: 2020, N: 280, D: 300, col: C.red, note: 'Kaplan 建议: 参数优先' },
        { n: 'Chinchilla', y: 2022, N: 70, D: 1400, col: C.green, note: '反例: 数据同举 → 20 tok/param' }
      ];
      twins.forEach(function (t, i) {
        var x = 30 + i * (c.w / 2 - 20);
        ctx.fillStyle = t.col + '14';
        ctx.fillRect(x, 40, c.w / 2 - 60, 130);
        ctx.strokeStyle = t.col; ctx.strokeRect(x, 40, c.w / 2 - 60, 130);
        ctx.fillStyle = t.col; ctx.font = 'bold 14px monospace';
        ctx.fillText(t.n + ' (' + t.y + ')', x + 14, 64);
        /* N 与 D 双柱 */
        var maxV = 1400;
        var wN = t.N / 280 * 90;
        var wD = t.D / maxV * 220;
        ctx.fillStyle = C.blue + '99';
        ctx.fillRect(x + 14, 84, wN, 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText('参数 ' + t.N + 'B', x + 14 + wN + 6, 100);
        ctx.fillStyle = C.orange + '99';
        ctx.fillRect(x + 14, 116, wD, 22);
        ctx.fillStyle = C.text;
        ctx.fillText('数据 ' + t.D + 'B tok', x + 14 + wD + 6, 132);
        ctx.fillStyle = t.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText((t.D / t.N).toFixed(1) + ' tok/param', x + 14, 158);
      });
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('结果: 1/4 大小的 Chinchilla 全面胜过 Gopher — 大逆转', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 算力计算器 (核心交互) ============ */
  (function () {
    var budget = 22; /* 10^22 */
    function draw() {
      var c = fit('calcCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* iso-loss 等高线: 谷底沿 N ∝ C^0.5 */
      var x0 = 70, y0 = c.h - 40, x1 = c.w - 30, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('数据 tokens (log) →', x0 + 60, c.h - 12);
      ctx.save();
      ctx.translate(16, (y0 + y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('参数 N (log)', 0, 0);
      ctx.restore();
      /* 三条等高线 (示意: 椭圆弧) */
      ['#30363d', '#3d444d', '#30363d'].forEach(function (col, i) {
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.ellipse(x0 + (x1 - x0) * 0.45, y0 - (y0 - y1) * 0.5, 60 + i * 55, 40 + i * 38, -0.6, Math.PI, Math.PI * 2);
        ctx.stroke();
      });
      /* 谷底线: N*sqrt(20/D)... 直接画 N = C/(6D) 的 45 度线 + 最优点轨迹 */
      ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0 + 20, y0 - (y0 - y1) * 0.9);
      ctx.lineTo(x1 - 10, y0 - (y0 - y1) * 0.1);
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('最优线 (Chinchilla 谷底): N ∝ C^0.5, D ∝ C^0.5', x0 + (x1 - x0) * 0.3, y1 + 16);
      /* 当前预算点: C = 6ND, 最优点 N=sqrt(C/120), D=20N */
      var Cb = Math.pow(10, budget);
      var N = Math.sqrt(Cb / 120);
      var D = 20 * N;
      var px = x0 + (Math.log10(D) - 11) / 5 * (x1 - x0);
      var py = y0 - (Math.log10(N) - 8) / 4 * (y0 - y1);
      px = Math.max(x0 + 5, Math.min(x1 - 5, px));
      py = Math.max(y1 + 5, Math.min(y0 - 5, py));
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('最优: ' + (N / 1e9).toFixed(0) + 'B 参数 × ' + (D / 1e12).toFixed(1) + 'T tok', px + 12, py - 10);
      /* GPU 天数 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      var gpuDays = Cb / 6e14 / 86400;
      ctx.fillText('≈ ' + (gpuDays).toFixed(0) + ' H100-天', px + 12, py + 12);
    }
    var slider = document.getElementById('budgetSlider');
    var lbl = document.getElementById('budgetLabel');
    if (slider) slider.addEventListener('input', function () {
      budget = parseFloat(slider.value); /* 20 .. 25 */
      if (lbl) lbl.textContent = '1e' + budget.toFixed(0) + ' FLOPs';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · tok/param 光谱 ============ */
  (function () {
    function draw() {
      var c = fit('specCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('实际模型的 tok/param: 从 1 到 1875', 16, 22);
      var models = [
        { n: 'GPT-3', r: 1.7, col: C.red },
        { n: 'Gopher', r: 1.1, col: C.red },
        { n: 'Chinchilla', r: 20, col: C.green },
        { n: 'Llama2-70B', r: 29, col: C.green },
        { n: 'Llama3-405B', r: 37, col: C.orange },
        { n: 'Llama3-70B', r: 214, col: C.orange },
        { n: 'Llama3-8B', r: 1875, col: C.pink }
      ];
      /* log 轴 0.5..3000 */
      var x0 = 110, x1 = c.w - 130;
      models.forEach(function (m) {
        var X = x0 + (Math.log10(m.r / 0.5) / Math.log10(3000 / 0.5)) * (x1 - x0);
        ctx.fillStyle = m.col;
        ctx.beginPath(); ctx.arc(X, 70, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.save();
        ctx.translate(X, 96);
        ctx.rotate(-0.65);
        ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(m.n + ' ' + m.r, -14, 0);
        ctx.restore();
      });
      /* 轴 */
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, 130); ctx.lineTo(x1, 130); ctx.stroke();
      [1, 10, 100, 1000].forEach(function (v) {
        var X = x0 + (Math.log10(v / 0.5) / Math.log10(3000 / 0.5)) * (x1 - x0);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText('' + v, X - 8, 148);
      });
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('← Kaplan 时代', x0, 170);
      ctx.fillText('Chinchilla 20 ←', x0 + (Math.log10(20 / 0.5) / Math.log10(3000 / 0.5)) * (x1 - x0) - 40, 170);
      ctx.fillStyle = C.pink;
      ctx.fillText('推理最优 (Llama3) →', x1 - 130, 170);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('训练最优 ≠ 端到端最优: 服务成本进场后, 过量训练反而是省钱的', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 训练 vs 服务 ============ */
  (function () {
    function draw() {
      var c = fit('serveCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('训练一次 vs 服务十亿次 — 账目反转', 16, 22);
      /* 左: 训练 */
      var x1 = 30, x2 = c.w / 2 + 20;
      ctx.fillStyle = 'rgba(88,166,255,.14)';
      ctx.fillRect(x1, 40, c.w / 2 - 60, 110);
      ctx.strokeStyle = C.blue; ctx.strokeRect(x1, 40, c.w / 2 - 60, 110);
      ctx.fillStyle = C.blue; ctx.font = 'bold 13px monospace';
      ctx.fillText('训练 (一次)', x1 + 14, 62);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('Chinchilla-70B: 训练最优', x1 + 14, 88);
      ctx.fillText('70B 服务一次前向 = 140GB 权重', x1 + 14, 110);
      ctx.fillStyle = C.red; ctx.font = '12.5px monospace';
      ctx.fillText('decode 贵 9 倍 (vs 8B)', x1 + 14, 132);
      /* 右: 服务 */
      ctx.fillStyle = 'rgba(126,231,135,.14)';
      ctx.fillRect(x2, 40, c.w / 2 - 60, 110);
      ctx.strokeStyle = C.green; ctx.strokeRect(x2, 40, c.w / 2 - 60, 110);
      ctx.fillStyle = C.green; ctx.font = 'bold 13px monospace';
      ctx.fillText('服务 (无数次)', x2 + 14, 62);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('Llama3-8B: 推理最优', x2 + 14, 88);
      ctx.fillText('8B 服务一次前向 = 16GB 权重', x2 + 14, 110);
      ctx.fillStyle = C.green; ctx.font = '12.5px monospace';
      ctx.fillText('牺牲一点 loss 换长期便宜', x2 + 14, 132);
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('同量级算力 (~7e23) 两种花法: Chinchilla 训练完更强, 但每次回答都贵 — 服务量上来后端到端成本反转', 16, 164);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('推论: 越是高频服务的小模型, 越值得过量训练 (1875 tok/param 不是浪费, 是精明)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 数据墙 ============ */
  (function () {
    function draw() {
      var c = fit('wallCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('数据墙: Chinchilla 配比 + 10T 级模型要多少语料?', 16, 22);
      /* 互联网语料池 */
      var poolW = c.w - 60;
      ctx.fillStyle = 'rgba(163,113,247,.2)';
      ctx.fillRect(30, 44, poolW, 40);
      ctx.strokeStyle = C.purple; ctx.strokeRect(30, 44, poolW, 40);
      ctx.fillStyle = C.purple; ctx.font = FONT;
      ctx.fillText('Common Crawl 去重后高质量文本: ~10-30T token (全人类公开网页)', 40, 68);
      /* 已用 */
      ctx.fillStyle = 'rgba(255,166,87,.55)';
      ctx.fillRect(30, 44, poolW * 0.55, 40);
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('Llama3 已用 15T', 44, 68);
      /* 需求箭头 */
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('10T 模型 × 20 tok/param = 200T token 需求 — 互联网的十倍!', 30, 108);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      var outs = [
        '出路 1: 合成数据 (模型生成训练数据 — R1/Phi 的路线)',
        '出路 2: 多轮/课程 (同一数据换个姿势再学)',
        '出路 3: 侧路 — 冻结大模型只训小的 (Mostik 页的桥)',
        '出路 4: test-time compute — 不加数据, 加推理时思考 (Reasoning 页)'
      ];
      outs.forEach(function (o, i) {
        ctx.fillText(o, 30, 132 + i * 21);
      });
    }
    draw(); redraws.push(draw);
  })();

})();
