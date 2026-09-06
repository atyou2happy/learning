/* residual.js P1 — 图1 总线 + 图2 望远镜 */
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

  /* ============ 图1 · 总线 + 站点 ============ */
  (function () {
    function draw() {
      var c = fit('busCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var midY = 96;
      /* the bus */
      ctx.fillStyle = C.blue + '30';
      ctx.fillRect(24, midY - 12, c.w - 48, 24);
      ctx.strokeStyle = C.blue;
      ctx.strokeRect(24, midY - 12, c.w - 48, 24);
      ctx.fillStyle = C.blue; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('残差总线 (4096 维)', 30, midY + 4);
      /* entry */
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('词嵌入', 24, midY - 44);
      ctx.strokeStyle = C.green;
      ctx.beginPath(); ctx.moveTo(60, midY - 34); ctx.lineTo(60, midY - 13); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.fillText('x 进站', 70, midY - 26);
      /* stations */
      var n = 6, sw = 54, gap = (c.w - 140 - n * sw) / (n - 1);
      var labels = ['L1', 'L6', 'L12', 'L18', 'L25', 'L32'];
      labels.forEach(function (lb, i) {
        var x = 110 + i * (sw + gap);
        /* attn + ffn as two write arrows */
        ctx.strokeStyle = C.pink;
        ctx.beginPath(); ctx.moveTo(x + 10, midY - 70); ctx.lineTo(x + 10, midY - 13); ctx.stroke();
        ctx.fillStyle = C.pink; ctx.font = '10.5px monospace';
        ctx.fillText('+attn', x - 12, midY - 76);
        ctx.strokeStyle = C.orange;
        ctx.beginPath(); ctx.moveTo(x + 34, midY - 70); ctx.lineTo(x + 34, midY - 13); ctx.stroke();
        ctx.fillStyle = C.orange;
        ctx.fillText('+ffn', x + 30, midY - 76);
        ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
        ctx.fillText(lb, x + 16, midY + 36);
      });
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('…', 110 + 2.5 * (sw + gap) + sw / 2 - 6, midY + 36);
      /* top reader */
      ctx.strokeStyle = C.purple;
      ctx.beginPath(); ctx.moveTo(c.w - 46, midY - 13); ctx.lineTo(c.w - 46, midY - 58); ctx.stroke();
      ctx.fillStyle = C.purple; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('lm_head 读出', c.w - 118, midY - 66);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('4096×128256 → P(下一词)', c.w - 148, midY - 50);
      /* bottom note */
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('h ← h + attn(h) + ffn(h) — 每站两笔都是「加」，从不覆盖', 24, c.h - 44);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('传统「串联盒子」画法是错觉: 层们并联在同一根总线上, 每层只是又一个写入者', 24, c.h - 24);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 望远镜 vs 覆写 ============ */
  (function () {
    /* frozen from node run: resid cos after each 8 layers, with/without residual */
    var WITH = [1.000, 0.853, 0.721, 0.615, 0.542, 0.494, 0.460, 0.435];
    var WITHOUT = [1.000, 0.412, 0.096, -0.041, -0.128, -0.183, -0.219, -0.243];
    function draw() {
      var c = fit('teleCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('cos(原始嵌入, 顶层向量) — 32 层随机增量, node 实测', 14, 20);
      /* axis: y in [-0.4, 1], x = layer 0..32 */
      var x0 = 54, x1 = c.w - 20, y1 = 36, y0 = c.h - 44;
      var px = function (l) { return x0 + l / 32 * (x1 - x0); };
      var py = function (v) { return y0 - (v + 0.4) / 1.4 * (y0 - y1); };
      ctx.strokeStyle = C.dark;
      [1, 0.5, 0, -0.4].forEach(function (g) {
        ctx.beginPath(); ctx.moveTo(x0, py(g)); ctx.lineTo(x1, py(g)); ctx.stroke();
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(g.toFixed(1), x0 - 26, py(g) + 4);
      });
      [0, 8, 16, 24, 32].forEach(function (l) {
        ctx.fillStyle = C.dim;
        ctx.fillText('L' + l, px(l) - 6, y0 + 16);
      });
      /* series */
      function series(vals, col) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        ctx.beginPath();
        vals.forEach(function (v, i) {
          var l = i * 4;
          if (i === 0) ctx.moveTo(px(l), py(v)); else ctx.lineTo(px(l), py(v));
        });
        ctx.stroke();
        vals.forEach(function (v, i) {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(px(i * 4), py(v), 3.4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.lineWidth = 1;
      }
      series(WITH, C.green);
      series(WITHOUT, C.red);
      ctx.fillStyle = C.green; ctx.font = 'bold 12px monospace';
      ctx.fillText('● 有残差 (望远镜求和): cos 0.49, 投影 0.77 — 嵌入活着', x0 + 8, py(0.62));
      ctx.fillStyle = C.red; ctx.font = 'bold 12px monospace';
      ctx.fillText('● 无残差 (逐层覆写): cos → -0.27 — 信号磨平', x0 + 8, py(-0.05));
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('前向信号死 + 反向梯度死 = 双杀; 加法给两个方向各留直通路 (ResNet 2015)', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
/* residual.js P2 — 图3 logit lens stepper + 图4 多车道 */
  /* ============ 图3 · logit lens ============ */
  (function () {
    /* frozen node run, 32 layers, P(France)% */
    var LAD = [18.6, 20.4, 23.3, 25.2, 25.6, 27.2, 62.1, 83.7, 95.9, 99.1, 99.8, 99.9, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    var cur = 0;
    var btn = document.getElementById('llBtn');
    var rbtn = document.getElementById('llReset');
    if (btn) btn.addEventListener('click', function () {
      cur = Math.min(cur + 1, 31);
      if (btn) btn.textContent = cur >= 31 ? '已到顶层 ↺' : '下一层 →';
      draw();
    });
    if (rbtn) rbtn.addEventListener('click', function () {
      cur = 0; if (btn) btn.textContent = '下一层 →'; draw();
    });
    function draw() {
      var c = fit('lensCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('logit lens · P(France) 逐层读数 — prompt: "The capital of France is"', 14, 20);
      /* bars for layers 1..32 (compressed) */
      var bw = (c.w - 120) / 32;
      LAD.forEach(function (p, i) {
        var bh = Math.max(2, (c.h - 110) * p / 100);
        var on = i <= cur;
        ctx.fillStyle = !on ? C.dark : (i < 6 ? C.dim : (i < 9 ? C.orange : C.green));
        ctx.fillRect(70 + i * bw, c.h - 60 - bh, bw - 2.5, bh);
        ctx.fillStyle = C.dim; ctx.font = '9.5px monospace';
        if ((i + 1) % 4 === 0 || i === 6) ctx.fillText(i + 1, 70 + i * bw - 2, c.h - 44);
      });
      /* lens readout box */
      var p = LAD[cur];
      ctx.strokeStyle = p < 30 ? C.dim : (cur < 9 ? C.orange : C.green);
      ctx.fillStyle = C.bg;
      ctx.fillRect(70, 34, 300, 56); ctx.strokeRect(70, 34, 300, 56);
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('第 ' + (cur + 1) + ' 层顶端读数: P(France) = ' + p + '%', 82, 56);
      ctx.font = '11px monospace';
      var phase = cur < 6 ? '瞎猜阶段 — 浅层在搭脚手架' : (cur < 9 ? '★ 事实成形 — 中游 MLP 写入' : '精修阶段 — 概率已饱和');
      ctx.fillStyle = cur < 6 ? C.dim : (cur < 9 ? C.orange : C.green);
      ctx.fillText(phase, 82, 76);
      /* pointer */
      ctx.strokeStyle = C.text;
      ctx.beginPath(); ctx.moveTo(70 + cur * bw + bw / 2 - 1, 92); ctx.lineTo(70 + cur * bw + bw / 2 - 1, c.h - 64); ctx.stroke();
      /* jump annotation */
      if (cur >= 6) {
        ctx.fillStyle = C.orange; ctx.font = 'bold 11.5px monospace';
        ctx.fillText('第 7 层: 27% → 62% (跳变点, ROME 定位的中游 MLP)', 390, 56);
        ctx.fillStyle = C.dim;
        ctx.fillText('后 20 层只做精修: 99% → 100%', 390, 76);
      }
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('把 lm_head 提前挂到每层顶端 — 总线每一站都可以直接「出声」', 14, c.h - 14);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 多车道协议 ============ */
  (function () {
    function draw() {
      var c = fit('laneCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('4096 根车道 · 谁写哪段 — 互不覆盖的总线协议', 14, 20);
      /* big bus bar made of segments */
      var lanes = [
        { n: '位置信息', d: 'dims 0-500', col: C.blue, w: 0.16 },
        { n: '句法特征', d: 'dims 500-1300', col: C.purple, w: 0.22 },
        { n: '指派/引用', d: 'dims 1300-2100', col: C.green, w: 0.20 },
        { n: '事实内容', d: 'dims 2100-3300', col: C.orange, w: 0.31 },
        { n: '(未占用/余量)', d: 'dims 3300-4096', col: C.dark, w: 0.11 }
      ];
      var x = 24, y = 52, hgt = 34;
      lanes.forEach(function (ln) {
        var w = (c.w - 48) * ln.w;
        ctx.fillStyle = ln.col + (ln.n.indexOf('未占用') >= 0 ? '55' : 'cc');
        ctx.fillRect(x, y, w - 2, hgt);
        ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
        if (w > 80) ctx.fillText(ln.n, x + 8, y + 14);
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        if (w > 80) ctx.fillText(ln.d, x + 8, y + 27);
        x += w;
      });
      /* writers */
      ctx.font = 'bold 12.5px monospace';
      ctx.fillStyle = C.green;
      ctx.fillText('Attention 头 = 收发器: 每头订阅几条车道 (头3 指派 / 头7 句法 / 头12 位置 — Attention 页)', 24, 126);
      ctx.fillStyle = C.orange;
      ctx.fillText('FFN 键 = 记忆写入器: 往事实车道加增量 (FFN 页)', 24, 150);
      /* explains L3 */
      ctx.strokeStyle = C.dark; ctx.beginPath(); ctx.moveTo(24, 168); ctx.lineTo(c.w - 24, 168); ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('解 L3 谜题: 前 6 层在铺设车道(脚手架), 第 7 层的车到了 —', 24, 192);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('logit lens 只看到「事实车道」的读数; 其他车道的工作不体现在 France 的概率上', 24, 212);
      ctx.fillStyle = C.dim;
      ctx.fillText('(车道划分为示意 — Anthropic 玩具模型证明写入者近乎正交, 具体段因模型而异)', 24, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
/* residual.js P3 — 图5 全站地图 + 关闭 IIFE */
  /* ============ 图5 · 全站地图 ============ */
  (function () {
    function draw() {
      var c = fit('mapCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('全站重画: 每一页都是这根管道的一个区段', 14, 20);
      /* pipeline */
      var stages = [
        { n: 'Tokenizer', d: '进站编码', col: C.blue },
        { n: 'Attention', d: '收发器', col: C.green },
        { n: 'FFN', d: '记忆写入', col: C.orange },
        { n: 'KV Cache', d: '历史快照', col: C.pink },
        { n: 'MLA', d: '快照压缩', col: C.purple },
        { n: 'Sampling', d: '顶端读出', col: C.red }
      ];
      var sw = (c.w - 100) / 6;
      stages.forEach(function (s, i) {
        var x = 40 + i * sw;
        ctx.strokeStyle = s.col; ctx.fillStyle = s.col + '18';
        ctx.fillRect(x + 4, 40, sw - 12, 62); ctx.strokeRect(x + 4, 40, sw - 12, 62);
        ctx.fillStyle = s.col; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(s.n, x + 12, 62);
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(s.d, x + 12, 80);
        if (i < 5) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + sw - 7, 71); ctx.lineTo(x + sw + 1, 71); ctx.stroke();
        }
      });
      /* size ledger */
      var rows = [
        { n: '总线瞬时状态', v: '8 KB/token (4096 维 × 2B)', col: C.blue },
        { n: 'KV Cache (历史快照)', v: '0.5 MB/token = 64× 现在', col: C.pink },
        { n: '写入位总数', v: '4096 × 32 = 13.1 万格/token', col: C.orange },
        { n: 'lm_head 读出器', v: '525M 参数 (常与嵌入共享)', col: C.purple }
      ];
      rows.forEach(function (r, i) {
        var y = 126 + i * 26;
        ctx.fillStyle = r.col; ctx.font = 'bold 12px monospace';
        ctx.fillText('●', 24, y);
        ctx.fillStyle = C.text;
        ctx.fillText(r.n, 40, y);
        ctx.fillStyle = C.dim;
        ctx.fillText(r.v, 210, y);
      });
      /* depth vs width */
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('加深 = 多几个站点 (梯度靠加法保通) · 加宽 = 车道变多 (信息更并行) — 两笔不同的账', 24, c.h - 32);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('Scaling Laws 页的 N 和 d, 在这里有了实体 — 「历史比现在贵 64 倍」也是 MLA 那 57× 的对象', 24, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();
})();
