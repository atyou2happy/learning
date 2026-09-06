/* flash-attention.js — 全部交互演示（node --check 可直接校验） */
(function () {
  'use strict';
  var C = {
    blue: '#58a6ff', pink: '#f778ba', green: '#7ee787',
    orange: '#ffa657', purple: '#a371f7', red: '#f85149',
    dim: '#8b949e', dark: '#30363d', bg: '#0a0d12', text: '#c9d1d9'
  };
  var FONT = '13.5px sans-serif';
  var MONO = 'bold 13.5px monospace';
  var GB = 1073741824;

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

  function arrow(ctx, ax, ay, bx, by, col) {
    ctx.strokeStyle = col || C.dim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    var ang = Math.atan2(by - ay, bx - ax);
    ctx.fillStyle = col || C.dim;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 9 * Math.cos(ang - 0.4), by - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(bx - 9 * Math.cos(ang + 0.4), by - 9 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1;
  }

  var redraws = [];
  window.addEventListener('resize', function () {
    redraws.forEach(function (fn) { fn(); });
  });

  /* ============ 图1 · N^2 显存墙 ============ */
  (function () {
    var Ns = [1024, 2048, 4096, 8192, 16384, 32768];
    function stdGB(n) { var qkv = 2 * 40 * n * 128 * 2; var sp = 2 * 32 * n * n * 2; return (qkv + sp) / GB; }
    function faGB(n) { return 2 * 40 * n * 128 * 2 / GB; }
    function draw() {
      var c = fit('wallCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 64, y0 = 30, x1 = c.w - 16, y1 = c.h - 46;
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
      var maxGB = 1400;
      var gy80 = y1 - (80 / maxGB) * (y1 - y0);
      ctx.strokeStyle = C.red; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x0, gy80); ctx.lineTo(x1, gy80); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('A100-80GB 上限', x1 - 118, gy80 - 6);
      function px(n) { return x0 + (Math.log2(n) - 10) / 5 * (x1 - x0); }
      function py(n, f) { var g = f ? faGB(n) : stdGB(n); return y1 - g / maxGB * (y1 - y0); }
      ctx.strokeStyle = C.red; ctx.lineWidth = 2.5;
      ctx.beginPath();
      Ns.forEach(function (n, i) { var x = px(n), y = py(n, false); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      ctx.strokeStyle = C.green;
      ctx.beginPath();
      Ns.forEach(function (n, i) { var x = px(n), y = py(n, true); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      ctx.lineWidth = 1;
      Ns.forEach(function (n) {
        var x = px(n);
        ctx.strokeStyle = C.dark;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y1 + 5); ctx.stroke();
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText((n / 1024) + 'k', x - 10, y1 + 18);
      });
      ctx.fillStyle = C.red; ctx.font = MONO;
      ctx.fillText('128.6 GB', px(32768) - 46, py(32768, false) - 8);
      ctx.fillStyle = C.green;
      ctx.fillText('0.63 GB', px(32768) - 44, py(32768, true) + 18);
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('■ 标准实现（S+P 物化 N²）', x0 + 8, y0 + 10);
      ctx.fillStyle = C.green;
      ctx.fillText('■ FlashAttention（仅 QKV，线性）', x0 + 8, y0 + 26);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · GPU 存储层级 ============ */
  (function () {
    function draw() {
      var c = fit('hierCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { name: 'SRAM（片上）', size: '192 KB', bw: '19 TB/s', w: 1.0, col: C.green },
        { name: 'HBM（显存）', size: '80 GB', bw: '2.0 TB/s', w: 0.42, col: C.orange },
        { name: 'CPU 内存', size: '1.6 TB', bw: '0.2 TB/s', w: 0.12, col: C.blue }
      ];
      rows.forEach(function (r, i) {
        var y = 30 + i * 52;
        var bw = (c.w - 210) * r.w;
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(150, y, bw, 30);
        ctx.strokeStyle = r.col;
        ctx.strokeRect(150, y, bw, 30);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.name, 8, y + 20);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.size + '  |  ' + r.bw, 150 + bw + 8, y + 20);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('SRAM 比 HBM 快 ~10 倍、却小 ~400 倍 —— 注意力是访存受限（memory-bound），瓶颈不在算在读', 8, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 标准 vs Flash 流程对比 ============ */
  (function () {
    function draw() {
      var c = fit('flowCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var sx = 16, sy = 36, sw = (c.w - 40) / 4;
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('标准实现：每步读写 HBM，S 与 P 整体往返', sx, sy - 14);
      ['Q@Kᵀ', 'softmax', 'P@V', '写回'].forEach(function (s, i) {
        var x = sx + i * sw;
        ctx.fillStyle = 'rgba(248,81,73,.22)';
        ctx.fillRect(x, sy, sw - 10, 32);
        ctx.strokeStyle = C.red; ctx.strokeRect(x, sy, sw - 10, 32);
        ctx.fillStyle = C.text; ctx.font = MONO;
        ctx.fillText(s, x + 8, sy + 20);
        if (i < 3) {
          arrow(ctx, x + sw - 10, sy + 16, x + sw, sy + 16, C.red);
          ctx.fillStyle = C.red; ctx.font = FONT;
          ctx.fillText('N²', x + sw - 14, sy + 9);
        }
      });
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('8 次 HBM 往返 × N² 量级 —— 序列越长，显卡越在「搬运」而非「计算」', sx, sy + 50);
      var fy = 130;
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('FlashAttention：块装进 SRAM，全程不物化 S/P', sx, fy - 14);
      var fsw = (c.w - 40) / 5;
      ['载入块', 'Q@Kᵀ', '在线softmax', 'P@V', '下一块'].forEach(function (s, i) {
        var x = sx + i * fsw;
        ctx.fillStyle = 'rgba(126,231,135,.18)';
        ctx.fillRect(x, fy, fsw - 10, 32);
        ctx.strokeStyle = C.green; ctx.strokeRect(x, fy, fsw - 10, 32);
        ctx.fillStyle = C.text; ctx.font = MONO;
        ctx.fillText(s, x + 6, fy + 20);
        if (i < 4) arrow(ctx, x + fsw - 10, fy + 16, x + fsw, fy + 16, C.green);
      });
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('S/P 块用完即弃，永不落 HBM —— 显存从 N² 降为 N', sx, fy + 50);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · online softmax 递推 ============ */
  (function () {
    function draw() {
      var c = fit('onlineCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('m_new = max(m_old, m_块)      新旧最大值取大', 16, 30);
      ctx.fillText('ℓ_new = e^(m_old−m_new)·ℓ_old + Σe^(s_ij−m_new)', 16, 56);
      ctx.fillText('O_new = [e^(m_old−m_new)·O_old + e^(S_块−m_new)·V_块] / ℓ_new', 16, 82);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('三个统计量 (m, ℓ, O) 随块流动、增量更新 —— softmax 不再需要「看全所有分数」', 16, 108);
      ctx.fillText('数学上与全量 softmax 完全等价（精确，非近似）', 16, 126);
      /* 数值演示: [1,2,3] 逐块融合 */
      var vals = [1, 2, 3];
      var m = -Infinity, l = 0, o = 0;
      ctx.font = MONO;
      ctx.fillStyle = C.orange;
      ctx.fillText('逐块数值演示 x = [1, 2, 3]：', 16, 152);
      vals.forEach(function (v, i) {
        var mn = Math.max(m, v);
        l = (m === -Infinity ? 0 : Math.exp(m - mn) * l) + Math.exp(v - mn);
        o = (m === -Infinity ? 0 : Math.exp(m - mn) * o) + Math.exp(v - mn) * v;
        m = mn;
        ctx.fillStyle = C.green;
        ctx.fillText('块' + (i + 1) + '=' + v + '  →  m=' + m.toFixed(1) + '  ℓ=' + l.toFixed(3) + '  加权和=' + o.toFixed(3), 16, 172 + i * 20);
      });
      ctx.fillStyle = C.pink;
      ctx.fillText('终值: softmax 加权和期望 = ' + (o / l).toFixed(4), 16, 172 + 3 * 20);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('验证: [1·e¹+2·e²+3·e³]/[e¹+e²+e³] = ' + ((1 * Math.exp(1) + 2 * Math.exp(2) + 3 * Math.exp(3)) / (Math.exp(1) + Math.exp(2) + Math.exp(3))).toFixed(4) + ' ✓', 16, 172 + 4 * 20);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · tiling 动画（点击推进） ============ */
  (function () {
    var step = -1;
    var rows = 4, cols = 6, total = 24;
    function draw() {
      var c = fit('tilingCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 26, y0 = 26, cw = 44, ch = 34;
      for (var r = 0; r < rows; r++) {
        for (var q = 0; q < cols; q++) {
          var idx = r * cols + q;
          var done = idx < step;
          var cur = idx === step;
          var x = x0 + q * (cw + 6), y = y0 + r * (ch + 6);
          ctx.fillStyle = cur ? 'rgba(255,166,87,.55)' : done ? 'rgba(126,231,135,.3)' : 'rgba(139,148,158,.1)';
          ctx.fillRect(x, y, cw, ch);
          ctx.strokeStyle = cur ? C.orange : done ? C.green : C.dark;
          ctx.strokeRect(x, y, cw, ch);
        }
      }
      var curRow = Math.floor(Math.max(step, 0) / cols);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText(step < 0 ? '点击开始' : '块 #' + (step + 1) + ' / ' + total + '   行 ' + (curRow + 1), x0, y0 + rows * (ch + 6) + 22);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('绿 = 已融合（统计量已更新进 (m, ℓ, O)）  橙 = 当前块（只在 SRAM 存活）', x0, y0 + rows * (ch + 6) + 42);
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('每块流程: S_块 = Q_行块 @ K_列块ᵀ → 更新 (m, ℓ) → O_行块 += softmax 权重 @ V_列块', x0, y0 + rows * (ch + 6) + 60);
    }
    var cv = document.getElementById('tilingCanvas');
    if (cv) cv.addEventListener('click', function () { step = (step + 1) % (total + 1); draw(); });
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 加速比基准 ============ */
  (function () {
    function draw() {
      var c = fit('benchCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var data = [
        { name: 'PyTorch 标准注意力', v: 0.25, col: C.red },
        { name: 'Memory-efficient attn', v: 2.9, col: C.orange },
        { name: 'FlashAttention-2', v: 6.7, col: C.green },
        { name: 'FlashAttention-3 (H100)', v: 9.9, col: C.purple }
      ];
      var x0 = 190, x1 = c.w - 64;
      data.forEach(function (d, i) {
        var y = 24 + i * 36;
        var w = (x1 - x0) * d.v / 10;
        ctx.fillStyle = d.col + 'cc';
        ctx.fillRect(x0, y, w, 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(d.name, 8, y + 16);
        ctx.font = MONO; ctx.fillStyle = C.text;
        ctx.fillText(d.v.toFixed(1) + 'x', x1 + 6, y + 16);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('相对标准实现的运行时加速（GPT-2 训练 3x → FA2 ~6.7x → FA3 逼近硬件极限 740 TFLOPS）', 8, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
