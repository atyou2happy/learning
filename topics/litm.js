/* litm.js P1 — 图1 U 形 + 图2 稀释账 */
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

  /* frozen U-curve (Liu 2023, 20 positions) */
  var U = [79, 78, 76, 72, 66, 60, 54, 50, 47, 46, 46, 47, 50, 54, 60, 66, 72, 76, 77, 75];

  /* ============ 图1 · U 形曲线 ============ */
  (function () {
    function draw() {
      var c = fit('uCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('正确文档的位置 × 检索成功率 (GPT-3.5, 20 篇资料, Liu 2023)', 14, 20);
      var x0 = 50, x1 = c.w - 30, y1 = 34, y0 = c.h - 42;
      var px = function (i) { return x0 + i / 19 * (x1 - x0); };
      var py = function (v) { return y0 - (v - 40) / 45 * (y0 - y1); };
      /* gridlines */
      [50, 60, 70, 80].forEach(function (g) {
        ctx.strokeStyle = C.dark;
        ctx.beginPath(); ctx.moveTo(x0, py(g)); ctx.lineTo(x1, py(g)); ctx.stroke();
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(g + '%', x0 - 28, py(g) + 4);
      });
      /* closed-book line */
      ctx.strokeStyle = C.orange; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x0, py(56)); ctx.lineTo(x1, py(56)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.font = 'bold 10.5px monospace';
      ctx.fillText('closed-book 56% (不看资料)', x1 - 170, py(56) - 6);
      /* U curve */
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2.5;
      ctx.beginPath();
      U.forEach(function (v, i) { if (i === 0) ctx.moveTo(px(i), py(v)); else ctx.lineTo(px(i), py(v)); });
      ctx.stroke(); ctx.lineWidth = 1;
      U.forEach(function (v, i) {
        if (i % 2 === 0 || i === 9 || i === 10) {
          ctx.fillStyle = (i === 9 || i === 10) ? C.red : C.pink;
          ctx.beginPath(); ctx.arc(px(i), py(v), 3.4, 0, Math.PI * 2); ctx.fill();
        }
      });
      /* annotations */
      ctx.fillStyle = C.green; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('开头 79%', px(0) - 10, py(79) - 10);
      ctx.fillText('结尾 75%', px(19) - 50, py(75) - 10);
      ctx.fillStyle = C.red; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('中间 46% ← 低于瞎猜', px(10) - 66, py(46) + 20);
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('正确文档的位置 (1 → 20)', (x0 + x1) / 2 - 60, c.h - 16);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 稀释 + 衰减 ============ */
  (function () {
    function draw() {
      var c = fit('dilCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('两把刀 — 稀释 (左) + 距离衰减 (右)', 14, 20);
      /* left: dilution bars (log-ish x) */
      var rows = [
        { n: '10 tok', v: 69.06, col: C.green },
        { n: '100 tok', v: 16.87, col: C.blue },
        { n: '1k tok', v: 1.97, col: C.orange },
        { n: '100k tok', v: 0.02, col: C.red }
      ];
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('显著 token (score=3) 的注意力份额', 24, 44);
      rows.forEach(function (r, i) {
        var y = 58 + i * 32;
        ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
        ctx.fillText(r.n, 24, y + 12);
        var bx = 110, bw = c.w / 2 - 160;
        ctx.fillStyle = C.dark; ctx.fillRect(bx, y, bw, 16);
        ctx.fillStyle = r.col; ctx.fillRect(bx, y, Math.max(1.5, bw * r.v / 100), 16);
        ctx.fillStyle = r.col; ctx.font = 'bold 11px monospace';
        ctx.fillText(r.v + '%', bx + bw + 8, y + 12);
      });
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('N×100 → 份额 ÷35: 信噪比塌方', 24, 192);
      /* right: distance decay */
      var drows = [
        { d: 1, w: 0.761 }, { d: 100, w: 0.216 }, { d: 1000, w: 0.145 }, { d: 100000, w: 0.087 }
      ];
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('相对位置权重', c.w / 2 + 30, 44);
      drows.forEach(function (r, i) {
        var y = 58 + i * 32;
        ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
        ctx.fillText('距离 ' + r.d, c.w / 2 + 30, y + 12);
        var bx = c.w / 2 + 110, bw = c.w / 2 - 190;
        ctx.fillStyle = C.dark; ctx.fillRect(bx, y, bw, 16);
        ctx.fillStyle = C.purple; ctx.fillRect(bx, y, bw * r.w, 16);
        ctx.fillStyle = C.purple; ctx.font = 'bold 11px monospace';
        ctx.fillText(r.w.toFixed(2), bx + bw * r.w + 6, y + 12);
      });
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('RoPE 低频: 远处匹配天然偏弱', c.w / 2 + 30, 192);
      ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('开头=刀二最弱+ICL强 · 结尾=距离最近+最新 · 中间两头不靠 → U 形', 24, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();
/* litm.js P2 — 图3 needle 模拟器 + 图4 对策清单 */
  /* ============ 图3 · needle 位置模拟器 ============ */
  (function () {
    var cur = 9;
    var slider = document.getElementById('needleSlider');
    var label = document.getElementById('needlePos');
    if (slider) slider.addEventListener('input', function () {
      cur = parseInt(slider.value, 10);
      if (label) label.textContent = (cur + 1) + '/20';
      draw();
    });
    function draw() {
      var c = fit('needleCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('两个年代 — 2023 GPT-3.5 (U 形) vs 2026 旗舰 (平坦)', 14, 20);
      var x0 = 50, x1 = c.w - 30, y1 = 36, y0 = c.h - 70;
      var px = function (i) { return x0 + i / 19 * (x1 - x0); };
      var py = function (v) { return y0 - (v - 40) / 60 * (y0 - y1); };
      /* gridlines */
      [50, 60, 70, 80, 90, 100].forEach(function (g) {
        ctx.strokeStyle = C.dark;
        ctx.beginPath(); ctx.moveTo(x0, py(g)); ctx.lineTo(x1, py(g)); ctx.stroke();
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        ctx.fillText(g + '%', x0 - 26, py(g) + 3);
      });
      /* 2026 flat */
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.beginPath();
      U.forEach(function (v, i) {
        var f = 99;
        if (i === 0) ctx.moveTo(px(i), py(f)); else ctx.lineTo(px(i), py(f));
      });
      ctx.stroke();
      /* 2023 U */
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2.5;
      ctx.beginPath();
      U.forEach(function (v, i) { if (i === 0) ctx.moveTo(px(i), py(v)); else ctx.lineTo(px(i), py(v)); });
      ctx.stroke(); ctx.lineWidth = 1;
      /* current needle marker */
      ctx.strokeStyle = C.text;
      ctx.beginPath(); ctx.moveTo(px(cur), y1 - 6); ctx.lineTo(px(cur), y0 + 8); ctx.stroke();
      /* haystack visual: 20 slots strip */
      U.forEach(function (v, i) {
        var sw = (x1 - x0) / 19 - 3;
        ctx.fillStyle = i === cur ? C.red : C.dark;
        ctx.fillRect(px(i) - sw / 2, y0 + 16, sw, 10);
      });
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('草堆 20 格 (红 = 针的位置)', x0, y0 + 38);
      /* readout */
      ctx.fillStyle = C.pink; ctx.font = 'bold 12px monospace';
      ctx.fillText('2023 @位置' + (cur + 1) + ': ' + U[cur] + '%', x1 - 240, 54);
      ctx.fillStyle = C.green;
      ctx.fillText('2026 @位置' + (cur + 1) + ': 99%', x1 - 240, 72);
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('但 NIAH 只测单针存在检索 — 多针交叉推理仍 softer 衰减', x1 - 300, y0 + 38);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 对策清单 ============ */
  (function () {
    function draw() {
      var c = fit('fixCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('位置红利的用法 — 顺序是免费的性能', 14, 20);
      /* context layout bar: head/tail advantage zones */
      var bx = 60, bw = c.w - 120, by = 44, bh = 30;
      ctx.fillStyle = C.green + '55'; ctx.fillRect(bx, by, bw * 0.2, bh);
      ctx.fillStyle = C.dark; ctx.fillRect(bx + bw * 0.2, by, bw * 0.6, bh);
      ctx.fillStyle = C.green + '55'; ctx.fillRect(bx + bw * 0.8, by, bw * 0.2, bh);
      ctx.strokeStyle = C.text; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
      ctx.fillText('开头优势区', bx + 6, by + 19);
      ctx.fillText('结尾优势区', bx + bw - 70, by + 19);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('中间塌陷带', bx + bw / 2 - 28, by + 19);
      /* rules */
      var rules = [
        { n: '① 关键指令', d: '开头放 + 结尾重申 — 首因近因两头占', col: C.red },
        { n: '② RAG 重排序', d: 'top-1 放最前、top-2 放最后 — 命中避开塌陷带', col: C.blue },
        { n: '③ ICL 示例', d: '天然靠前 + 最后一例贴近问题 — 免费吃红利', col: C.green },
        { n: '④ 超长资料', d: '分段 + 显式索引 — 别赌模型自己捞针', col: C.purple }
      ];
      rules.forEach(function (r, i) {
        var y = 100 + i * 30;
        ctx.fillStyle = r.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.n, 60, y);
        ctx.fillStyle = C.text; ctx.font = '11.5px monospace';
        ctx.fillText(r.d, 175, y);
      });
      ctx.fillStyle = C.orange; ctx.font = 'bold 12px monospace';
      ctx.fillText('不改一个参数, 检索率差一倍 — 检索率 46%↔79% 的差别只在排版', 60, c.h - 16);
    }
    draw(); redraws.push(draw);
  })();
/* litm.js P3 — 图5 长度≠有效长度 + 关闭 IIFE */
  /* ============ 图5 · 两个指标 ============ */
  (function () {
    function draw() {
      var c = fit('readCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('上下文长度 ≠ 有效长度 — 读表三问', 14, 20);
      var rows = [
        { n: '容量上限', d: '位置编码决定 (RoPE 外推)', v: '1M', col: C.blue },
        { n: '利用率上限', d: '注意力分布决定 (U 形衰减)', v: '任务相关', col: C.pink },
        { n: 'NIAH 99%', d: '单针存在检索 — 平坦', v: '不等于推理', col: C.green },
        { n: '多针聚合', d: '交叉推理 — softer U 形仍在', v: '随长度衰减', col: C.orange }
      ];
      rows.forEach(function (r, i) {
        var y = 44 + i * 40;
        ctx.strokeStyle = r.col; ctx.fillStyle = r.col + '14';
        ctx.fillRect(24, y, c.w - 48, 32); ctx.strokeRect(24, y, c.w - 48, 32);
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.n, 38, y + 20);
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(r.d, 190, y + 20);
        ctx.fillStyle = r.col; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(r.v, c.w - 200, y + 20);
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('上下文工程的一半是内容, 另一半是位置 — 本页是后者的全部', 24, c.h - 26);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('(1M 档价格 ≈ 128k 档 4-8×: 付费长度需配排序纪律才物有所值)', 24, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
})();
