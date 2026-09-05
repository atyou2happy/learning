/* pagedattention.js — 全部交互演示（node --check 可直接校验） */
(function () {
  'use strict';

  var C = {
    blue: '#58a6ff', pink: '#f778ba', green: '#7ee787',
    orange: '#ffa657', purple: '#a371f7', red: '#f85149',
    dim: '#8b949e', dark: '#30363d', bg: '#0a0d12'
  };

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

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function arrow(ctx, x1, y1, x2, y2, col) {
    ctx.strokeStyle = col || C.dim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = col || C.dim;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1;
  }

  var redraws = [];
  window.addEventListener('resize', function () {
    redraws.forEach(function (fn) { fn(); });
  });

  /* ============ 图1 · 一个请求的一生 ============ */
  (function () {
    function draw() {
      var c = fit('lifeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 46, x1 = c.w - 20, y = 52, L = 28, prompt = 10;
      /* 轴 */
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      /* prompt 段 */
      var pw = (x1 - x0) * prompt / L;
      ctx.fillStyle = 'rgba(88,166,255,.25)';
      ctx.fillRect(x0, y - 15, pw, 30);
      ctx.strokeStyle = C.blue;
      ctx.strokeRect(x0, y - 15, pw, 30);
      /* 生成段 */
      for (var i = prompt; i < L; i++) {
        var bx = x0 + (x1 - x0) * i / L;
        ctx.fillStyle = (i === L - 1) ? C.orange : 'rgba(255,166,87,.45)';
        ctx.fillRect(bx, y - 15, (x1 - x0) / L - 2, 30);
      }
      ctx.fillStyle = C.blue; ctx.font = '11px sans-serif';
      ctx.fillText('prompt 预填充 (一次性写入 KV)', x0 + 2, y - 24);
      ctx.fillStyle = C.orange;
      ctx.fillText('逐 token 生成 (每步追加 KV)', x0 + (x1 - x0) * 0.52, y - 24);
      /* KV 增长折线 */
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y + 40);
      ctx.lineTo(x1, y + 40 + (c.h - y - 66));
      ctx.stroke(); ctx.lineWidth = 1;
      var steps = 6;
      for (var s = 0; s <= steps; s++) {
        var px = x0 + (x1 - x0) * s / steps;
        var py = y + 40 + (c.h - y - 66) * s / steps;
        ctx.fillStyle = C.pink;
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.fillStyle = C.pink; ctx.font = '12px monospace';
      ctx.fillText('KV Cache 占用 = c · ℓ  (每 token 恒定增量 c)', x0 + 8, c.h - 12);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('token →', x1 - 52, y + 18);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 无缓存 O(L^2) 重算 ============ */
  (function () {
    function draw() {
      var c = fit('recomputeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var n = 5, x0 = 60, top = 30, bot = c.h - 44;
      var cell = (c.w - x0 - 24) / n;
      for (var t = 1; t <= n; t++) {
        var x = x0 + (t - 1) * cell;
        var hh = (t / n) * (bot - top);
        ctx.fillStyle = (t === n) ? 'rgba(248,81,73,.8)' : 'rgba(247,120,186,.45)';
        ctx.fillRect(x + 6, bot - hh, cell - 14, hh);
        ctx.strokeStyle = (t === n) ? C.red : C.pink;
        ctx.strokeRect(x + 6, bot - hh, cell - 14, hh);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace'; ctx.textAlign = 'center';
        ctx.fillText('t=' + t, x + cell / 2 - 4, bot + 16);
        ctx.fillStyle = (t === n) ? C.red : C.pink; ctx.font = 'bold 12px monospace';
        ctx.fillText(String(t), x + cell / 2 - 4, bot - hh - 6);
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('总重算 = 1+2+…+L = L(L+1)/2 ∈ O(L²)', x0, c.h - 12);
      ctx.save();
      ctx.translate(14, (top + bot) / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('该步重算的 K/V 行数', 0, 0);
      ctx.restore();
      ctx.fillStyle = C.red; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('生成第 3 个词 → 前 2 个词的 K/V 全部白算一遍', x0, 18);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 有缓存: 只算增量 ============ */
  (function () {
    function draw() {
      var c = fit('kvCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var half = c.w / 2;
      /* 左: K/V 矩阵 */
      var rows = 7, rh = Math.min(22, (c.h - 60) / rows - 4), kx = 12, y0 = 34;
      ctx.fillStyle = C.dim; ctx.font = '10px monospace';
      ctx.fillText('K (ℓ×d)', kx, y0 - 8);
      ctx.fillText('V (ℓ×d)', kx + half * 0.52, y0 - 8);
      for (var i = 0; i < rows; i++) {
        var y = y0 + i * (rh + 4);
        var alpha = i < 4 ? 0.65 : 0.15;
        var isNew = (i === 4);
        ctx.fillStyle = isNew ? C.orange : 'rgba(88,166,255,' + alpha + ')';
        ctx.fillRect(kx, y, half * 0.42, rh);
        ctx.fillStyle = isNew ? C.orange : 'rgba(247,120,186,' + alpha + ')';
        ctx.fillRect(kx + half * 0.52, y, half * 0.42, rh);
        if (isNew) {
          ctx.fillStyle = C.orange; ctx.font = 'bold 10px monospace';
          ctx.fillText('← 本步只算这一行', kx + 6, y + rh - 6);
        }
      }
      ctx.fillStyle = C.green; ctx.font = '11px monospace';
      ctx.fillText('缓存命中: 前 4 行直接读', kx, y0 + rows * (rh + 4) + 16);
      /* 右: 显存线性增长 */
      var gx = half + 30, gy0 = 30, gx1 = c.w - 16, gy1 = c.h - 34;
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(gx, gy0); ctx.lineTo(gx, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx, gy1); ctx.lineTo(gx1, gy0 + 10); ctx.stroke();
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach(function (k) {
        var x = gx + k * (gx1 - gx);
        var hh = k * (gy1 - gy0 - 10);
        ctx.fillStyle = 'rgba(247,120,186,.28)';
        ctx.fillRect(x - 7, gy1 - hh, 14, hh);
        ctx.fillStyle = C.dim; ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillText(String(Math.round(k * 4096)), x, gy1 + 13);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = C.dim; ctx.font = '10px monospace';
      ctx.fillText('序列长度 L →', gx + (gx1 - gx) / 2 - 30, gy1 + 26);
      ctx.fillStyle = C.pink; ctx.font = '11px monospace';
      ctx.fillText('显存 = 2·n_layers·n_kv·d_head·L·b', gx + 6, gy0 + 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ DEMO · 三策略模拟器 (已数值验证) ============ */
  (function () {
    var POOL = 100, MAX = 30, BLOCK = 4, NB = POOL / BLOCK;
    var SEQ = { G: { len: 24 }, A: { len: 10 }, H: { len: 24 }, B: { len: 12 }, D: { len: 28 }, E: { len: 22 } };
    var SCENES = [
      { arr: ['G'] }, { arr: ['A'] }, { arr: ['H'] },
      { arr: ['B'] }, { arr: ['D'] }, { fin: ['A', 'B'] }, { arr: ['E'] }
    ];
    var COLORS = { A: '#58a6ff', B: '#f778ba', G: '#7ee787', H: '#ffa657', D: '#a371f7', E: '#79c0ff' };

    function firstFit(map, need) {
      var run = 0;
      for (var i = 0; i < POOL; i++) {
        if (map[i] === null) { run++; if (run >= need) return i - need + 1; } else { run = 0; }
      }
      return -1;
    }

    var states = [];
    (function simulate() {
      var res = { cells: POOLfill(null), resv: POOLfill(null), live: [], log: [] };
      var con = { cells: POOLfill(null), live: [], log: [] };
      var pag = { blocks: NBfill(null), alloc: {}, live: [], log: [] };
      function POOLfill(v) { var a = []; for (var i = 0; i < POOL; i++) a.push(v); return a; }
      function NBfill(v) { var a = []; for (var i = 0; i < NB; i++) a.push(v); return a; }
      SCENES.forEach(function (sc, si) {
        (sc.fin || []).forEach(function (n) {
          for (var i = 0; i < POOL; i++) {
            if (res.resv[i] === n) { res.cells[i] = null; res.resv[i] = null; }
            if (con.cells[i] === n) con.cells[i] = null;
          }
          (pag.alloc[n] || []).forEach(function (b) { pag.blocks[b] = null; });
          delete pag.alloc[n];
          res.live = res.live.filter(function (x) { return x !== n; });
          con.live = con.live.filter(function (x) { return x !== n; });
          pag.live = pag.live.filter(function (x) { return x !== n; });
        });
        (sc.arr || []).forEach(function (n) {
          var p = firstFit(res.cells.map(function (cc, i) {
            return (cc === null && res.resv[i] === null) ? null : 'X';
          }), MAX);
          if (p < 0) {
            res.log.push('S' + (si + 1) + ' ' + n + '(' + SEQ[n].len + ') 拒绝: 无法预留 30');
          } else {
            for (var i = p; i < p + MAX; i++) res.resv[i] = n;
            for (var i2 = p; i2 < p + SEQ[n].len; i2++) res.cells[i2] = n;
            res.live.push(n);
            res.log.push('S' + (si + 1) + ' ' + n + ' 预留 30 实用 ' + SEQ[n].len);
          }
          p = firstFit(con.cells, SEQ[n].len);
          if (p < 0) {
            var free = 0, mx = 0, run = 0;
            for (var i3 = 0; i3 < POOL; i3++) {
              if (con.cells[i3] === null) { free++; run++; if (run > mx) mx = run; } else { run = 0; }
            }
            con.log.push('S' + (si + 1) + ' ' + n + '(' + SEQ[n].len + ') 卡死: 空闲 ' + free + ' 但最大连续段 ' + mx);
          } else {
            for (var i4 = p; i4 < p + SEQ[n].len; i4++) con.cells[i4] = n;
            con.live.push(n);
            con.log.push('S' + (si + 1) + ' ' + n + ' 连续 [' + p + ',' + (p + SEQ[n].len) + ')');
          }
          var need = Math.ceil(SEQ[n].len / BLOCK), got = [];
          for (var b = 0; b < NB && got.length < need; b++) {
            if (pag.blocks[b] === null) { pag.blocks[b] = n; got.push(b); }
          }
          if (got.length < need) {
            got.forEach(function (b2) { pag.blocks[b2] = null; });
            pag.log.push('S' + (si + 1) + ' ' + n + ' 拒绝');
          } else {
            pag.alloc[n] = got; pag.live.push(n);
            var used = SEQ[n].len - (got.length - 1) * BLOCK;
            pag.log.push('S' + (si + 1) + ' ' + n + ' 得块 ' + got.join(',') + ' (末块 ' + used + '/4)');
          }
        });
        states.push({
          res: { cells: res.cells.slice(), resv: res.resv.slice(), live: res.live.slice(), log: res.log.slice() },
          con: { cells: con.cells.slice(), live: con.live.slice(), log: con.log.slice() },
          pag: { blocks: pag.blocks.slice(), alloc: JSON.parse(JSON.stringify(pag.alloc)), live: pag.live.slice(), log: pag.log.slice() }
        });
      });
    })();

    var sceneIdx = 0;

    function cellEl(owner, extra) {
      var d = document.createElement('div');
      d.className = 'cell';
      if (owner) {
        d.style.background = COLORS[owner] || C.dark;
        d.title = owner;
      } else if (extra) {
        d.className = 'cell resv';
        d.style.borderColor = COLORS[extra];
        d.title = extra + ' 预留未用';
      } else {
        d.className = 'cell free';
      }
      return d;
    }

    function renderBar(el, cells, resv) {
      el.innerHTML = '';
      for (var i = 0; i < POOL; i++) el.appendChild(cellEl(cells[i], resv ? resv[i] : null));
    }

    function renderBlocks(el, blocks) {
      el.innerHTML = '';
      for (var b = 0; b < NB; b++) {
        var d = document.createElement('div');
        d.className = 'cell';
        if (blocks[b]) { d.style.background = COLORS[blocks[b]]; d.title = blocks[b] + ' 物理块' + b; }
        else { d.className = 'cell free'; }
        el.appendChild(d);
      }
    }

    function renderMeta(el, live, log) {
      var html = live.length ? '在住: <b>' + live.join(' ') + '</b>' : '<b>空</b>';
      var last = log[log.length - 1];
      if (last) html += ' &nbsp;|&nbsp; 最新: <span class="warn">' + last + '</span>';
      var rj = log.filter(function (l) { return l.indexOf('拒绝') >= 0 || l.indexOf('卡死') >= 0; });
      if (rj.length) {
        html += ' &nbsp;|&nbsp; <span class="bad">被拒: ' + rj.map(function (l) { return l.split(' ')[1]; }).join(' ') + '</span>';
      }
      el.innerHTML = html;
    }

    function draw() {
      var s = states[sceneIdx];
      renderBar(document.getElementById('bar1'), s.res.cells, s.res.resv);
      renderMeta(document.getElementById('meta1'), s.res.live, s.res.log);
      renderBar(document.getElementById('bar2'), s.con.cells, null);
      renderMeta(document.getElementById('meta2'), s.con.live, s.con.log);
      renderBlocks(document.getElementById('bar3'), s.pag.blocks);
      renderMeta(document.getElementById('meta3'), s.pag.live, s.pag.log);
    }

    document.querySelectorAll('.scenebtn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sceneIdx = parseInt(btn.getAttribute('data-scene'), 10) - 1;
        document.querySelectorAll('.scenebtn').forEach(function (b2) { b2.classList.remove('on'); });
        btn.classList.add('on');
        draw();
      });
    });
    draw();
  })();

  /* ============ 图4 · 逻辑块 → 块表 → 物理块 ============ */
  (function () {
    function draw() {
      var c = fit('blockTableCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var map = [7, 2, 9, 14, 5];
      var cols = 5, rows = 3;
      var lbW = 110, gap = 26, lbX = 16, rowH = 34, rowGap = 10, y0 = 44;
      /* 标题 */
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = C.blue; ctx.fillText('逻辑视图 (连续)', lbX, 22);
      ctx.fillStyle = C.orange; ctx.fillText('块表', lbX + lbW + gap, 22);
      ctx.fillStyle = C.green; ctx.fillText('物理块池 (离散)', lbX + lbW * 2 + gap * 3, 22);
      /* 物理块网格 */
      var poolX = lbX + lbW * 2 + gap * 3, poolW = c.w - poolX - 10;
      var pw = Math.min(78, (poolW - (cols - 1) * 8) / cols);
      for (var i = 0; i < map.length; i++) {
        var y = y0 + i * (rowH + rowGap);
        /* 逻辑块 */
        ctx.fillStyle = 'rgba(88,166,255,.18)'; ctx.strokeStyle = C.blue;
        roundRect(ctx, lbX, y, lbW, rowH, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.blue; ctx.font = '12px monospace';
        ctx.fillText('逻辑块 ' + i, lbX + 12, y + 21);
        /* 块表 */
        var bx = lbX + lbW + gap;
        ctx.fillStyle = 'rgba(210,153,34,.15)'; ctx.strokeStyle = C.orange;
        roundRect(ctx, bx, y, lbW * 0.7, rowH, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.orange; ctx.font = '12px monospace';
        ctx.fillText('→ 块 ' + map[i], bx + 14, y + 21);
        /* 物理块 */
        var phys = map[i];
        var px = poolX + (phys % cols) * (pw + 8);
        var py = y0 + Math.floor(phys / cols) * (rowH + rowGap);
        ctx.fillStyle = 'rgba(126,231,135,.2)'; ctx.strokeStyle = C.green;
        roundRect(ctx, px, py, pw, rowH, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.green; ctx.font = '11px monospace';
        ctx.fillText('物理 ' + phys, px + 8, py + 21);
        /* 连线 */
        ctx.strokeStyle = 'rgba(139,148,158,.5)'; ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(bx + lbW * 0.7, y + rowH / 2);
        ctx.bezierCurveTo(bx + lbW * 0.7 + 30, y + rowH / 2, px - 30, py + rowH / 2, px, py + rowH / 2);
        ctx.stroke(); ctx.setLineDash([]);
      }
      /* 空闲物理块 */
      for (var k = 0; k < 15; k++) {
        if (map.indexOf(k) >= 0) continue;
        var kx = poolX + (k % cols) * (pw + 8);
        var ky = y0 + Math.floor(k / cols) * (rowH + rowGap);
        ctx.strokeStyle = C.dark;
        roundRect(ctx, kx, ky, pw, rowH, 6); ctx.stroke();
        ctx.fillStyle = C.dark; ctx.font = '11px monospace';
        ctx.fillText('空闲', kx + 8, ky + 21);
      }
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · decode 一步流程图 ============ */
  (function () {
    function draw() {
      var c = fit('flowCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var B = [
        { x: .03, y: .06, w: .19, h: .16, t: '新 token q', col: C.blue },
        { x: .28, y: .06, w: .16, h: .16, t: '读块表', col: C.orange },
        { x: .50, y: .06, w: .20, h: .16, t: '逐物理块\ngather K/V', col: C.green },
        { x: .76, y: .06, w: .21, h: .16, t: 'attention\n(q,K,V)', col: C.pink },
        { x: .76, y: .34, w: .21, h: .16, t: '采样出 y', col: C.blue },
        { x: .50, y: .34, w: .20, h: .16, t: '算 K,V', col: C.green },
        { x: .28, y: .34, w: .16, h: .16, t: '末块有\n空位?', col: C.orange },
        { x: .03, y: .34, w: .19, h: .16, t: '写入末块', col: C.green },
        { x: .28, y: .64, w: .16, h: .18, t: '申请新物理块\n更新块表', col: C.orange },
        { x: .55, y: .64, w: .18, h: .18, t: '继续下一步', col: C.dim }
      ];
      B.forEach(function (b) {
        var x = b.x * c.w, y = b.y * c.h, w = b.w * c.w, h = b.h * c.h;
        ctx.fillStyle = 'rgba(88,166,255,.07)'; ctx.strokeStyle = b.col;
        roundRect(ctx, x, y, w, h, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = b.col; ctx.font = '12px sans-serif';
        var lines = b.t.split('\n');
        lines.forEach(function (ln, li) {
          ctx.fillText(ln, x + 10, y + h / 2 + 4 + (li - (lines.length - 1) / 2) * 15);
        });
      });
      function ctr(b) { return [b.x * c.w + b.w * c.w / 2, b.y * c.h + b.h * c.h / 2]; }
      function edgeR(b) { return [(b.x + b.w) * c.w, (b.y + b.h / 2) * c.h]; }
      function edgeL(b) { return [b.x * c.w, (b.y + b.h / 2) * c.h]; }
      function edgeB(b) { return [(b.x + b.w / 2) * c.w, (b.y + b.h) * c.h]; }
      function edgeT(b) { return [(b.x + b.w / 2) * c.w, b.y * c.h]; }
      var a;
      a = edgeR(B[0]); arrow(ctx, a[0], a[1], edgeL(B[1])[0], edgeL(B[1])[1]);
      a = edgeR(B[1]); arrow(ctx, a[0], a[1], edgeL(B[2])[0], edgeL(B[2])[1]);
      a = edgeR(B[2]); arrow(ctx, a[0], a[1], edgeL(B[3])[0], edgeL(B[3])[1]);
      a = edgeB(B[3]); arrow(ctx, a[0], a[1], edgeT(B[4])[0], edgeT(B[4])[1]);
      a = edgeL(B[4]); arrow(ctx, a[0], a[1], edgeR(B[5])[0], edgeR(B[5])[1]);
      a = edgeL(B[5]); arrow(ctx, a[0], a[1], edgeR(B[6])[0], edgeR(B[6])[1]);
      a = edgeL(B[6]); arrow(ctx, a[0], a[1], edgeR(B[7])[0], edgeR(B[7])[1], C.green);
      ctx.fillStyle = C.green; ctx.font = '11px monospace';
      ctx.fillText('是', (B[6].x - 0.03) * c.w, (B[6].y + 0.08) * c.h);
      a = edgeB(B[6]); arrow(ctx, a[0], a[1], edgeT(B[8])[0], edgeT(B[8])[1], C.orange);
      ctx.fillStyle = C.orange;
      ctx.fillText('否', (B[6].x + 0.09) * c.w, (B[6].y + B[6].h + 0.02) * c.h);
      a = edgeR(B[8]); arrow(ctx, a[0], a[1], edgeL(B[9])[0], edgeL(B[9])[1]);
      /* 循环回起点 */
      var t = edgeT(B[9]);
      ctx.strokeStyle = 'rgba(139,148,158,.45)'; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(t[0], t[1]);
      ctx.bezierCurveTo(t[0], 8, 40, 8, edgeT(B[0])[0], edgeT(B[0])[1] - 2);
      ctx.stroke(); ctx.setLineDash([]);
      arrow(ctx, 40, 10, edgeT(B[0])[0], edgeT(B[0])[1], 'rgba(139,148,158,.45)');
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · prefix 共享对比 ============ */
  (function () {
    function draw() {
      var c = fit('prefixCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var nCell = 18, cw = (c.w - 28 - (nCell - 1) * 3) / nCell;
      var rows = [
        { y: 42, shared: false },
        { y: 132, shared: true }
      ];
      rows.forEach(function (r) {
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(r.shared ? '开启共享: system 前缀只存 1 份' : '无共享: 3 个请求各存 1 份完整前缀', 14, r.y - 12);
        var total = r.shared ? 10 : 18;
        for (var i = 0; i < total; i++) {
          var x = 14 + i * (cw + 3);
          var isPre = r.shared ? (i < 4) : (i % 6 < 4);
          ctx.fillStyle = isPre ? 'rgba(163,113,247,.6)' : 'rgba(88,166,255,.42)';
          ctx.fillRect(x, r.y, cw, 54);
          ctx.strokeStyle = isPre ? C.purple : C.blue;
          ctx.strokeRect(x, r.y, cw, 54);
        }
        ctx.font = 'bold 13px monospace';
        if (r.shared) {
          ctx.fillStyle = C.green;
          ctx.fillText('10 块  ← 省 8 块 (44%)', 14 + 10 * (cw + 3) + 10, r.y + 32);
        } else {
          ctx.fillStyle = C.dim;
          ctx.fillText('18 块', 14 + 18 * (cw + 3) + 10, r.y + 32);
        }
      });
      ctx.fillStyle = C.purple; ctx.font = '11px sans-serif';
      ctx.fillText('■ 紫色 = 共享 system prompt 块', 14, 22);
      ctx.fillStyle = C.blue;
      ctx.fillText('■ 蓝色 = 各请求私有块', 220, 22);
    }
    draw(); redraws.push(draw);
  })();
})();
