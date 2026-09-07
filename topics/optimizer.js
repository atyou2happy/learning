/* optimizer.js P1 — 图1 lr 三档 + 图2 锯齿病理 */
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

  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  /* SGD on 1-D quadratic f = 0.5*a*x^2, a=10 */
  function sgdPath(x0, lr, steps, seed) {
    var rand = rnd(seed), a = 10, path = [x0];
    for (var i = 0; i < steps; i++) {
      var g = a * x0 + (rand() - 0.5) * 0.15;
      x0 -= lr * g;
      path.push(x0);
    }
    return path;
  }

  /* ============ 图1 · lr 三档 ============ */
  (function () {
    function draw() {
      var c = fit('lrCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('w ← w − η·g · a=10 的碗上三种步长 (node 同码实跑)', 14, 20);
      var cases = [
        { n: 'η=0.02 太小', lr: 0.02, col: C.dim, note: '蜗牛: 40 步才走一半' },
        { n: 'η=0.15 恰当', lr: 0.15, col: C.green, note: '平滑下滑到谷底' },
        { n: 'η=0.25 超限 (>2/a=0.2)', lr: 0.25, col: C.red, note: '越弹越远 → 发散' }
      ];
      var x0 = 60, x1 = c.w - 60, y1 = 40, y0 = c.h - 44;
      var px = function (s) { return x0 + s / 40 * (x1 - x0); };
      var py = function (v) {
        var cl = Math.max(-5, Math.min(5, v));
        return y0 - (cl + 5) / 10 * (y0 - y1);
      };
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, py(0)); ctx.lineTo(x1, py(0)); ctx.stroke();
      cases.forEach(function (cs, i) {
        var p = sgdPath(4, cs.lr, 40, 5);
        ctx.strokeStyle = cs.col; ctx.lineWidth = 2;
        ctx.beginPath();
        p.forEach(function (v, s) {
          if (s === 0) ctx.moveTo(px(s), py(v)); else ctx.lineTo(px(s), py(v));
        });
        ctx.stroke(); ctx.lineWidth = 1;
        var y = 56 + i * 20;
        ctx.fillStyle = cs.col; ctx.font = 'bold 11px monospace';
        ctx.fillText('— ' + cs.n + '  ' + cs.note, x0 + 10, y);
      });
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('步数 →', x1 - 46, y0 + 16);
      ctx.fillText('|w|=5 处截断显示; 实测 η=0.25 第 40 步 |w|≈4.4e7', 60, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 锯齿病理 ============ */
  (function () {
    function draw() {
      var c = fit('zigCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('狭长谷 (陡:平 = 20:1) — SGD 单尺码困境', 14, 20);
      /* contour ellipses */
      var cx = c.w * 0.4, cy = c.h * 0.55;
      ctx.strokeStyle = C.dark;
      for (var k = 1; k <= 4; k++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, k * 34, k * 8.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      /* SGD zigzag path (frozen shape from node run a=10,b=0.5,lr=0.15) */
      var path = [[-4, 2]];
      var rand = rnd(5);
      var x = -4, y = 2;
      for (var s = 0; s < 26; s++) {
        var gx = 10 * x + (rand() - 0.5) * 0.15, gy = 0.5 * y + (rand() - 0.5) * 0.15;
        x -= 0.15 * gx; y -= 0.15 * gy;
        path.push([x, y]);
      }
      var px = function (v) { return cx + v / 5 * 150; };
      var py = function (v) { return cy - v / 3 * 60; };
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.beginPath();
      path.forEach(function (p, i) {
        if (i === 0) ctx.moveTo(px(p[0]), py(p[1])); else ctx.lineTo(px(p[0]), py(p[1]));
      });
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px(-4), py(2), 4, 0, Math.PI * 2); ctx.fill();
      /* annotations */
      ctx.fillStyle = C.blue; ctx.font = 'bold 11px monospace';
      ctx.fillText('起点', px(-4) - 14, py(2) - 10);
      ctx.fillStyle = C.dim;
      ctx.fillText('x 陡轴: 锯齿震荡 (前 30 步 |x| 最大 2.0 来回跳)', 14, c.h - 44);
      ctx.fillText('y 平轴: 同一步长太小 → 蜗行 (node 实测)', 14, c.h - 26);
      ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
      ctx.fillText('步长上限被陡轴锁死, 平轴只能用「过小」的步子 — 单尺码不合身', 14, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();
/* optimizer.js P2 — 图3 三优化器竞速 + 图4 修正与账 */
  /* ============ 图3 · 竞速 ============ */
  (function () {
    var ratio = 5;   /* a = ratio*10, b = 0.5 */
    var slider = document.getElementById('bowlSlider');
    var label = document.getElementById('bowlVal');
    if (slider) slider.addEventListener('input', function () {
      ratio = parseInt(slider.value, 10);
      if (label) label.textContent = (ratio * 10) + ':1';
      draw();
    });
    function race(a, b) {
      var rand = rnd(5);
      var lr = 0.15;
      var sgd = { x: -4, y: 2, path: [[-4, 2]] };
      var mom = { x: -4, y: 2, vx: 0, vy: 0, path: [[-4, 2]], beta: 0.9 };
      var adam = { x: -4, y: 2, path: [[-4, 2]], m: [0, 0], v: [0, 0], t: 0, b1: 0.9, b2: 0.999, eps: 1e-8, lr: 0.06 };
      for (var s = 0; s < 60; s++) {
        var gx = a * sgd.x + (rand() - 0.5) * 0.15, gy = b * sgd.y + (rand() - 0.5) * 0.15;
        sgd.x -= lr * gx; sgd.y -= lr * gy;
        sgd.path.push([sgd.x, sgd.y]);
        gx = a * mom.x + (rand() - 0.5) * 0.15; gy = b * mom.y + (rand() - 0.5) * 0.15;
        mom.vx = mom.beta * mom.vx - lr * gx; mom.vy = mom.beta * mom.vy - lr * gy;
        mom.x += mom.vx; mom.y += mom.vy;
        mom.path.push([mom.x, mom.y]);
        adam.t++;
        gx = a * adam.x + (rand() - 0.5) * 0.15; gy = b * adam.y + (rand() - 0.5) * 0.15;
        adam.m[0] = adam.b1 * adam.m[0] + (1 - adam.b1) * gx;
        adam.m[1] = adam.b1 * adam.m[1] + (1 - adam.b1) * gy;
        adam.v[0] = adam.b2 * adam.v[0] + (1 - adam.b2) * gx * gx;
        adam.v[1] = adam.b2 * adam.v[1] + (1 - adam.b2) * gy * gy;
        var mh0 = adam.m[0] / (1 - Math.pow(adam.b1, adam.t));
        var mh1 = adam.m[1] / (1 - Math.pow(adam.b1, adam.t));
        var vh0 = adam.v[0] / (1 - Math.pow(adam.b2, adam.t));
        var vh1 = adam.v[1] / (1 - Math.pow(adam.b2, adam.t));
        adam.x -= adam.lr * mh0 / (Math.sqrt(vh0) + adam.eps);
        adam.y -= adam.lr * mh1 / (Math.sqrt(vh1) + adam.eps);
        adam.path.push([adam.x, adam.y]);
      }
      return { sgd: sgd, mom: mom, adam: adam };
    }
    function draw() {
      var c = fit('raceCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var a = ratio * 10, b = 0.5;
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('谷形 ' + a + ':' + b + ' — 60 步竞速 (真梯度下降)', 14, 20);
      var r = race(a, b);
      var cx = c.w * 0.5, cy = c.h * 0.55;
      var sx = 150 / Math.max(4, a * 0.4), sy = 90;
      var px = function (v) { return cx + Math.max(-3, Math.min(3, v)) * (150 / 3); };
      var py = function (v) { return cy - Math.max(-2.2, Math.min(2.2, v)) * (90 / 2.2); };
      /* contours */
      ctx.strokeStyle = C.dark;
      for (var k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, k * (150 / 3) * (0.9 / Math.sqrt(a / 10)) + 20, k * (90 / 2.2) * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      /* three paths */
      function plot(p, col, name) {
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath();
        p.forEach(function (q, i) {
          if (i === 0) ctx.moveTo(px(q[0]), py(q[1])); else ctx.lineTo(px(q[0]), py(q[1]));
        });
        ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = col;
        var last = p[p.length - 1];
        ctx.beginPath(); ctx.arc(px(last[0]), py(last[1]), 4, 0, Math.PI * 2); ctx.fill();
        return Math.sqrt(last[0] * last[0] + last[1] * last[1]);
      }
      var dS = plot(r.sgd.path, C.blue, 'SGD');
      var dM = plot(r.mom.path, C.green, 'Mom');
      var dA = plot(r.adam.path, C.orange, 'Adam');
      /* start point */
      ctx.fillStyle = C.text;
      ctx.beginPath(); ctx.arc(px(-4), py(2), 4, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 11px monospace';
      ctx.fillText('起点', px(-4) - 24, py(2) - 10);
      /* live scoreboard */
      ctx.font = 'bold 11.5px monospace';
      ctx.fillStyle = C.blue; ctx.fillText('SGD  终点距离 ' + dS.toFixed(2), 14, c.h - 44);
      ctx.fillStyle = C.green; ctx.fillText('Mom  终点距离 ' + dM.toFixed(2), 14, c.h - 26);
      ctx.fillStyle = C.orange; ctx.fillText('Adam 终点距离 ' + dA.toFixed(2) + '  (自适应步长)', 14, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 状态账 + AdamW + 调度 ============ */
  (function () {
    function draw() {
      var c = fit('fixCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('隐藏账 + 解耦修正 + 调度', 14, 20);
      /* left: memory stack 70B training */
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('70B 全参训练显存账', 20, 44);
      var stack = [
        { n: '权重 fp16', gb: 140, col: C.blue },
        { n: '梯度 fp16', gb: 140, col: C.green },
        { n: 'm (fp32)', gb: 280, col: C.orange },
        { n: 'v (fp32)', gb: 280, col: C.red }
      ];
      stack.forEach(function (s2, i) {
        var y = 58 + i * 30;
        ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
        ctx.fillText(s2.n, 20, y + 10);
        ctx.fillStyle = C.dark; ctx.fillRect(130, y, 170, 16);
        ctx.fillStyle = s2.col; ctx.fillRect(130, y, 170 * s2.gb / 840, 16);
        ctx.fillStyle = s2.col; ctx.font = 'bold 11px monospace';
        ctx.fillText(s2.gb + 'GB', 306, y + 12);
      });
      ctx.fillStyle = C.red; ctx.font = 'bold 11px monospace';
      ctx.fillText('m+v = 560GB = 总账的 2/3', 20, 186);
      /* right: AdamW + schedule */
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('AdamW: decay 解耦', c.w / 2 + 20, 44);
      ctx.fillStyle = C.text; ctx.font = '10.5px monospace';
      ctx.fillText('Adam:  g += λw (被 v 缩放 → decay 失效)', c.w / 2 + 20, 64);
      ctx.fillText('AdamW: w -= lr·adam + lr·λ·w (人人平等)', c.w / 2 + 20, 82);
      ctx.fillStyle = C.dim; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('warmup + cosine 调度', c.w / 2 + 20, 116);
      /* schedule curve */
      var sx = c.w / 2 + 20, sw = c.w - sx - 40, sy = 190;
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= 100; i++) {
        var t = i / 100;
        var lr = t < 0.05 ? t / 0.05 : 0.5 * (1 + Math.cos(Math.PI * (t - 0.05) / 0.95)) * 0.9 + 0.1;
        var x = sx + t * sw, y = sy - lr * 60;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw, sy); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = '10px monospace';
      ctx.fillText('warmup', sx, sy + 16);
      ctx.fillText('cosine 退火 → 末期小步精修', sx + sw - 170, sy + 16);
    }
    draw(); redraws.push(draw);
  })();
/* optimizer.js P3 — 图5 机制链 + 关闭 IIFE */
  /* ============ 图5 · 机制链 ============ */
  (function () {
    function draw() {
      var c = fit('chainCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('一次训练的完整机制链 — 至此合龙', 14, 20);
      var stages = [
        { n: '交叉熵', d: '这个 token 罚几分', formula: '−log₂P', col: C.pink },
        { n: '梯度', d: '罚分摊到每个权重', formula: '链式法则 + 残差保通', col: C.blue },
        { n: '优化器', d: '每个参数走多远', formula: 'AdamW: m/√v 步法', col: C.orange },
        { n: 'Scaling', d: '多少预算多大模型', formula: 'C = 6ND', col: C.purple }
      ];
      var sw = (c.w - 60) / 4;
      stages.forEach(function (s, i) {
        var x = 20 + i * sw;
        ctx.strokeStyle = s.col; ctx.fillStyle = s.col + '18';
        ctx.fillRect(x + 4, 44, sw - 12, 100); ctx.strokeRect(x + 4, 44, sw - 12, 100);
        ctx.fillStyle = s.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(s.n, x + 16, 68);
        ctx.fillStyle = C.text; ctx.font = '11.5px monospace';
        ctx.fillText(s.d, x + 16, 92);
        ctx.fillStyle = C.dim; ctx.font = 'bold 11px monospace';
        ctx.fillText(s.formula, x + 16, 122);
        if (i < 3) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + sw - 7, 94); ctx.lineTo(x + sw + 1, 94); ctx.stroke();
        }
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('2026: AdamW 仍是默认 · Muon 等新秀在验证 — 「方向 × 步长」框架永不过时', 14, 176);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('读新优化器的姿势: 它改了方向 (Muon 正交化)? 步长 (Adam 自适应)? 还是耦合方式?', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
})();
