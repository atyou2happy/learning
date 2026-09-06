/* speculative.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · decode 的串行困境 ============ */
  (function () {
    function draw() {
      var c = fit('slowCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('逐词生成: 每个词都要读一遍全部权重', 16, 22);
      /* 权重条 */
      ctx.fillStyle = 'rgba(88,166,255,.2)';
      ctx.fillRect(16, 40, c.w - 32, 28);
      ctx.strokeStyle = C.blue; ctx.strokeRect(16, 40, c.w - 32, 28);
      ctx.fillStyle = C.blue; ctx.font = '12px monospace';
      ctx.fillText('70B 权重 140GB — 每生成 1 个词都完整读一遍', 26, 58);
      /* 词序列 */
      var words = ['天', '气', '真', '好', ','];
      words.forEach(function (wd, i) {
        var x = 30 + i * 90;
        ctx.fillStyle = 'rgba(126,231,135,.15)';
        ctx.fillRect(x, 90, 60, 32);
        ctx.strokeStyle = C.green; ctx.strokeRect(x, 90, 60, 32);
        ctx.fillStyle = C.text; ctx.font = 'bold 15px monospace';
        ctx.fillText(wd, x + 24, 112);
        if (i < words.length - 1) {
          ctx.fillStyle = C.dim; ctx.font = '11px monospace';
          ctx.fillText('1×forward', x + 14, 82);
          ctx.fillStyle = C.red;
          ctx.fillText('→', x + 62, 112);
        }
      });
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('Roofline: decode AI≈1 — memory-bound, GPU 在等数据不是在算', 16, 146);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('5 个词 = 5 次完整权重读取; 但「检查 5 个词」只需要 1 次读取', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 猜-验证动画 (核心) ============ */
  (function () {
    var round = 0;
    var rounds = [
      { draft: ['明', '天', '的', '天'], verdict: [1, 1, 1, 0], next: '气' },
      { draft: ['是', '晴', '朗', '的'], verdict: [1, 1, 1, 1], next: '!' },
      { draft: 'warm'.split(''), verdict: [0], next: '适' }
    ];
    function draw() {
      var c = fit('duelCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var r = rounds[round];
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('第 ' + (round + 1) + '/3 轮 — 小模型猜, 大模型验', 16, 22);
      /* 小模型 */
      ctx.fillStyle = 'rgba(163,113,247,.15)';
      ctx.fillRect(16, 44, 170, 70);
      ctx.strokeStyle = C.purple; ctx.strokeRect(16, 44, 170, 70);
      ctx.fillStyle = C.purple; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('小模型 (draft)', 30, 64);
      ctx.fillStyle = C.text; ctx.font = 'bold 14px monospace';
      ctx.fillText('"' + r.draft.join('') + '"', 30, 92);
      /* 大模型 */
      ctx.fillStyle = 'rgba(88,166,255,.12)';
      ctx.fillRect(c.w - 210, 44, 194, 70);
      ctx.strokeStyle = C.blue; ctx.strokeRect(c.w - 210, 44, 194, 70);
      ctx.fillStyle = C.blue; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('大模型 (verify)', c.w - 196, 64);
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('1 次 forward 验全部', c.w - 196, 92);
      /* 箭头 */
      ctx.fillStyle = C.orange; ctx.font = 'bold 16px monospace';
      ctx.fillText('→', 196, 84);
      /* 验证结果词格 */
      r.draft.forEach(function (wd, i) {
        var x = 220 + i * 74;
        var ok = r.verdict[i] === 1;
        ctx.fillStyle = ok ? 'rgba(126,231,135,.2)' : 'rgba(248,81,73,.2)';
        ctx.fillRect(x, 130, 60, 34);
        ctx.strokeStyle = ok ? C.green : C.red; ctx.strokeRect(x, 130, 60, 34);
        ctx.fillStyle = C.text; ctx.font = 'bold 14px monospace';
        ctx.fillText(wd, x + 22, 152);
        ctx.fillStyle = ok ? C.green : C.red; ctx.font = '10.5px monospace';
        ctx.fillText(ok ? '✓' : '✗ 回滚', x + 8, 178);
      });
      /* 补充词 */
      ctx.fillStyle = C.orange; ctx.font = 'bold 13px monospace';
      ctx.fillText('+ 修正词 "' + r.next + '"', 220 + r.draft.length * 74, 152);
      var acc = r.verdict.filter(function (v) { return v === 1; }).length;
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('本轮产出 ' + (acc + 1) + ' 个词 (含修正)', 16, c.h - 10);
    }
    var btn = document.getElementById('specBtn');
    if (btn) btn.addEventListener('click', function () {
      round = (round + 1) % 3;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 接受率滑块 (核心交互) ============ */
  (function () {
    var alpha = 0.7;
    function E(a, g) { return (1 - Math.pow(a, g + 1)) / (1 - a); }
    function draw() {
      var c = fit('alphaCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var e = E(alpha, 4);
      var cost = 1.25; /* 1 大 + 5 小(各5%) */
      var speed = e / cost;
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('α = ' + alpha.toFixed(2) + ' — 每轮期望 ' + e.toFixed(2) + ' 词, 加速 ' + speed.toFixed(2) + 'x', 16, 22);
      /* 曲线: alpha 0.2..0.98 */
      var x0 = 60, y0 = 170, w2 = c.w - 100, h2 = 120;
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(x0, y0 - h2, w2, h2);
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var px = 0; px <= 100; px++) {
        var a = 0.2 + (px / 100) * 0.78;
        var y = y0 - E(a, 4) / 5 * h2;
        if (px === 0) ctx.moveTo(x0 + px / 100 * w2, y);
        else ctx.lineTo(x0 + px / 100 * w2, y);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* 当前点 */
      var cx = x0 + (alpha - 0.2) / 0.78 * w2;
      var cy = y0 - e / 5 * h2;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
      /* 参考线 */
      ctx.strokeStyle = 'rgba(139,148,158,.4)'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y0); ctx.stroke();
      ctx.setLineDash([]);
      /* 轴 */
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('α (draft 兼容性)  0.2 → 0.98', x0, y0 + 16);
      ctx.fillText('5', x0 - 16, y0 - h2 + 6);
      ctx.fillText('1', x0 - 16, y0 + 4);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('E = (1-α⁵)/(1-α) — α 是一切: 同家族小号配对才高', 16, c.h - 10);
    }
    var slider = document.getElementById('alphaSlider');
    var lbl = document.getElementById('alphaLabel');
    if (slider) slider.addEventListener('input', function () {
      alpha = parseFloat(slider.value);
      if (lbl) lbl.textContent = 'α = ' + alpha.toFixed(2);
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 变体家族 ============ */
  (function () {
    function draw() {
      var c = fit('familyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('三代变体 — 猜得越来越准', 16, 22);
      var fam = [
        { n: '经典 SD', y: '2023', d: '独立小模型逐词猜', s: '2-3x', col: C.blue },
        { n: 'Medusa', y: '2024', d: '多个头一次长出候选树', s: '2-3x', col: C.green },
        { n: 'EAGLE-2', y: '2024-25', d: '特征级预测 + 树验证', s: '3-5x', col: C.orange },
        { n: 'MTP (DS-V3)', y: '2025-26', d: '训练时就带预测头, 量产实装', s: '内建', col: C.pink }
      ];
      fam.forEach(function (f, i) {
        var y = 42 + i * 36;
        ctx.fillStyle = f.col + '12';
        ctx.fillRect(16, y, c.w - 32, 30);
        ctx.strokeStyle = f.col; ctx.strokeRect(16, y, c.w - 32, 30);
        ctx.fillStyle = f.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(f.n, 26, y + 20);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText(f.y, 170, y + 20);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(f.d, 230, y + 20);
        ctx.fillStyle = f.col; ctx.font = MONO;
        ctx.fillText(f.s, c.w - 90, y + 20);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('与量化/连续批处理正交 — 可叠加提速', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 失效场景 ============ */
  (function () {
    function draw() {
      var c = fit('failCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('什么时候免费午餐变馊 — α 的塌方现场', 16, 22);
      var rows = [
        { s: '代码补全', a: 'α 0.85+', v: '分布尖锐, 小模型猜得准', col: C.green },
        { s: '结构化文本 (JSON)', a: 'α 0.8+', v: '格式可预测', col: C.green },
        { s: '日常对话', a: 'α 0.6-0.7', v: '甜点区 — 加速 2x 上下', col: C.orange },
        { s: '高温创意写作', a: 'α <0.4', v: '分布平 — 猜不中, 验证白跑', col: C.red },
        { s: '数学/推理链', a: '波动大', v: '分歧点整段回滚', col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 42 + i * 30;
        ctx.fillStyle = r.col + '12';
        ctx.fillRect(16, y, c.w - 32, 25);
        ctx.strokeStyle = r.col; ctx.strokeRect(16, y, c.w - 32, 25);
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.s, 26, y + 17);
        ctx.fillStyle = r.col; ctx.font = '11.5px monospace';
        ctx.fillText(r.a, 210, y + 17);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.v, 310, y + 17);
      });
      ctx.fillStyle = C.pink; ctx.font = FONT;
      ctx.fillText('负加速是真实存在的: draft 太差 + 每轮只中 1 词时, 白付小模型成本', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
