/* continuous-batching.js — 全部交互演示（node --check 可直接校验） */
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

  /* 场景真值: B=6, L=[30,55,80,120,200,340], 利用率 40.4% */
  var SC = {
    L: [30, 55, 80, 120, 200, 340],
    names: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'],
    max: 340, sum: 825, util: 0.404
  };

  /* ============ 图1 · 静态批处理甘特图 ============ */
  (function () {
    function draw() {
      var c = fit('ganttStaticCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 60, y0 = 26, rowH = (c.h - 78) / 6, xmax = c.w - 90;
      function sx(t) { return x0 + (t / SC.max) * (xmax - x0); }
      /* 网格 */
      ctx.strokeStyle = C.dark; ctx.font = FONT;
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
        var x = sx(f * SC.max);
        ctx.beginPath(); ctx.moveTo(x, y0 - 4); ctx.lineTo(x, y0 + rowH * 6); ctx.stroke();
        ctx.fillStyle = C.dim;
        ctx.fillText(Math.round(f * SC.max), x - 10, y0 + rowH * 6 + 16);
      });
      /* 行 */
      SC.L.forEach(function (len, i) {
        var y = y0 + i * rowH;
        ctx.fillStyle = C.dim; ctx.font = MONO;
        ctx.fillText(SC.names[i], x0 - 40, y + rowH / 2 + 4);
        /* 有效段 */
        ctx.fillStyle = ['rgba(88,166,255,.55)', 'rgba(126,231,135,.55)', 'rgba(255,166,87,.55)', 'rgba(163,113,247,.55)', 'rgba(247,120,186,.55)', 'rgba(88,166,255,.55)'][i];
        ctx.fillRect(x0, y + 4, sx(len) - x0, rowH - 10);
        /* 空等段 */
        ctx.fillStyle = 'rgba(248,81,73,.13)';
        ctx.fillRect(sx(len), y + 4, sx(SC.max) - sx(len), rowH - 10);
        ctx.strokeStyle = C.dark;
        ctx.strokeRect(x0, y + 4, sx(SC.max) - x0, rowH - 10);
      });
      /* 汇总 */
      ctx.fillStyle = C.red; ctx.font = MONO;
      ctx.fillText('红色 = 占着槽位空等 (木桶效应)', x0, y0 + rowH * 6 + 36);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('利用率 ' + (SC.util * 100).toFixed(1) + '% — 全体等到 t=340 才能返回', x0, y0 + rowH * 6 + 54);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 连续批处理甘特图（核心交互） ============ */
  (function () {
    /* 队列: 请求流, Q1..Q9, 长度按场景设定; 槽位 B=6 */
    var queue = [95, 150, 60, 210, 130, 85, 175, 100, 140];
    var qnames = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9'];
    var STEP = 17; /* 动画步长 iter */
    var t = 0, running = [], done = [], qhead = 0, timer = null, playing = false;
    var COLORS = [C.blue, C.green, C.orange, C.purple, C.pink, '#79c0ff'];

    function reset() {
      t = 0; running = []; done = []; qhead = 0;
      for (var i = 0; i < 6 && qhead < queue.length; i++) {
        running.push({ name: qnames[qhead], len: queue[qhead], start: 0, col: COLORS[i], remain: queue[qhead] });
        qhead++;
      }
    }
    reset();

    function advance() {
      t += STEP;
      /* 完成 → 出槽, 回填队列 */
      var still = [];
      running.forEach(function (r) {
        r.remain -= STEP;
        if (r.remain <= 0) {
          done.push({ name: r.name, start: r.start, end: t, col: r.col });
          if (qhead < queue.length) {
            running.push({ name: qnames[qhead], len: queue[qhead], start: t, col: COLORS[qhead % 6], remain: queue[qhead] });
            qhead++;
          }
        } else still.push(r);
      });
      running = still;
      /* 注意: 回填发生在 forEach 内, 需防止本 tick 重复扣 */
      running.forEach(function (r) { if (r.start === t) r.remain += 0; });
      draw();
      if (t >= 420 || (running.length === 0 && qhead >= queue.length)) { playing = false; clearInterval(timer); btn.textContent = '▶ 播放'; }
    }
    var btn = document.getElementById('cbPlay');
    if (btn) btn.addEventListener('click', function () {
      if (playing) { playing = false; clearInterval(timer); btn.textContent = '▶ 播放'; }
      else {
        if (t >= 420 || (!running.length && qhead >= queue.length)) { reset(); draw(); }
        playing = true; btn.textContent = '⏸ 暂停';
        timer = setInterval(advance, 200);
      }
    });
    var stepBtn = document.getElementById('cbStep');
    if (stepBtn) stepBtn.addEventListener('click', function () { if (!playing) advance(); });
    var rstBtn = document.getElementById('cbReset');
    if (rstBtn) rstBtn.addEventListener('click', function () { reset(); playing = false; clearInterval(timer); if (btn) btn.textContent = '▶ 播放'; draw(); });

    function draw() {
      var c = fit('ganttContCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var TMAX = 420;
      var x0 = 60, y0 = 22, rowH = (c.h - 92) / 6, xmax = c.w - 80;
      function sx(tt) { return x0 + (tt / TMAX) * (xmax - x0); }
      /* 网格 */
      ctx.strokeStyle = C.dark; ctx.font = FONT;
      [0, 105, 210, 315, 420].forEach(function (g) {
        ctx.beginPath(); ctx.moveTo(sx(g), y0 - 4); ctx.lineTo(sx(g), y0 + rowH * 6); ctx.stroke();
        ctx.fillStyle = C.dim;
        ctx.fillText(g, sx(g) - 10, y0 + rowH * 6 + 16);
      });
      /* 完成段 */
      done.forEach(function (d) {
        var slot = done.indexOf(d) % 6;
        var y = y0 + slot * rowH;
        ctx.fillStyle = d.col + '66';
        ctx.fillRect(sx(d.start), y + 4, sx(d.end) - sx(d.start), rowH - 10);
        ctx.strokeStyle = d.col;
        ctx.strokeRect(sx(d.start), y + 4, sx(d.end) - sx(d.start), rowH - 10);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(d.name, sx(d.start) + 4, y + rowH / 2 + 2);
      });
      /* 运行中 */
      running.forEach(function (r) {
        var y = y0 + running.indexOf(r) * rowH;
        var xEnd = sx(t);
        ctx.fillStyle = r.col + '99';
        ctx.fillRect(sx(r.start), y + 4, xEnd - sx(r.start), rowH - 10);
        ctx.strokeStyle = r.col;
        ctx.strokeRect(sx(r.start), y + 4, xEnd - sx(r.start), rowH - 10);
        ctx.fillStyle = '#fff'; ctx.font = FONT;
        ctx.fillText(r.name + ' ' + Math.max(0, r.remain), sx(r.start) + 4, y + rowH / 2 + 2);
      });
      /* 队列 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      var qtxt = '等待队列: ' + qnames.slice(qhead).map(function (n, i) { return n + '(' + queue[qhead + i] + ')'; }).join(' ');
      ctx.fillText(qtxt.slice(0, 90), x0, y0 + rowH * 6 + 36);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('t=' + t + '  完成 ' + done.length + '/9 · 运行 ' + running.length + ' · 队列 ' + (queue.length - qhead), x0, y0 + rowH * 6 + 56);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 调度对比图 ============ */
  (function () {
    function draw() {
      var c = fit('schedCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: '请求级', d: '攒一批 → 整批完成 → 才接新', gap: '新请求可能等几百 iter', col: C.orange },
        { n: '迭代级', d: '每个 decode 步都重排座位', gap: '完成即出、空位即补', col: C.green }
      ];
      rows.forEach(function (r, i) {
        var y = 24 + i * 74;
        ctx.fillStyle = r.col + '15';
        ctx.fillRect(14, y, c.w - 28, 62);
        ctx.strokeStyle = r.col; ctx.strokeRect(14, y, c.w - 28, 62);
        ctx.fillStyle = r.col; ctx.font = 'bold 14.5px monospace';
        ctx.fillText(r.n + ' 调度', 26, y + 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.d, 26, y + 42);
        ctx.fillStyle = C.dim;
        ctx.fillText(r.gap, 26, y + 58);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('迭代级 = 把「批」的边界从请求生命周期粒度打碎到单步 forward 粒度 —— 这就是 continuous 的含义', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 与 PagedAttention 配合 ============ */
  (function () {
    function draw() {
      var c = fit('pagedCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: 连续分配 KV */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('没有分页时: 预留制回填 = 重新制造碎片', 16, 22);
      var bx = 16, by = 34, bw = (c.w / 2) - 40, bh = 54;
      var cols = 14;
      for (var i = 0; i < cols; i++) {
        var st = i < 3 ? 'used' : (i < 5 ? 'frag' : 'free');
        ctx.fillStyle = st === 'used' ? 'rgba(88,166,255,.5)' : st === 'frag' ? 'rgba(248,81,73,.4)' : 'rgba(139,148,158,.08)';
        ctx.fillRect(bx + i * (bw / cols), by, bw / cols - 3, bh);
      }
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('新请求要 4 格连续 → 只能等', bx, by + bh + 16);
      /* 右: 分页后 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('PagedAttention: 块级碎片, 永远放得下', c.w / 2 + 8, 22);
      var bx2 = c.w / 2 + 8;
      for (var j = 0; j < cols; j++) {
        var st2 = j < 9 ? 'used' : 'free';
        ctx.fillStyle = st2 === 'used' ? 'rgba(126,231,135,.45)' : 'rgba(139,148,158,.08)';
        ctx.fillRect(bx2 + j * (bw / cols), by, bw / cols - 3, bh);
      }
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('任意 2 个空闲块即可接单', bx2, by + bh + 16);
      /* 结论 */
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('连续批处理负责「何时进来/何时出去」 · 分页负责「进来后放哪里」 —— 互为生死搭档', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 利用率曲线对比 ============ */
  (function () {
    function draw() {
      var c = fit('utilCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 64, y0 = 24, y1 = c.h - 42, xmax = c.w - 24;
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(xmax, y1); ctx.stroke();
      /* 静态线: 均值~40% 波动 */
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var i = 0; i <= 50; i++) {
        var t = i / 50;
        var v = 0.40 + 0.18 * Math.sin(t * 9);
        var x = x0 + t * (xmax - x0);
        var y = y1 - v * (y1 - y0);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* 连续线: 饱和 ~95% */
      ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var k = 0; k <= 50; k++) {
        var tt = k / 50;
        var vv = 0.95 - 0.55 * Math.exp(-tt * 7);
        var xx = x0 + tt * (xmax - x0);
        var yy = y1 - vv * (y1 - y0);
        k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* 标注 */
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('■ 静态批: 木桶效应震荡, 均值 ~40%', x0 + 8, y0 + 14);
      ctx.fillStyle = C.green;
      ctx.fillText('■ 连续批: 稳态饱和 ~95%', x0 + 8, y0 + 30);
      ctx.fillStyle = C.dim;
      ctx.fillText('横轴: 服务时间 →', x0, y1 + 18);
      ctx.fillText('纵轴: token 槽位利用率', 20, y0 + 4 - 12);
      ctx.fillText('95%', x0 - 30, y1 - 0.95 * (y1 - y0));
    }
    draw(); redraws.push(draw);
  })();

})();
