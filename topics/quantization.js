/* quantization.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 显存墙 ============ */
  (function () {
    function draw() {
      var c = fit('wallCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var models = [
        { n: '13B fp16', gb: 26, col: C.blue },
        { n: '70B fp16', gb: 140, col: C.orange },
        { n: '671B fp16', gb: 1342, col: C.red }
      ];
      var maxG = 1400;
      var y = 26;
      models.forEach(function (m) {
        var w = m.gb / maxG * (c.w - 200);
        ctx.fillStyle = m.col + '55';
        ctx.fillRect(120, y, Math.max(4, w), 30);
        ctx.strokeStyle = m.col; ctx.strokeRect(120, y, Math.max(4, w), 30);
        ctx.fillStyle = C.text; ctx.font = MONO;
        ctx.fillText(m.n, 16, y + 20);
        ctx.fillText(m.gb + ' GB', 128 + Math.max(4, w) + 8, y + 20);
        y += 44;
      });
      /* 卡标线 */
      var marks = [
        { n: 'RTX 4090 (24G)', gb: 24, col: C.green },
        { n: 'A100-80G', gb: 80, col: C.purple }
      ];
      marks.forEach(function (mk) {
        var x = 120 + mk.gb / maxG * (c.w - 200);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = mk.col;
        ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, y + 14); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = mk.col; ctx.font = FONT;
        ctx.fillText(mk.n, x - 34, y + 28);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('只是权重! 还没算 KV Cache 与激活 — 671B fp16 需要 20 张 A100', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 量化网格 (核心交互) ============ */
  (function () {
    var bits = 8;
    var RANGE = 4;
    function draw() {
      var c = fit('gridCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 数轴 */
      var x0 = 40, x1 = c.w - 40, y0 = c.h / 2;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      /* 网格点 */
      var levels = Math.pow(2, bits) - 1;
      var half = (levels + 1) / 2;
      var scale = RANGE / half;
      var nMark = Math.min(levels, 16);
      var vals = [];
      for (var i = 0; i <= nMark; i++) {
        vals.push(-RANGE + (2 * RANGE) * i / nMark);
      }
      vals.forEach(function (v, i) {
        var x = x0 + (v + RANGE) / (2 * RANGE) * (x1 - x0);
        ctx.strokeStyle = C.blue;
        ctx.beginPath(); ctx.moveTo(x, y0 - 8); ctx.lineTo(x, y0 + 8); ctx.stroke();
      });
      /* 三个示例权重: 落点与误差 */
      var ws = [3.7, -1.6, 2.85];
      var wcols = [C.orange, C.pink, C.green];
      ws.forEach(function (w, i) {
        var qw = Math.round(w / scale) * scale;
        var xw = x0 + (w + RANGE) / (2 * RANGE) * (x1 - x0);
        var xq = x0 + (qw + RANGE) / (2 * RANGE) * (x1 - x0);
        var err = Math.abs(w - qw);
        /* 原值 */
        ctx.fillStyle = wcols[i];
        ctx.beginPath(); ctx.arc(xw, y0 - 22, 4, 0, 7); ctx.fill();
        /* 量化值 */
        ctx.strokeStyle = wcols[i];
        ctx.beginPath(); ctx.moveTo(xq, y0 - 8); ctx.lineTo(xq, y0 + 8); ctx.stroke();
        /* 误差带 */
        if (err > 0.01) {
          ctx.strokeStyle = C.red;
          ctx.setLineDash([3, 2]);
          ctx.beginPath(); ctx.moveTo(xw, y0 - 34); ctx.lineTo(xq, y0 - 34); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = C.red; ctx.font = FONT;
          ctx.fillText('Δ' + err.toFixed(2), (xw + xq) / 2 - 14, y0 - 40);
        }
        ctx.fillStyle = wcols[i]; ctx.font = FONT;
        ctx.fillText(w.toFixed(2) + '→' + qw.toFixed(2), xw - 22, y0 + 28 + (i % 3) * 16);
      });
      /* 信息行 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      var per = Math.pow(2, bits);
      ctx.fillText(bits + 'bit: ' + per + ' 个格点 · scale=' + scale.toFixed(3) + ' · 最大误差 ±' + (scale / 2).toFixed(3), 16, 20);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('每个权重被「钉」到最近的格点 — 格点越少(位宽越低), 误差越大', 16, c.h - 8);
    }
    var slider = document.getElementById('bitSlider');
    var lbl = document.getElementById('bitLabel');
    if (slider) slider.addEventListener('input', function () {
      bits = parseInt(slider.value, 10);
      if (lbl) lbl.textContent = bits + ' bit';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 格式全家福 ============ */
  (function () {
    function draw() {
      var c = fit('familyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: 'FP16', b: 16, gb: '13B→26GB', q: '基准', col: C.blue },
        { n: 'INT8', b: 8, gb: '13B→13GB', q: '损失~0', col: C.green },
        { n: 'INT4', b: 4, gb: '13B→6.5GB', q: 'PPL +0.2', col: C.orange },
        { n: 'FP8', b: 8, gb: '13B→13GB', q: '训练友好', col: C.purple },
        { n: 'FP4', b: 4, gb: '13B→6.5GB', q: 'Blackwell', col: C.pink }
      ];
      rows.forEach(function (r, i) {
        var y = 18 + i * ((c.h - 40) / 5);
        var rh = (c.h - 48) / 5;
        ctx.fillStyle = r.col + '15';
        ctx.fillRect(14, y, c.w - 28, rh - 6);
        ctx.strokeStyle = r.col; ctx.strokeRect(14, y, c.w - 28, rh - 6);
        ctx.fillStyle = r.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(r.n, 26, y + rh / 2 - 3);
        /* 位宽小格子 */
        for (var b = 0; b < 16; b++) {
          ctx.fillStyle = b < r.b ? r.col : 'rgba(139,148,158,.12)';
          ctx.fillRect(90 + b * 11, y + rh / 2 - 16, 9, 10);
        }
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.b + ' bit', 270, y + rh / 2 - 3);
        ctx.fillText(r.gb, 340, y + rh / 2 - 3);
        ctx.fillStyle = C.dim;
        ctx.fillText(r.q, 480, y + rh / 2 - 3);
      });
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 校准思想 ============ */
  (function () {
    function draw() {
      var c = fit('calibCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: 无校准 outlier 挤压 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('朴素 min-max: 一个离群值毁掉全部精度', 16, 20);
      var x0 = 30, x1 = c.w / 2 - 30, yb = 92;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
      /* 大多数权重挤在中间 */
      for (var i = 0; i < 24; i++) {
        var px = x0 + 30 + (i / 23) * (x1 - x0 - 90);
        ctx.fillStyle = C.blue;
        ctx.beginPath(); ctx.arc(px, yb - 8 - Math.random() * 4, 2, 0, 7); ctx.fill();
      }
      /* 离群值 */
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(x1 - 8, yb - 8, 4, 0, 7); ctx.fill();
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('outlier', x1 - 48, yb - 20);
      ctx.fillStyle = C.dim;
      ctx.fillText('scale 被拉大 → 中间权重共享格点', x0, yb + 24);
      /* 右: 校准后 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('GPTQ/AWQ 校准: 为离群值留特殊位', c.w / 2 + 16, 20);
      var x2 = c.w / 2 + 40, x3 = c.w - 30;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x2, yb); ctx.lineTo(x3, yb); ctx.stroke();
      for (var j = 0; j < 24; j++) {
        var pj = x2 + 10 + (j / 23) * (x3 - x2 - 100);
        ctx.fillStyle = C.green;
        ctx.beginPath(); ctx.arc(pj, yb - 8 - Math.random() * 4, 2, 0, 7); ctx.fill();
      }
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(x3 - 8, yb - 8, 4, 0, 7); ctx.fill();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('FP16 保留离群通道 · 其余 INT4', x2, yb + 24);
      /* 结论 */
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('用 512~2048 条真实样本跑一遍 → 找到「哪些权重重要」→ 聪明地分配格点', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 显存计算器 (核心交互) ============ */
  (function () {
    var MODELS = [
      { n: '7B', p: 7 }, { n: '13B', p: 13 }, { n: '70B', p: 70 }, { n: '405B', p: 405 }, { n: '671B MoE', p: 671 }
    ];
    var FMTS = [
      { n: 'FP16', b: 2 }, { n: 'INT8/FP8', b: 1 }, { n: 'INT4/FP4', b: 0.5 }
    ];
    var CARDS = [
      { n: 'RTX 3060', gb: 12 }, { n: 'RTX 4090', gb: 24 }, { n: 'A100-40G', gb: 40 },
      { n: 'A100-80G', gb: 80 }, { n: 'Mac 64G', gb: 64 }, { n: 'H200-141G', gb: 141 }
    ];
    var mi = 1, fi = 2;
    function calc() {
      var m = MODELS[mi], f = FMTS[fi];
      var wgb = m.p * f.b;
      return { m: m, f: f, wgb: wgb };
    }
    function draw() {
      var c = fit('calcCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var r = calc();
      /* 权重条 */
      var maxBar = Math.max(80, r.wgb * 1.2);
      var bw = (c.w - 200) * Math.min(1, r.wgb / maxBar);
      ctx.fillStyle = C.blue + '55';
      ctx.fillRect(120, 30, bw, 30);
      ctx.strokeStyle = C.blue; ctx.strokeRect(120, 30, bw, 30);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText(r.m.n + ' ' + r.f.n, 16, 50);
      ctx.fillText(r.wgb.toFixed(1) + ' GB', 128 + bw + 8, 50);
      /* 卡适配 */
      var y = 84;
      CARDS.forEach(function (card) {
        var usable = card.gb * 0.9;
        var ok = r.wgb <= usable;
        ctx.fillStyle = ok ? 'rgba(126,231,135,.2)' : 'rgba(248,81,73,.12)';
        ctx.fillRect(16, y, c.w - 32, 24);
        ctx.strokeStyle = ok ? C.green : C.red;
        ctx.strokeRect(16, y, c.w - 32, 24);
        ctx.fillStyle = ok ? C.text : C.dim; ctx.font = FONT;
        ctx.fillText((ok ? '✓ ' : '✗ ') + card.n + ' (' + card.gb + 'G)', 26, y + 17);
        ctx.fillStyle = ok ? C.green : C.dim;
        ctx.fillText(ok ? '剩 ' + (usable - r.wgb).toFixed(1) + 'G 给 KV/激活' : '差 ' + (r.wgb - usable).toFixed(1) + 'G', c.w - 190, y + 17);
        y += 32;
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('留 10% 给 KV Cache / 激活 / 框架开销 · 切换上面的下拉框实时重算', 16, c.h - 8);
    }
    var mSel = document.getElementById('qModel');
    var fSel = document.getElementById('qFmt');
    if (mSel) mSel.addEventListener('change', function () { mi = mSel.selectedIndex; draw(); });
    if (fSel) fSel.addEventListener('change', function () { fi = fSel.selectedIndex; draw(); });
    draw(); redraws.push(draw);
  })();

})();
