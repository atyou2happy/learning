/* gradients.js P1 — 图1 分诊 + 图2 连乘账 */
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

  /* ============ 图1 · 两种死法 ============ */
  (function () {
    function draw() {
      var c = fit('diagCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('同一个深网络 — 两种崩溃的 loss 曲线', 14, 20);
      var x0 = 60, x1 = c.w - 30, y1 = 40, y0 = c.h - 50;
      var px = function (t) { return x0 + t * (x1 - x0); };
      var py = function (v) { return y0 - v * (y0 - y1); };   /* v in [0,1], loss norm */
      /* healthy */
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var t = i / 60;
        var v = 0.9 * Math.pow(t + 0.05, -0.35);
        if (i === 0) ctx.moveTo(px(t), py(v)); else ctx.lineTo(px(t), py(v));
      }
      ctx.stroke();
      /* exploding: fine then NaN spike at 60% */
      ctx.strokeStyle = C.red;
      ctx.beginPath();
      for (i = 0; i <= 36; i++) {
        t = i / 60;
        v = 0.9 * Math.pow(t + 0.05, -0.35);
        if (i === 0) ctx.moveTo(px(t), py(v)); else ctx.lineTo(px(t), py(v));
      }
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px(0.6), py(0.55)); ctx.lineTo(px(0.63), py(0.05)); ctx.stroke();
      ctx.fillStyle = C.red; ctx.font = 'bold 11px monospace';
      ctx.fillText('NaN', px(0.63) + 4, py(0.05) + 12);
      /* vanishing: drops then freezes high */
      ctx.strokeStyle = C.orange;
      ctx.beginPath();
      for (i = 0; i <= 60; i++) {
        t = i / 60;
        v = 0.9 - 0.28 * Math.min(t / 0.15, 1);
        if (i === 0) ctx.moveTo(px(t), py(v)); else ctx.lineTo(px(t), py(v));
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* labels */
      ctx.fillStyle = C.green; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('健康', x1 - 80, py(0.42) - 6);
      ctx.fillStyle = C.red;
      ctx.fillText('爆炸 — 心脏病发', px(0.2), py(0.75));
      ctx.fillStyle = C.orange;
      ctx.fillText('消失 — 慢性贫血', x1 - 130, py(0.63) + 4);
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('训练步 →', x1 - 70, y0 + 16);
      ctx.fillText('loss', x0 - 26, y1 + 4);
      ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('爆炸: 好查 (NaN 报错) · 消失: 难查 (loss 看似正常地卡住)', 14, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 连乘账 ============ */
  (function () {
    function draw() {
      var c = fit('chainCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('g^30 连乘账 + 梯度生存表 (node 实算)', 14, 20);
      /* top: g^30 bars */
      var bars = [
        { n: '0.5³⁰', v: '9.3e-10', dir: -1, col: C.blue },
        { n: '0.9³⁰', v: '0.042', dir: -1, col: C.blue },
        { n: '1.0³⁰', v: '1.0', dir: 0, col: C.green },
        { n: '1.5³⁰', v: '1.9e5', dir: 1, col: C.red }
      ];
      bars.forEach(function (b, i) {
        var x = 30 + i * ((c.w - 60) / 4);
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(b.n, x, 46);
        ctx.strokeStyle = b.col; ctx.fillStyle = b.col + '22';
        var bh = b.dir < 0 ? 14 : (b.dir > 0 ? 40 : 26);
        ctx.fillRect(x, 78 - bh, 90, bh); ctx.strokeRect(x, 78 - bh, 90, bh);
        ctx.fillStyle = b.col; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(b.v, x, 96);
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(b.dir < 0 ? '消失' : (b.dir > 0 ? '爆炸' : '守恒'), x + 34, 96);
      });
      /* bottom: survival table */
      ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('末层梯度 (=1) 流到各层的存活率', 30, 126);
      var cols = ['g', 'L25', 'L20', 'L10', 'L1'];
      var table = [
        ['0.5', '3e-8', '1e-6', '1e-3', '9e-10*'],
        ['0.75', '8e-4', '3e-3', '0.06', '2e-4'],
        ['1.0', '1.00', '1.00', '1.00', '1.00'],
        ['1.25', '265', '87', '9.3', '646'],
        ['1.5', '2.5e4', '3.3e3', '58', '1.3e5']
      ];
      var cw = Math.min(110, (c.w - 60) / 5);
      cols.forEach(function (h2, j) {
        ctx.fillStyle = C.dim; ctx.font = 'bold 11px monospace';
        ctx.fillText(h2, 40 + j * cw, 148);
      });
      table.forEach(function (row, i) {
        var y = 166 + i * 18;
        row.forEach(function (cell, j) {
          var v = parseFloat(cell);
          ctx.fillStyle = (i === 2) ? C.green : (v >= 0.1 && v <= 10 ? C.text : C.red);
          ctx.font = (j === 0 ? 'bold ' : '') + '11px monospace';
          ctx.fillText(cell.replace('*', ''), 40 + j * cw, y);
        });
      });
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('(* g=0.5 行: L1 相对 L30 全程即 9.3e-10; 红字 = 出健康带 [0.1, 10])', 30, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
/* gradients.js P2 — 图3 生存模拟器 + 图4 四药 */
  /* ============ 图3 · 梯度生存模拟器 ============ */
  (function () {
    var g = 0.75;
    var slider = document.getElementById('gSlider');
    var label = document.getElementById('gVal');
    if (slider) slider.addEventListener('input', function () {
      g = parseInt(slider.value, 10) / 100;
      if (label) label.textContent = g.toFixed(2);
      draw();
    });
    function draw() {
      var c = fit('simCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('g = ' + g.toFixed(2) + ' — 末层梯度流回第 1 层的存活 (log 轴)', 14, 20);
      var x0 = 60, x1 = c.w - 40, y1 = 40, y0 = c.h - 56;
      var L = 30;
      var px = function (l) { return x0 + (l - 1) / (L - 1) * (x1 - x0); };   /* l = layer 1..30 */
      var py = function (ex) { return y0 - (ex + 10) / 20 * (y0 - y1); };      /* ex = log10(g^k), range [-10,+10] */
      /* health band */
      ctx.fillStyle = C.green + '18';
      ctx.fillRect(x0, py(1), x1 - x0, py(-1) - py(1));
      ctx.strokeStyle = C.green + '55';
      [1, -1].forEach(function (b) {
        ctx.beginPath(); ctx.moveTo(x0, py(b)); ctx.lineTo(x1, py(b)); ctx.stroke();
      });
      /* log labels */
      for (var e = 10; e >= -10; e -= 5) {
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        var lb = e > 0 ? '1e' + e : (e === 0 ? '1' : '1e' + e);
        ctx.fillText(lb, x0 - 34, py(e) + 3);
        ctx.strokeStyle = C.dark;
        ctx.beginPath(); ctx.moveTo(x0, py(e)); ctx.lineTo(x1, py(e)); ctx.stroke();
      }
      /* NaN zone */
      ctx.fillStyle = C.red + '22';
      ctx.fillRect(x0, y1, x1 - x0, py(10) - y1);
      ctx.fillStyle = C.red; ctx.font = 'bold 10px monospace';
      ctx.fillText('fp32 溢出区', x0 + 8, y1 + 12);
      /* underflow zone */
      ctx.fillStyle = C.blue + '22';
      ctx.fillRect(x0, py(-10), x1 - x0, y0 - py(-10));
      ctx.fillStyle = C.blue; ctx.font = 'bold 10px monospace';
      ctx.fillText('下溢/冻死区', x0 + 8, y0 - 8);
      /* curve: gradient at layer l = g^(30-l) */
      ctx.strokeStyle = g > 1.08 ? C.red : (g < 0.92 ? C.blue : C.green);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var l = L; l >= 1; l--) {
        var ex = (L - l) * Math.log10(g);
        ex = Math.max(-10, Math.min(10, ex));
        if (l === L) ctx.moveTo(px(l), py(ex)); else ctx.lineTo(px(l), py(ex));
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* endpoints */
      var ex1 = Math.max(-10, Math.min(10, 29 * Math.log10(g)));
      ctx.fillStyle = C.text;
      ctx.beginPath(); ctx.arc(px(1), py(ex1), 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
      var real = Math.pow(g, 29);
      ctx.fillText('第1层收到: ' + (real >= 1e6 || real < 1e-4 ? real.toExponential(1) : real.toFixed(3)) + '×', px(1) + 8, py(ex1) - 8);
      /* verdict */
      var band = Math.pow(10, 1 / 30);
      var verdict = g > 1.08 ? '✗ 爆炸 — 浅层收到天文数字梯度' :
        (g < 0.92 ? '✗ 消失 — 浅层冻死' : '✓ 健康带内 (需 g ∈ [' + (1 / band).toFixed(2) + ', ' + band.toFixed(2) + '])');
      ctx.fillStyle = g > 1.08 ? C.red : (g < 0.92 ? C.blue : C.green);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(verdict, x1 - 320, y1 + 14);
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('层数 L=30 (1=最浅 30=末层) · 健康带 = ±10× = g∈[0.92, 1.08]', x0, c.h - 14);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 四药对照 ============ */
  (function () {
    function draw() {
      var c = fit('cureCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('四种药 — 药效与时效', 14, 20);
      var drugs = [
        { n: '① He/正交初始化', d: '出生时 g=1: Var=2/fan_in / WᵀW=I', scope: '出厂设置 — 训练中会漂移', col: C.blue },
        { n: '② ReLU', d: 'f\'∈{0,1} 正区不饱和', scope: '替掉 sigmoid 0.25 上界 (副作用: 死神经元)', col: C.green },
        { n: '③ BatchNorm/Pre-LN', d: '每层重新整流分布', scope: '治「训练中走坏」— 拉回健康带', col: C.orange },
        { n: '④ 残差 +I', d: '∂ = I + f\' 特征值 ≥ 1', scope: '结构性地板 — f\' 任意坏都有直通保底', col: C.pink }
      ];
      drugs.forEach(function (d, i) {
        var x = 14 + (i % 2) * ((c.w - 28) / 2);
        var y = 38 + Math.floor(i / 2) * 92;
        var w = (c.w - 28) / 2 - 8;
        ctx.strokeStyle = d.col; ctx.fillStyle = d.col + '10';
        ctx.fillRect(x, y, w, 84); ctx.strokeRect(x, y, w, 84);
        ctx.fillStyle = d.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(d.n, x + 12, y + 20);
        ctx.fillStyle = C.text; ctx.font = '11.5px monospace';
        ctx.fillText(d.d, x + 12, y + 42);
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(d.scope, x + 12, y + 64);
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('现代默认 = 四药叠用: He 出生 + ReLU 不饱和 + Pre-LN 整流 + 残差地板 — 152 层可训', 14, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();
/* gradients.js P3 — 图5 时间线 + 关闭 IIFE */
  /* ============ 图5 · 病与药的时间线 ============ */
  (function () {
    function draw() {
      var c = fit('histCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('1991 → 2018 — 每代架构都是一味药', 14, 20);
      var items = [
        { y: 1991, n: 'Hochreiter 分析', d: 'vanishing/exploding 首次系统分析', col: C.red },
        { y: 1997, n: 'LSTM', d: 'cell state 传送带 — 线性通路', col: C.purple },
        { y: 2011, n: 'ReLU', d: '杀死 0.25 导数上界', col: C.green },
        { y: 2015, n: 'BatchNorm', d: '训练中稳住分布', col: C.orange },
        { y: 2015.5, n: 'ResNet', d: '+I 恒等通路 — 152 层可训', col: C.pink },
        { y: 2018, n: 'Pre-LN', d: 'Transformer 稳定训练默认', col: C.blue }
      ];
      /* axis 1991-2018 */
      var x0 = 90, x1 = c.w - 40, ay = c.h / 2 + 10;
      var px = function (yr) { return x0 + (yr - 1991) / 27 * (x1 - x0); };
      ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, ay); ctx.lineTo(x1, ay); ctx.stroke();
      ctx.lineWidth = 1;
      items.forEach(function (it, i) {
        var up = i % 2 === 0;
        var x = px(it.y);
        ctx.fillStyle = it.col;
        ctx.beginPath(); ctx.arc(x, ay, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = it.col;
        ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x, up ? ay - 34 : ay + 34); ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(it.y + ' ' + it.n, x - 30, up ? ay - 44 : ay + 48);
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        ctx.fillText(it.d, x - 40, up ? ay - 58 : ay + 62);
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('LSTM 传送带 (1997) = ResNet +I (2015): 相隔 18 年的同一味药 — 恒等直通路', 14, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();
})();
