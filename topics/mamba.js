/* mamba.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 痛点: 记忆的账单 ============ */
  (function () {
    function draw() {
      var c = fit('painCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('KV Cache 的账单: 每个 token 都留一份档案', 16, 22);
      var rows = [
        { n: '1k token', kv: '0.5 GB', col: C.green },
        { n: '16k token', kv: '8 GB', col: C.orange },
        { n: '128k token', kv: '64 GB', col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 40 + i * 34;
        var w = parseFloat(r.kv) / 64 * (c.w / 2 - 100);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(150, y, Math.max(6, w), 24);
        ctx.strokeStyle = r.col; ctx.strokeRect(150, y, Math.max(6, w), 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 17);
        ctx.font = MONO;
        ctx.fillText(r.kv, 156 + Math.max(6, w) + 8, y + 17);
      });
      /* 右: 问题句 */
      var rx = c.w / 2 + 30;
      ctx.fillStyle = C.text; ctx.font = 'bold 14px monospace';
      ctx.fillText('「记忆能不能', rx, 56);
      ctx.fillStyle = C.pink;
      ctx.fillText('不长大?」', rx, 82);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('人类不是这样记事的 —', rx, 112);
      ctx.fillText('读一本小说不会让脑子变大一倍', rx, 132);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('KV 7B MHA 口径 0.5MB/token/层×32层 (kv-cache 页)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 状态增长对比 (核心交互) ============ */
  (function () {
    var L = 4096;
    function draw() {
      var c = fit('growCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 64, y0 = c.h - 40, x1 = c.w - 24, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('显存 (GB)', 8, y1 + 8);
      ctx.fillText('序列长度 (log) →', x0 + 40, c.h - 12);
      var maxGB = 70;
      /* y 刻度 */
      [0, 16, 32, 48, 64].forEach(function (v) {
        var y = y0 - v / maxGB * (y0 - y1);
        ctx.strokeStyle = 'rgba(139,148,158,.12)';
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.fillStyle = C.dim;
        ctx.fillText('' + v, x0 - 24, y + 4);
      });
      var lens = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
      /* KV 线: 线性于 L, log 轴上是直线 */
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.beginPath();
      lens.forEach(function (len, i) {
        var gb = len * 0.5 / 1024 * 1024 / 1024; /* 直接: len * 0.000488 GB */
        gb = len * 0.0005;
        var X = x0 + Math.log(len / 256) / Math.log(512) * (x1 - x0);
        var Y = y0 - Math.min(gb, maxGB) / maxGB * (y0 - y1);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
      /* Mamba 线: 常数 0.008 GB (32层×0.25MB) */
      ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0 - 0.5 / maxGB * (y0 - y1));
      ctx.lineTo(x1, y0 - 0.5 / maxGB * (y0 - y1));
      ctx.stroke(); ctx.lineWidth = 1;
      /* 标注 */
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('Transformer KV Cache (线性增长)', x1 - 280, 44);
      ctx.fillStyle = C.green;
      ctx.fillText('Mamba 状态 (0.008 GB, 恒定)', x1 - 240, 62);
      /* 当前 L 标记 */
      var cx = x0 + Math.log(L / 256) / Math.log(512) * (x1 - x0);
      var kvGB = L * 0.0005;
      var cy = y0 - Math.min(kvGB, maxGB) / maxGB * (y0 - y1);
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.font = MONO;
      var ratio = kvGB / 0.008;
      ctx.fillText('L=' + (L >= 1024 ? (L / 1024) + 'k' : L) + ': KV ' + kvGB.toFixed(1) + 'GB vs 0.008GB (' + ratio.toFixed(0) + 'x)', cx - 120, cy - 10);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('拖滑块 — 短序列差距小, 128k 时 8000 倍', x0, y0 + 28);
    }
    var slider = document.getElementById('lenSlider');
    var lbl = document.getElementById('lenLabel');
    if (slider) slider.addEventListener('input', function () {
      L = [256, 1024, 4096,16384, 65536, 131072][parseInt(slider.value, 10)];
      if (lbl) lbl.textContent = L >= 1024 ? (L / 1024) + 'k tok' : L + ' tok';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 递归公式 ============ */
  (function () {
    function draw() {
      var c = fit('recurCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 状态框 */
      var hx = c.w / 2 - 50, hy = 40, hw = 100, hh = 44;
      ctx.fillStyle = 'rgba(126,231,135,.2)';
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, hw, hh);
      ctx.lineWidth = 1;
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('h_t', hx + 36, hy + 28);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('(固定大小 0.25MB/层)', hx - 30, hy + hh + 18);
      /* 自环 */
      ctx.strokeStyle = C.green;
      ctx.beginPath();
      ctx.arc(hx + hw / 2, hy - 16, 20, Math.PI * 0.15, Math.PI * 0.85, true);
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.fillText('×A (遗忘) + B·x (写入)', hx - 40, hy - 32);
      /* 输入 */
      ctx.fillStyle = C.blue; ctx.font = MONO;
      ctx.fillText('x_t →', hx - 90, hy + 28);
      /* 输出 */
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(hx + hw, hy + hh / 2); ctx.lineTo(hx + hw + 40, hy + hh / 2); ctx.stroke();
      ctx.fillStyle = C.pink; ctx.font = MONO;
      ctx.fillText('y_t', hx + hw + 48, hy + hh / 2 + 4);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('y = C·h (读出)', hx + hw + 6, hy + hh + 18);
      /* 公式 */
      ctx.fillStyle = C.text; ctx.font = 'bold 15px monospace';
      ctx.fillText('h_t = A·h_{t−1} + B·x_t', 16, 136);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('A: 保留多少旧状态 · B: 新信息写多少 · C: 从状态读什么', 16, 158);
      /* 对照 */
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('vs KV Cache: 不存任何历史 token — 历史被『蒸馏』进 h 的 0.25MB 里', 16, 184);
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('代价: 有损。想精确回看第 3 个 token? 它已经被压缩, 回不来了 (attention 可以精确回看)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 选择机制 ============ */
  (function () {
    function draw() {
      var c = fit('selectCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('Mamba 的贡献: 参数看输入下菜 (选择性)', 16, 22);
      /* 一句话流: 重要词大Δ记牢, 无关词小Δ跳过 */
      var toks = [
        { t: '的', imp: 0.15 }, { t: '关键', imp: 0.9 }, { t: '数据', imp: 0.85 },
        { t: '是', imp: 0.2 }, { t: '2024', imp: 0.95 }, { t: '的', imp: 0.15 },
        { t: '营收', imp: 0.9 }, { t: '嗯', imp: 0.1 }
      ];
      var x = 20;
      toks.forEach(function (tk) {
        var bw2 = tk.t.length * 18 + 16;
        var col = tk.imp > 0.6 ? C.green : (tk.imp > 0.3 ? C.orange : C.dim);
        ctx.fillStyle = col + '30';
        ctx.fillRect(x, 40, bw2, 30);
        ctx.strokeStyle = col; ctx.strokeRect(x, 40, bw2, 30);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(tk.t, x + 8, 60);
        /* Δ 柱 */
        var dh = tk.imp * 36;
        ctx.fillStyle = col + '99';
        ctx.fillRect(x + 4, 108 - dh, bw2 - 8, dh);
        ctx.fillStyle = col; ctx.font = '10.5px monospace';
        ctx.fillText('Δ=' + tk.imp.toFixed(2), x + 4, 120);
        x += bw2 + 10;
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('Δt 步长由输入决定: 「2024」「营收」大步写入记忆, 「的」「嗯」几乎跳过', 16, 142);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('经典 S4: A/B/C 固定 — 对莎士比亚和代码用同一副记忆策略', 16, 164);
      ctx.fillStyle = C.green;
      ctx.fillText('Mamba: A/B/C 依赖 x — 该记的记, 该忘的忘 (与 LSTM 门控神似, 但可并行训练)', 16, 186);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('代价: 选择性打破卷积形式 -> Mamba 用硬件感知并行扫描 (O(log T)) 保住训练并行', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 吞吐曲线 ============ */
  (function () {
    function draw() {
      var c = fit('thruCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 60, y0 = c.h - 40, x1 = c.w - 24, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('吞吐', 10, y1 + 8);
      ctx.fillText('序列长度 (log) →', x0 + 40, c.h - 12);
      /* attention 吞吐: O(L) 每token -> log轴线性下降 */
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= 10; i++) {
        var frac = i / 10;
        var X = x0 + frac * (x1 - x0);
        var thru = Math.max(0.04, 1 - frac * 1.15);
        var Y = y0 - thru * (y0 - y1);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      /* mamba: 常数 (画高一点: 相对吞吐 1x 基准上) */
      ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0 - 0.92 * (y0 - y1));
      ctx.lineTo(x1, y0 - 0.92 * (y0 - y1));
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('Transformer: 每token回看全部历史, 越长越慢', x1 - 320, 44);
      ctx.fillStyle = C.green;
      ctx.fillText('Mamba: 恒定 — 长序列 ~5x (论文口径)', x1 - 280, 66);
      /* 交叉点 */
      var ix = x0 + (1 / 1.15) * (x1 - x0);
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(ix, y0); ctx.lineTo(ix, y1 + 20); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('交叉点: 短序列 attention 赢, 长序列 Mamba 赢', ix - 100, y1 + 10);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('计算账: L=128k 时 attention 每 token 537M 次乘加 vs Mamba 恒定 0.3M — 差 2000x', x0, y0 + 26);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 2026 hybrid 现状 ============ */
  (function () {
    function draw() {
      var c = fit('hybridCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('2026 现实: 不二选一, 混搭', 16, 22);
      /* Jamba 层带 */
      var bx = 30, bw2 = c.w - 80, y = 44;
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('Jamba (AI21, 52B): 1 attention : 7 Mamba', bx, y - 6);
      for (var i = 0; i < 32; i++) {
        var isAtt = i % 8 === 7;
        var w2 = bw2 / 32 - 3;
        ctx.fillStyle = isAtt ? 'rgba(88,166,255,.7)' : 'rgba(126,231,135,.35)';
        ctx.fillRect(bx + i * (bw2 / 32), y, w2, 26);
      }
      ctx.fillStyle = C.blue; ctx.font = '11.5px monospace';
      ctx.fillText('■ attention (精确检索)', bx, y + 44);
      ctx.fillStyle = C.green;
      ctx.fillText('■ Mamba (恒定状态)', bx + 170, y + 44);
      /* 决策表 */
      var rows = [
        ['长文本/流式/基因组', 'SSM 优势区 (状态恒定)'],
        ['精确检索/上下文学习', 'attention 优势区 (精确回看)'],
        ['256k+ 且要检索', 'hybrid (Jamba: 少量 attention 层救检索)'],
        ['Qwen3.8-27B', 'Gated DeltaNet (线性注意力家族) — AirLLM 页跑它只要 3.33GB']
      ];
      rows.forEach(function (r, i) {
        var yy = 130 + i * 22;
        ctx.fillStyle = C.text; ctx.font = '12.5px monospace';
        ctx.fillText('· ' + r[0], bx, yy);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(r[1], bx + 210, yy);
      });
      ctx.fillStyle = C.purple; ctx.font = FONT;
      ctx.fillText('Mamba-2 (SSD): 把 SSM 与 attention 统一成一个数学框架 — 界限还在进一步模糊', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
