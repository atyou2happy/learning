/* crossentropy.js P1 — 图1 surprisal + 图2 流水线 */
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

  /* ============ 图1 · surprisal 计分表 ============ */
  (function () {
    var pts = [
      { p: 1, b: 0 }, { p: 0.5, b: 1 }, { p: 0.25, b: 2 },
      { p: 0.1, b: 3.32 }, { p: 0.01, b: 6.64 }
    ];
    function draw() {
      var c = fit('surpCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('surprisal = -log₂(P) — 猜词赌局的计分表', 14, 20);
      /* curve: y = -log2(x) over (0,1] */
      var x0 = 50, x1 = c.w - 60, y1 = 34, y0 = c.h - 40;
      var px = function (p) { return x0 + p * (x1 - x0); };
      var py = function (b) { return y0 - b / 7 * (y0 - y1); };
      ctx.strokeStyle = C.dark;
      [0, 1, 2, 3, 6.64].forEach(function (g) {
        ctx.beginPath(); ctx.moveTo(x0, py(g)); ctx.lineTo(x1, py(g)); ctx.stroke();
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(g + 'b', x0 - 24, py(g) + 4);
      });
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 100; i >= 1; i--) {
        var p = i / 100;
        var b = -Math.log(p) / Math.LN2;
        if (i === 100) ctx.moveTo(px(p), py(b)); else ctx.lineTo(px(p), py(b));
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* marked points */
      pts.forEach(function (pt) {
        ctx.fillStyle = C.pink;
        ctx.beginPath(); ctx.arc(px(pt.p), py(pt.b), 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.text; ctx.font = 'bold 10.5px monospace';
        ctx.fillText('P=' + pt.p + ' → ' + pt.b.toFixed(2) + 'b', px(pt.p) - 26, py(pt.b) - 10);
      });
      /* P=1 zone annotation */
      ctx.fillStyle = C.green; ctx.font = 'bold 11px monospace';
      ctx.fillText('押满 P→1: 罚分趋 0 (安全区)', px(0.62), py(0.55));
      ctx.fillStyle = C.red;
      ctx.fillText('P→0: 罚分爆炸 (罕见但说对 = 大新闻)', px(0.05), py(6.2));
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('P (给正确词的概率)', (x0 + x1) / 2 - 34, c.h - 14);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · logits → 概率 → 分数 ============ */
  (function () {
    function draw() {
      var c = fit('pipeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var stages = [
        { n: '总线×lm_head', v: 'logits [2.0, 1.0, 0.5, -0.5]', col: C.blue },
        { n: 'softmax(·/T)', v: 'p = [60%, 22%, 13%, 5%]', col: C.green },
        { n: '正确词 idx0', v: 'P = 0.60', col: C.orange },
        { n: '-log₂(0.60)', v: 'loss = 0.74 bits', col: C.red }
      ];
      var sw = (c.w - 60) / 4;
      stages.forEach(function (s, i) {
        var x = 20 + i * (sw + 8);
        ctx.strokeStyle = s.col; ctx.fillStyle = s.col + '18';
        ctx.fillRect(x, 44, sw - 8, 66); ctx.strokeRect(x, 44, sw - 8, 66);
        ctx.fillStyle = s.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(s.n, x + 10, 66);
        ctx.fillStyle = C.text; ctx.font = '11px monospace';
        ctx.fillText(s.v, x + 10, 88);
        if (i < 3) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + sw - 6, 77); ctx.lineTo(x + sw + 4, 77); ctx.stroke();
          ctx.fillStyle = C.dim;
          ctx.fillText('→', x + sw - 8, 72);
        }
      });
      /* gradient note */
      ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('梯度: ∂loss/∂logit = p − onehot = [-0.40, +0.22, +0.13, +0.05]', 20, 148);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('正确词往上推 0.40, 其余按占比下拉 — 概率质量守恒地搬家', 20, 170);
      ctx.fillStyle = C.purple; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('同一 softmax 三页三种用法: Sampling 调 T · Attention √d 防饱和 · 幻觉 T→0.1 — 本页只读分', 20, 192);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('示例数字: logits [2,1,0.5,-0.5] @T=1 (node 实算, 见 Sampling 页同例)', 20, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();
/* crossentropy.js P2 — 图3 真·训练模拟器 + 图4 PPL 双轴 */
  /* ============ 图3 · 玩具训练循环 ============ */
  (function () {
    var V = 8, target = 2, lr = 0.4;
    var logits = new Array(V).fill(0);
    var step = 0;
    /* frozen from node (same code): loss & P(target)% per step 0..24 */
    var TRAJ = [[3, 12.5], [2.509, 17.6], [2.077, 23.7], [1.71, 30.6], [1.408, 37.7], [1.166, 44.6], [0.975, 50.9], [0.825, 56.5], [0.707, 61.3], [0.613, 65.4], [0.538, 68.9], [0.477, 71.8], [0.427, 74.4], [0.386, 76.5], [0.351, 78.4], [0.321, 80], [0.296, 81.5], [0.274, 82.7], [0.255, 83.8], [0.238, 84.8], [0.223, 85.7], [0.21, 86.4], [0.198, 87.2], [0.188, 87.8], [0.178, 88.4]];
    function sm() {
      var m = Math.max.apply(null, logits);
      var e = logits.map(function (v) { return Math.exp(v - m); });
      var Z = e.reduce(function (s, x) { return s + x; }, 0);
      return e.map(function (x) { return x / Z; });
    }
    function doStep() {
      var p = sm();
      logits = logits.map(function (v, i) { return v - lr * (p[i] - (i === target ? 1 : 0)); });
      step++;
    }
    var b1 = document.getElementById('trBtn');
    var b2 = document.getElementById('trRun');
    var b3 = document.getElementById('trReset');
    if (b1) b1.addEventListener('click', function () { if (step < 25) doStep(); draw(); });
    if (b2) b2.addEventListener('click', function () { while (step < 25) doStep(); draw(); });
    if (b3) b3.addEventListener('click', function () { logits = new Array(V).fill(0); step = 0; draw(); });
    function draw() {
      var c = fit('trainCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('真·梯度下降 — 8 词表 · 正确词 = 词2 · lr 0.4 · step ' + step + '/25', 14, 20);
      /* left: prob bars */
      var p = sm();
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('P(每个词)', 16, 46);
      for (var i = 0; i < V; i++) {
        var y = 58 + i * 26;
        var bw = (c.w / 2 - 140) * p[i];
        ctx.fillStyle = i === target ? C.green : C.dark;
        ctx.fillRect(70, y, Math.max(2, (c.w / 2 - 140)), 16);
        ctx.fillStyle = i === target ? C.green : C.dim;
        ctx.fillRect(70, y, Math.max(2, bw), 16);
        ctx.fillStyle = i === target ? C.text : C.dim; ctx.font = '11px monospace';
        ctx.fillText('词' + i, 38, y + 12);
        ctx.fillStyle = i === target ? C.green : C.dim;
        ctx.fillText((p[i] * 100).toFixed(1) + '%', 78 + Math.max(2, bw), y + 12);
      }
      /* right: loss curve */
      var cx = c.w / 2 + 30, cw = c.w - cx - 30;
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('loss (bits)', cx, 46);
      var py = function (l) { return 64 + (3.1 - l) / 3.1 * (c.h - 130); };
      var pxx = function (s) { return cx + s / 25 * cw; };
      ctx.strokeStyle = C.dark;
      [3, 2, 1, 0].forEach(function (g) {
        ctx.beginPath(); ctx.moveTo(cx, py(g)); ctx.lineTo(cx + cw, py(g)); ctx.stroke();
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        ctx.fillText(g, cx - 14, py(g) + 3);
      });
      /* baseline log2(8) */
      ctx.strokeStyle = C.red + '88'; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(cx, py(3)); ctx.lineTo(cx + cw, py(3)); ctx.stroke();
      ctx.setLineDash([]);
      /* full traj dim, current bold */
      ctx.strokeStyle = C.blue + '44'; ctx.lineWidth = 2;
      ctx.beginPath();
      TRAJ.forEach(function (t, s) { if (s === 0) ctx.moveTo(pxx(s), py(t[0])); else ctx.lineTo(pxx(s), py(t[0])); });
      ctx.stroke();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var s = 0; s <= step && s < TRAJ.length; s++) {
        if (s === 0) ctx.moveTo(pxx(s), py(TRAJ[s][0])); else ctx.lineTo(pxx(s), py(TRAJ[s][0]));
      }
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(pxx(Math.min(step, 24)), py(TRAJ[Math.min(step, 24)][0]), 4, 0, Math.PI * 2); ctx.fill();
      /* readouts */
      var t = TRAJ[Math.min(step, 24)];
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('loss ' + t[0].toFixed(2) + ' bits · P(词2) ' + t[1] + '% · PPL ' + Math.pow(2, t[0]).toFixed(2), cx, c.h - 26);
      ctx.fillStyle = C.red; ctx.font = '11px monospace';
      ctx.fillText('- - 均匀瞎猜线 3.00 bits = log₂8', cx, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · PPL 双轴 ============ */
  (function () {
    /* shared x: loss bits; rows convert */
    function draw() {
      var c = fit('pplCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('PPL = 2^loss — 同一条曲线的两种纵轴', 14, 20);
      var rows = [
        { l: 3.00, note: '开局 8 词均匀瞎猜', ppl: 8.00, col: C.dim },
        { l: 2.51, note: 'Quantization 页 FP16 的 5.7', ppl: 5.70, col: C.blue },
        { l: 2.54, note: '4bit 量化后 5.9 (+0.03b)', ppl: 5.90, col: C.orange },
        { l: 2.00, note: '旗舰级 ≈ 压缩到 1/4', ppl: 4.00, col: C.green }
      ];
      rows.forEach(function (r, i) {
        var y = 44 + i * 40;
        /* loss bar (0..3.2 bits) */
        var bw = (c.w / 2 - 100) * r.l / 3.2;
        ctx.fillStyle = r.col + '30'; ctx.fillRect(90, y, c.w / 2 - 100, 18);
        ctx.fillStyle = r.col; ctx.fillRect(90, y, bw, 18);
        ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(r.l.toFixed(2) + ' bits', 12, y + 13);
        /* ppl bar scaled to 8 max */
        var bx = c.w / 2 + 20, pw = (c.w - bx - 130) * r.ppl / 8;
        ctx.fillStyle = r.col + '30'; ctx.fillRect(bx, y, c.w - bx - 130, 18);
        ctx.fillStyle = r.col; ctx.fillRect(bx, y, pw, 18);
        ctx.fillStyle = r.col; ctx.font = 'bold 11.5px monospace';
        ctx.fillText('PPL ' + r.ppl.toFixed(2), bx + (c.w - bx - 130) + 8, y + 13);
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(r.note, 90, y + 30);
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('读法: loss 差 0.05b = PPL 5.7→5.9 —— 「犹豫只多 0.2 个词」', 14, c.h - 30);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('Tokenizer 天花板 17 bits(128k 词表) — 压缩即智能的账本单位', 14, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();
/* crossentropy.js P3 — 图5 log 家族 + 关闭 IIFE */
  /* ============ 图5 · 对数账本 ============ */
  (function () {
    function draw() {
      var c = fit('familyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('凡是比较两个分布, 都是这个公式 — 全站对账', 14, 20);
      /* center: -log family hub */
      var cx = c.w / 2, cy = c.h / 2 + 6;
      ctx.strokeStyle = C.pink; ctx.fillStyle = C.pink + '14';
      ctx.fillRect(cx - 100, cy - 28, 200, 56); ctx.strokeRect(cx - 100, cy - 28, 200, 56);
      ctx.fillStyle = C.text; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
      ctx.fillText('log 家族', cx, cy - 4);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('surprisal·CE·KL·温度', cx, cy + 16);
      /* six members */
      var members = [
        { n: 'Scaling 纵轴', d: 'L(C) 曲线单位 bits/token', col: C.blue },
        { n: 'RLHF 缰绳', d: 'KL = Σp·log(p/q)', col: C.purple },
        { n: 'Sampling 温度', d: 'softmax(·/T) 生成侧', col: C.green },
        { n: 'Quantization PPL', d: '2^loss 读表', col: C.orange },
        { n: 'Tokenizer 17b', d: '词表熵天花板', col: C.dim },
        { n: 'Pretraining', d: '压缩即智能', col: C.red }
      ];
      var pos = [
        { x: 130, y: 60 }, { x: c.w - 130, y: 60 }, { x: 90, y: cy },
        { x: c.w - 90, y: cy }, { x: 130, y: c.h - 44 }, { x: c.w - 130, y: c.h - 44 }
      ];
      members.forEach(function (m, i) {
        var p = pos[i];
        ctx.strokeStyle = m.col;
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(cx + (p.x < cx ? -100 : 100), cy + (p.y < cy ? -20 : (p.y > cy ? 20 : 0)));
        ctx.stroke();
        ctx.fillStyle = m.col; ctx.font = 'bold 11.5px monospace'; ctx.textAlign = 'center';
        ctx.fillText(m.n, p.x, p.y - 4);
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        ctx.fillText(m.d, p.x, p.y + 12);
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('单点(surprisal) → 平均(交叉熵) → 与理想之差(KL) — 一家人三个粒度', 14, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();
})();
