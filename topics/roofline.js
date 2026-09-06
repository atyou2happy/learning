/* roofline.js — 全部交互演示（node --check 可直接校验） */
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

  /* log-log 坐标工具: x=AI [0.25,2048], y=TFLOPS [1,1200] */
  var X0 = 70, Y0 = 26, X1 = 30, Y1 = 60;
  function ai2x(ai, w) { return X0 + (Math.log2(ai / 0.25) / 13) * (w - X0 - X1); }
  function tf2y(tf, h) { return (h - Y1) - (Math.log2(tf / 1) / Math.log2(1200)) * (h - Y1 - Y0); }

  /* ============ 图1 · 两台发动机 ============ */
  (function () {
    function draw() {
      var c = fit('engineCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 两个仪表盘 */
      var gauges = [
        { n: '算力', v: '312 TFLOPS', col: C.blue, x: 40 },
        { n: '带宽', v: '2.0 TB/s', col: C.orange, x: c.w / 2 + 40 }
      ];
      gauges.forEach(function (g) {
        ctx.strokeStyle = g.col; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g.x + 110, 80, 52, Math.PI * 0.75, Math.PI * 2.25);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = g.col; ctx.font = 'bold 16px monospace';
        ctx.fillText(g.v, g.x + 46, 116);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(g.n, g.x + 86, 140);
      });
      /* VS */
      ctx.fillStyle = C.dim; ctx.font = 'bold 22px monospace';
      ctx.fillText('vs', c.w / 2 - 14, 88);
      /* 问题 */
      ctx.fillStyle = C.pink; ctx.font = 'bold 14px monospace';
      ctx.fillText('GPU 每一刻只被一个卡住 — 哪个?', 16, 20);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('答案只取决于一件事: 算术强度 (arithmetic intensity)', 16, 178);
      ctx.fillStyle = C.dim;
      ctx.fillText('AI = 每读 1 字节做多少次浮点运算 = flops / bytes', 16, 198);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 屋顶线 + intensity 滑块 (核心交互) ============ */
  (function () {
    var AI = 1;
    var PK = 312, BW = 2039; /* A100 */
    function draw() {
      var c = fit('roofCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var w = c.w, h = c.h;
      /* 轴 */
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(X0, Y0 - 8); ctx.lineTo(X0, h - Y1); ctx.lineTo(w - X1, h - Y1); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('TFLOPS (log)', 6, Y0);
      ctx.fillText('算术强度 flops/byte (log) →', w / 2 - 90, h - 16);
      /* 刻度 */
      [1, 8, 64, 512].forEach(function (ai) {
        ctx.fillText('' + ai, ai2x(ai, w) - 6, h - Y1 + 18);
        ctx.strokeStyle = 'rgba(139,148,158,.1)';
        ctx.beginPath(); ctx.moveTo(ai2x(ai, w), Y0); ctx.lineTo(ai2x(ai, w), h - Y1); ctx.stroke();
      });
      [10, 100, 1000].forEach(function (tf) {
        ctx.fillText('' + tf, X0 - 34, tf2y(tf, h) + 4);
        ctx.strokeStyle = 'rgba(139,148,158,.08)';
        ctx.beginPath(); ctx.moveTo(X0, tf2y(tf, h)); ctx.lineTo(w - X1, tf2y(tf, h)); ctx.stroke();
      });
      /* 屋顶线: 带宽斜坡 + 算力平顶 */
      var ridge = PK * 1000 / BW; /* 153 */
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ai2x(0.25, w), tf2y(Math.max(0.5, BW * 0.25 / 1000), h));
      ctx.lineTo(ai2x(ridge, w), tf2y(PK, h));
      ctx.lineTo(ai2x(2048, w), tf2y(PK, h));
      ctx.stroke(); ctx.lineWidth = 1;
      /* 两区标注 */
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('← 带宽墙: 越算越饿 (attainable = BW × AI)', X0 + 20, Y0 + 26);
      ctx.fillStyle = C.blue;
      ctx.fillText('算力墙: 满血 312T →', ai2x(ridge, w) + 24, tf2y(PK, h) - 12);
      /* 屋脊点 */
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('屋脊点 153', ai2x(ridge, w) - 30, tf2y(PK, h) + 24);
      /* 当前点 */
      var att = Math.min(PK, BW * AI / 1000);
      var px = ai2x(Math.max(0.25, AI), w), py = tf2y(Math.max(0.5, att), h);
      ctx.fillStyle = C.red;
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.stroke();
      /* 读数 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      var eff = Math.round(100 * att / PK);
      ctx.fillText('AI=' + AI + ' → attainable ' + att.toFixed(0) + ' TFLOPS (效率 ' + eff + '%)', px + 14, py - 12);
    }
    var slider = document.getElementById('aiSlider');
    var lbl = document.getElementById('aiLabel');
    if (slider) slider.addEventListener('input', function () {
      var v = parseInt(slider.value, 10); /* 0..11 */
      AI = Math.pow(2, v - 2); /* 0.25 .. 512 */
      if (lbl) lbl.textContent = AI + ' flops/byte';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 全站七案例钉上曲线 ============ */
  (function () {
    function draw() {
      var c = fit('pinsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var w = c.w, h = c.h;
      var PK = 312, BW = 2039, ridge = 153;
      /* 屋顶线 */
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ai2x(0.25, w), tf2y(Math.max(0.5, BW * 0.25 / 1000), h));
      ctx.lineTo(ai2x(ridge, w), tf2y(PK, h));
      ctx.lineTo(ai2x(2048, w), tf2y(PK, h));
      ctx.stroke(); ctx.lineWidth = 1;
      /* 轴 */
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X0, h - Y1); ctx.lineTo(w - X1, h - Y1); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      [1, 8, 64, 512].forEach(function (ai) { ctx.fillText('' + ai, ai2x(ai, w) - 6, h - Y1 + 16); });
      [10, 100, 1000].forEach(function (tf) { ctx.fillText('' + tf, X0 - 30, tf2y(tf, h) + 4); });
      var pins = [
        { n: 'decode B=1', ai: 1, col: C.red, note: 'AI=1 效率1%' },
        { n: 'batch 64', ai: 64, col: C.orange, note: '42%' },
        { n: 'GEMM 4096', ai: 1365, col: C.blue, note: '满血' },
        { n: 'int4 权重', ai: 4, col: C.purple, note: 'AI×4' }
      ];
      pins.forEach(function (p) {
        var att = Math.min(PK, BW * p.ai / 1000);
        var px = ai2x(p.ai, w), py = tf2y(Math.max(0.5, att), h);
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = p.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(p.n, px - 24, py + 22);
        ctx.font = '11px monospace';
        ctx.fillText(p.note, px - 16, py + 36);
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('同一个模型, 同一张卡 — 只因强度不同, 效率从 1% 到满血', 16, 18);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('prefill(GEMM 式) 右墙 · decode(逐token) 左墙 — 一张图解释全站性能技巧', 16, h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 优化 = 在墙上移动 ============ */
  (function () {
    function draw() {
      var c = fit('fixCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('全站性能技巧 = 在屋顶线上移动这个点', 16, 22);
      var moves = [
        { n: '连续批处理 (cb页)', from: 'AI=1 decode', to: 'AI=64 batch', how: '同权重喂64token: flops×64, bytes不变', col: C.orange },
        { n: '量化 int4 (quant页)', from: 'AI=1', to: 'AI=4', how: 'bytes÷4: 强度×4, 坡上右滑', col: C.purple },
        { n: 'FlashAttention (fa页)', from: '物化 N² 矩阵', to: '砍 IO', how: '少读写 S/P: 分母变小, 强度上移', col: C.green },
        { n: 'AirLLM (airllm页)', from: '显存装不下', to: '跑起来但 AI→极低', how: '接受带宽墙的极端: 20s/token', col: C.red },
        { n: 'MoE (moe页)', from: '全部专家计算', to: '只算被路由的', how: 'flops 与 bytes 同降: 少干活', col: C.blue }
      ];
      moves.forEach(function (m, i) {
        var y = 42 + i * 32;
        ctx.fillStyle = m.col + '14';
        ctx.fillRect(16, y, c.w - 32, 28);
        ctx.strokeStyle = m.col; ctx.strokeRect(16, y, c.w - 32, 28);
        ctx.fillStyle = m.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(m.n, 24, y + 19);
        ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
        ctx.fillText(m.from + '  →  ' + m.to, 230, y + 19);
        ctx.fillStyle = C.dim;
        ctx.fillText(m.how, 520, y + 19);
      });
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 四卡屋脊点 ============ */
  (function () {
    function draw() {
      var c = fit('gpuCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('屋脊点 = 峰值算力 ÷ 带宽 — 每张卡的性格', 16, 22);
      var gpus = [
        { n: 'RTX 5090', pk: 210, bw: 1792, ridge: 117, col: C.pink },
        { n: 'A100 SXM', pk: 312, bw: 2039, ridge: 153, col: C.green },
        { n: 'RTX 4090', pk: 165, bw: 1008, ridge: 164, col: C.orange },
        { n: 'H100 SXM', pk: 990, bw: 3350, ridge: 296, col: C.blue }
      ];
      var maxR = 300;
      gpus.forEach(function (g, i) {
        var y = 44 + i * 36;
        var barW = g.ridge / maxR * (c.w - 320);
        ctx.fillStyle = g.col + '44';
        ctx.fillRect(140, y, barW, 26);
        ctx.strokeStyle = g.col; ctx.strokeRect(140, y, barW, 26);
        ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(g.n, 16, y + 18);
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(g.pk + 'T / ' + (g.bw / 1000).toFixed(1) + 'TB/s', 62, y + 18);
        ctx.fillStyle = g.col; ctx.font = MONO;
        ctx.fillText(g.ridge, 148 + barW + 8, y + 18);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('屋脊点越低 → 越早撞带宽墙 → 消费卡跑 decode 更吃亏 (5090: 117 vs H100: 296)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 决策树 ============ */
  (function () {
    function draw() {
      var c = fit('treeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.pink; ctx.font = MONO;
      ctx.fillText('GPU 利用率低 → 先问: 卡在哪堵墙?', 16, 22);
      /* 左右两栏 */
      var cols = [
        { n: '左墙 (带宽)', sym: 'BW', col: C.orange, fixes: ['加大 batch / 连续批处理', 'int8/int4 量化 (bytes↓)', '分页 KV (pagedattn)', '权重住磁盘流式 (airllm)', '少物化中间量 (fa)'] },
        { n: '右墙 (算力)', sym: 'FP', col: C.blue, fixes: ['tensor core / bf16', '更优 tiling / kernel 融合', '降低精度 (fp16→int8)', '剪枝 / MoE 少激活', '换更强的卡 (无奈)'] }
      ];
      cols.forEach(function (col, i) {
        var x = 16 + i * (c.w / 2 - 12);
        var bw2 = c.w / 2 - 28;
        ctx.fillStyle = col.col + '16';
        ctx.fillRect(x, 38, bw2, 150);
        ctx.strokeStyle = col.col; ctx.strokeRect(x, 38, bw2, 150);
        ctx.fillStyle = col.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(col.n + ' — ' + col.sym + ' 利用率满', x + 12, 58);
        ctx.fillStyle = C.text; ctx.font = '12.5px sans-serif';
        col.fixes.forEach(function (f, j) {
          ctx.fillText('· ' + f, x + 12, 80 + j * 21);
        });
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('判断法: profile 看 SM 利用率 vs DRAM 利用率, 谁满谁就是墙', 16, 202);
      ctx.fillStyle = C.dim;
      ctx.fillText('同一张 A100: 训练在右墙吃满 tensor core, 服务 decode 在左墙 42% 折扣 — 两份工作两种性格', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

})();
