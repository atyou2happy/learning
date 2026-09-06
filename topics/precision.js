/* precision.js P1 — 图1 比特结构 + 图2 精度放大镜 */
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

  /* ============ 图1 · 比特结构 + 单位对账 ============ */
  (function () {
    var rows = [
      { n: 'fp32', bits: [1, 8, 23], bytes: '4 B / 参数', note: '科学计算 · 主权重' },
      { n: 'bf16', bits: [1, 8, 7], bytes: '2 B', note: '训练标准 · 保范围' },
      { n: 'fp16', bits: [1, 5, 10], bytes: '2 B', note: '推理档 · 保精度' },
      { n: 'fp8-E4M3', bits: [1, 4, 3], bytes: '1 B', note: '前向/权重 · H100 原生' },
      { n: 'int8', bits: null, bytes: '1 B', note: '均匀格子 · scale 映射' }
    ];
    function draw() {
      var c = fit('bitsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var bw = Math.min(16, (c.w - 260) / 32);   /* bit width */
      rows.forEach(function (r, i) {
        var y = 26 + i * 34;
        ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(r.n, 12, y + 12);
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(r.bytes, 12, y + 26);
        var x = 118;
        if (r.bits) {
          var cols = [C.red, C.blue, C.green];       /* sign / exp / mantissa */
          var labels = ['S', 'E', 'M'];
          r.bits.forEach(function (n, k) {
            for (var b = 0; b < n; b++) {
              ctx.fillStyle = cols[k] + '55'; ctx.fillRect(x, y, bw - 2, 20);
              ctx.strokeStyle = cols[k]; ctx.strokeRect(x, y, bw - 2, 20);
              x += bw;
            }
            ctx.fillStyle = cols[k]; ctx.font = 'bold 10.5px monospace';
            ctx.fillText(labels[k] + n, x + 4, y + 14);
            x += 30;
          });
        } else {
          ctx.fillStyle = C.orange + '55'; ctx.fillRect(x, y, bw * 8, 20);
          ctx.strokeStyle = C.orange; ctx.strokeRect(x, y, bw * 8, 20);
          ctx.fillStyle = C.orange; ctx.font = 'bold 10.5px monospace';
          ctx.fillText('8bit 均匀刻度', x + bw * 8 + 6, y + 14);
        }
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText(r.note, x + 4, y + 14);
      });
      ctx.fillStyle = C.text; ctx.font = '11.5px monospace';
      ctx.fillText('红=符号 蓝=指数(范围) 绿=尾数(精度) — bf16 指数照抄 fp32 只砍尾数', 12, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 精度放大镜 ============ */
  (function () {
    var FMTS = [
      { n: 'fp32', step: 1.1920928955078125e-7, col: C.blue, note: '步长 1.2e-7 — 格子密到看不见缝' },
      { n: 'fp16', step: 0.0009765625, col: C.green, note: '步长 9.8e-4 — 万分之一' },
      { n: 'bf16', step: 0.0078125, col: C.pink, note: '步长 0.0078 — 1.0 的下一个点是 1.0078125' },
      { n: 'fp8-E4M3', step: 0.125, col: C.orange, note: '步长 0.125 — 1.0 之后是 1.125' },
      { n: 'int8 (scale≈4/255)', step: 0.0157, col: C.purple, note: '均匀步长 0.0157 — 不随位置变化' }
    ];
    var cur = 2;
    var btns = document.querySelectorAll('.fmtBtn');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        cur = parseInt(b.getAttribute('data-f'), 10);
        draw();
      });
    });
    function draw() {
      var c = fit('gridCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var f = FMTS[cur];
      /* zoom window [0.88, 1.12] */
      var x0 = 0.88, x1 = 1.12;
      var px = function (v) { return 30 + (v - x0) / (x1 - x0) * (c.w - 60); };
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('精度放大镜 · 1.0 附近的可表示点 — ' + f.n, 14, 22);
      /* axis */
      ctx.strokeStyle = C.dark; ctx.beginPath();
      ctx.moveTo(30, 120); ctx.lineTo(c.w - 30, 120); ctx.stroke();
      /* representable ticks: multiples of step */
      var k0 = Math.ceil(x0 / f.step), k1 = Math.floor(x1 / f.step);
      var showLabel = (k1 - k0) <= 24;
      for (var k = k0; k <= k1; k++) {
        var v = k * f.step;
        var x = px(v);
        var big = Math.abs(v - 1) < f.step / 2;
        ctx.strokeStyle = big ? f.col : f.col + 'aa';
        ctx.beginPath(); ctx.moveTo(x, 120 - (big ? 46 : 30)); ctx.lineTo(x, 120 + 26); ctx.stroke();
        if (showLabel && (k - k0) % Math.max(1, Math.ceil((k1 - k0) / 10)) === 0) {
          ctx.fillStyle = C.dim; ctx.font = '10.5px monospace'; ctx.textAlign = 'center';
          ctx.fillText(v.toFixed(5), x, 148);
          ctx.textAlign = 'left';
        }
      }
      /* highlight 1.0 */
      var one = px(1);
      ctx.fillStyle = f.col; ctx.font = 'bold 12px monospace';
      ctx.fillText('1.0', one - 8, 78);
      /* explanation */
      ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
      ctx.fillText(f.note, 30, 186);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('浮点: 越靠 0 格子越密(对数式) — int8: 均匀间隔。窗口 [0.88, 1.12]', 30, 206);
      ctx.fillStyle = C.pink; ctx.font = '11.5px monospace';
      ctx.fillText('0.1 → bf16 存成 0.10009765625 (node 实算)', 30, 224);
    }
    draw(); redraws.push(draw);
  })();
/* precision.js P2 — 图3 梯度生死簿 + 图4 int8 vs FP8 */
  /* ============ 图3 · 梯度生死簿 ============ */
  (function () {
    var mode = 0;   /* 0=fp16 1=bf16 */
    var sw = document.getElementById('fmtSw');
    if (sw) sw.addEventListener('click', function () {
      mode = 1 - mode;
      if (sw) sw.textContent = mode ? '切换 fp16 / bf16 → [bf16]' : '切换 fp16 / bf16 → [fp16]';
      draw();
    });
    function draw() {
      var c = fit('trainCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var fmt = mode ? { n: 'bf16', min: 1.18e-38, max: 3.39e38, col: C.pink }
                     : { n: 'fp16', min: 6.1e-5, max: 65504, col: C.green };
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('梯度生死簿 — ' + fmt.n + ' 的可表示范围 (log 刻度)', 14, 22);
      /* range bar */
      var bx = 60, bw = c.w - 120, by = 60;
      ctx.fillStyle = fmt.col + '30'; ctx.fillRect(bx, by, bw, 26);
      ctx.strokeStyle = fmt.col; ctx.strokeRect(bx, by, bw, 26);
      ctx.fillStyle = C.dim; ctx.font = 'bold 11px monospace';
      ctx.fillText('-max', 4, by + 17);
      ctx.fillText('+max', c.w - 42, by + 17);
      ctx.fillStyle = fmt.col;
      ctx.fillText('-min', 4, by + 40);
      ctx.fillText('+min', c.w - 42, by + 40);
      /* dead zones for fp16 */
      if (!mode) {
        var dz = bw * 0.18;
        ctx.fillStyle = C.red + '55';
        ctx.fillRect(bx, by, dz, 26);
        ctx.fillRect(bx + bw - dz, by, dz, 26);
        ctx.strokeStyle = C.red;
        ctx.strokeRect(bx, by, dz, 26);
        ctx.strokeRect(bx + bw - dz, by, dz, 26);
        ctx.fillStyle = C.red; ctx.font = 'bold 11px monospace';
        ctx.fillText('下溢→0 死区', bx + 6, by + 17);
        ctx.fillText('死区→inf', bx + bw - dz + 8, by + 17);
      } else {
        ctx.fillStyle = C.green; ctx.font = 'bold 11px monospace';
        ctx.fillText('范围=fp32 (±3.4e38) — 没有死区', bx + 8, by + 17);
      }
      /* candidates */
      var grads = [
        { v: 1e-8, n: '小梯度 1e-8 (深层/稀有 token)' },
        { v: 1e-3, n: '常规梯度 1e-3' },
        { v: 2e4, n: '大激活 2e4 (异常层)' }
      ];
      grads.forEach(function (g, i) {
        var y = 130 + i * 38;
        var alive = Math.abs(g.v) >= fmt.min && Math.abs(g.v) <= fmt.max;
        ctx.strokeStyle = alive ? C.green : C.red;
        ctx.fillStyle = alive ? C.green + '18' : C.red + '18';
        ctx.fillRect(60, y, c.w - 120, 28); ctx.strokeRect(60, y, c.w - 120, 28);
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(g.n, 72, y + 18);
        ctx.fillStyle = alive ? C.green : C.red; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'right';
        ctx.fillText(alive ? '✓ 活着 (可表示)' : (Math.abs(g.v) < fmt.min ? '✗ 下溢 → 0，永久丢失' : '✗ 上溢 → inf → NaN 炸训练'), c.w - 72, y + 18);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText(mode ? 'bf16: 粗糙但死不了 — 1e-8 距离下限还有 30 个数量级' : 'fp16: 两个死区夹击 — loss scaling (×1024) 只能救下溢那头', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · int8 vs FP8 格子形状 ============ */
  (function () {
    function draw() {
      var c = fit('inferCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('同样 1 字节的两种存法 — 格子在数轴上的分布', 14, 20);
      /* two number lines [0, 4] */
      var px = function (v) { return 70 + v / 4 * (c.w - 120); };
      /* int8 uniform */
      ctx.fillStyle = C.purple; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('int8 (scale=4/127): 均匀', 70, 46);
      ctx.strokeStyle = C.dark; ctx.beginPath();
      ctx.moveTo(70, 62); ctx.lineTo(c.w - 50, 62); ctx.stroke();
      for (var i = 0; i <= 20; i++) {
        var v = i / 5;
        ctx.strokeStyle = C.purple;
        ctx.beginPath(); ctx.moveTo(px(v), 54); ctx.lineTo(px(v), 70); ctx.stroke();
      }
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('0', px(0) - 3, 86); ctx.fillText('1', px(1) - 3, 86);
      ctx.fillText('2', px(2) - 3, 86); ctx.fillText('4', px(4) - 3, 86);
      /* fp8 log */
      ctx.fillStyle = C.orange; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('FP8-E4M3: 近 0 密 · 远处疏 (对数)', 70, 122);
      ctx.strokeStyle = C.dark; ctx.beginPath();
      ctx.moveTo(70, 138); ctx.lineTo(c.w - 50, 138); ctx.stroke();
      var fp8pts = [];
      for (var e = -3; e <= 2; e++) {
        for (var m = 0; m < 8; m++) {
          var val = (1 + m / 8) * Math.pow(2, e);
          if (val <= 4) fp8pts.push(val);
        }
      }
      fp8pts.sort(function (a, b) { return a - b; });
      fp8pts.forEach(function (v) {
        ctx.strokeStyle = C.orange;
        ctx.beginPath(); ctx.moveTo(px(v), 130); ctx.lineTo(px(v), 146); ctx.stroke();
      });
      /* LLM weight distribution overlay */
      ctx.fillStyle = C.blue; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('典型 LLM 权重分布: 尖峰在 0 · 长尾拉远', 70, 176);
      ctx.strokeStyle = C.blue;
      ctx.beginPath();
      for (var x = 70; x <= c.w - 50; x += 3) {
        var t = (x - 70) / (c.w - 120) * 4;
        var p = Math.exp(-Math.pow(Math.abs(t) * 1.6, 2)) + 0.15 * Math.exp(-Math.abs(t - 2.6) * 2);
        var y = 232 - p * 46;
        if (x === 70) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('尖峰区: FP8 格子密 ✓   长尾区: int8 格子被浪费 ✗ — 分布形状决定胜负', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
/* precision.js P3 — 图5 精度阶梯 + 关闭 IIFE */
  /* ============ 图5 · 精度阶梯 ============ */
  (function () {
    function draw() {
      var c = fit('ladderCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('精度每降一档: TFLOPS ×2 · 显存 ÷2', 14, 20);
      /* H100 bars: fp32 67, bf16 989, fp8 1979 */
      var rows = [
        { n: 'H100 fp32', v: 67, unit: 'TFLOPS', col: C.blue, bytes: '4B' },
        { n: 'H100 bf16', v: 989, unit: 'TFLOPS', col: C.pink, bytes: '2B' },
        { n: 'H100 fp8', v: 1979, unit: 'TFLOPS', col: C.orange, bytes: '1B' },
        { n: 'B200 fp4', v: 9000, unit: 'TFLOPS', col: C.red, bytes: '0.5B' }
      ];
      var maxV = 9000;
      rows.forEach(function (r, i) {
        var y = 40 + i * 36;
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.n, 14, y + 13);
        var bx = 110, bw = c.w - 250;
        ctx.fillStyle = C.dark; ctx.fillRect(bx, y, bw, 20);
        ctx.fillStyle = r.col; ctx.fillRect(bx, y, bw * r.v / maxV, 20);
        ctx.fillStyle = r.col; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(r.v >= 1000 ? (r.v / 1000).toFixed(1) + 'P' : r.v + 'T', bx + bw * r.v / maxV + 8, y + 14);
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(r.bytes + '/参数', c.w - 100, y + 14);
      });
      /* memory ladder right */
      var mem = ['16GB', '8GB', '4GB', '2GB'];
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('同一份 8B 权重:', 14, c.h - 60);
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('fp16 16GB → int8 8GB → int4 4GB — 每档 ÷2 (Quantization 页账本)', 14, c.h - 38);
      ctx.fillStyle = C.green;
      ctx.fillText('DS-V3: 原生 FP8 训练 — 558 万美元账本的功臣之一', 14, c.h - 16);
    }
    draw(); redraws.push(draw);
  })();
})();
