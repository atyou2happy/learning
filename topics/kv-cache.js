/* kv-cache.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 自回归逐词生成 + 显存直线 ============ */
  (function () {
    function draw() {
      var c = fit('lifeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 40, x1 = c.w - 16, ty = 44, n = 12;
      var cw = (x1 - x0) / n;
      for (var i = 0; i < n; i++) {
        var x = x0 + i * cw;
        var done = i < 7;
        ctx.fillStyle = done ? 'rgba(88,166,255,.5)' : 'rgba(139,148,158,.15)';
        ctx.fillRect(x + 1, ty - 14, cw - 4, 28);
        ctx.strokeStyle = done ? C.blue : C.dark;
        ctx.strokeRect(x + 1, ty - 14, cw - 4, 28);
        if (i < 7) {
          ctx.fillStyle = C.blue; ctx.font = FONT;
          ctx.fillText(i === 6 ? '新' : '词', x + cw / 2 - 6, ty + 4);
        }
      }
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('已生成的 token 序列（每一步都要带着全部历史一起算）', x0, ty - 26);
      ctx.fillStyle = C.orange;
      ctx.fillText('下一个词只由「全部历史 + 自己」决定', x0, 82);
      var gy = c.h - 34, gh = c.h - gy - 10, gx = x0, gw = x1 - x0;
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - gh); ctx.lineTo(gx + gw, gy - gh); ctx.stroke();
      for (var g = 1; g <= 3; g++) {
        var yy = gy - gh * g / 4;
        ctx.strokeStyle = 'rgba(48,54,61,.5)';
        ctx.beginPath(); ctx.moveTo(gx, yy); ctx.lineTo(gx + gw, yy); ctx.stroke();
      }
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy - gh); ctx.stroke();
      ctx.lineWidth = 1;
      var px = gx + gw * 7 / 12;
      ctx.fillStyle = C.pink;
      ctx.beginPath(); ctx.arc(px, gy - gh * 7 / 12, 4, 0, 7); ctx.fill();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('每 +1 token = KV +1 行', px - 56, gy - gh * 7 / 12 - 10);
      ctx.fillText('显存随序列长度线性增长 —— 这条直线的斜率就是 KV Cache 的单价', gx + 4, gy + 16);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 为什么缓存的是 K,V 不是 Q ============ */
  (function () {
    function draw() {
      var c = fit('whyKVCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var cols = [
        { name: 'Q', need: false, col: C.orange, fill: 'rgba(255,166,87,.14)' },
        { name: 'K', need: true, col: C.blue, fill: 'rgba(88,166,255,.32)' },
        { name: 'V', need: true, col: C.pink, fill: 'rgba(247,120,186,.28)' }
      ];
      var colW = c.w / 3;
      var rowH = 20;
      var n = 5;
      var y0 = 52;
      cols.forEach(function (col, ci) {
        var cx = ci * colW + colW / 2;
        ctx.fillStyle = col.col;
        ctx.font = 'bold 16.5px monospace';
        ctx.fillText(col.name, cx - 6, 26);
        for (var i = 0; i < n; i++) {
          var y = y0 + i * rowH;
          var hot = (i === n - 1);
          if (col.need || hot) {
            ctx.fillStyle = col.fill;
            ctx.fillRect(cx - 28, y, 56, rowH - 3);
            ctx.strokeStyle = col.col;
            if (!col.need) ctx.strokeStyle = C.orange;
            ctx.strokeRect(cx - 28, y, 56, rowH - 3);
          } else {
            ctx.fillStyle = 'rgba(139,148,158,.1)';
            ctx.fillRect(cx - 28, y, 56, rowH - 3);
            ctx.strokeStyle = C.dark;
            ctx.strokeRect(cx - 28, y, 56, rowH - 3);
          }
        }
        ctx.fillStyle = C.dim; ctx.font = FONT;
        var tag = col.need ? '全部历史都要' : '只有当前 token 的';
        ctx.fillText(tag, cx - 52, y0 + n * rowH + 6);
      });
      /* 公式行 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('score(新词, 第 i 个历史词) = q_new · k_i   →   读全部 K', 10, 22);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('输出 = Σ score_i · v_i   →   读全部 V；而 q_new 用完即弃，无需缓存', 10, 36);
      ctx.fillStyle = C.orange;
      ctx.fillText('生成第 t 个词：Q 只要 1 行，K/V 要 t 行 —— 所以缓存的永远是 K 和 V', 10, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · per-token 尺寸分解 ============ */
  (function () {
    function draw() {
      var c = fit('sizeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 60, x1 = c.w - 120;
      var y0 = 58, y1 = c.h - 26;
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('per-token = 2 (K,V) x layers x kv_heads x head_dim x bytes', x0 - 40, 24);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('LLaMA-7B:  2 x 32 x 32 x 128 x 2B = 512 KB', x0 - 40, 42);
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
      var bw = x1 - x0;
      ctx.fillStyle = 'rgba(88,166,255,.45)';
      ctx.fillRect(x0, y0, bw * 0.5, y1 - y0);
      ctx.strokeStyle = C.blue;
      ctx.strokeRect(x0, y0, bw * 0.5, y1 - y0);
      ctx.fillStyle = 'rgba(247,120,186,.45)';
      ctx.fillRect(x0 + bw * 0.5, y0, bw * 0.5, y1 - y0);
      ctx.strokeStyle = C.pink;
      ctx.strokeRect(x0 + bw * 0.5, y0, bw * 0.5, y1 - y0);
      ctx.fillStyle = C.blue; ctx.font = MONO;
      ctx.fillText('K: 256 KB', x0 + bw * 0.25 - 36, (y0 + y1) / 2);
      ctx.fillStyle = C.pink;
      ctx.fillText('V: 256 KB', x0 + bw * 0.75 - 36, (y0 + y1) / 2);
      ctx.fillStyle = C.green; ctx.font = 'bold 17px monospace';
      ctx.fillText('512 KB', x1 + 12, (y0 + y1) / 2 - 4);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('每 token', x1 + 12, (y0 + y1) / 2 + 12);
      ctx.fillStyle = C.dim;
      ctx.fillText('= 524288 bytes = 262144 个 fp16 数 = 13 万个 4 字节浮点数 —— 全是权重之外的开销', x0, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 模型对比条形图（hover 交互） ============ */
  (function () {
    var bars = [
      { name: 'LLaMA-2-13B (MHA)', kb: 800, col: C.red },
      { name: 'LLaMA-7B (MHA)', kb: 512, col: C.red },
      { name: 'LLaMA-3-70B (GQA-8)', kb: 320, col: C.green },
      { name: 'Qwen3-32B (GQA-8)', kb: 256, col: C.green },
      { name: 'LLaMA-3-8B (GQA-8)', kb: 128, col: C.green }
    ];
    function draw(hover) {
      var c = fit('modelsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var max = 800;
      var bw = c.w - 160;
      var rowH = (c.h - 36) / bars.length;
      bars.forEach(function (b, i) {
        var y = 28 + i * rowH;
        var w = bw * b.kb / max;
        ctx.fillStyle = b.col;
        ctx.fillRect(150, y, w, rowH - 13);
        ctx.fillStyle = C.text;
        ctx.font = FONT;
        ctx.fillText(b.name, 4, y + rowH / 2 - 2);
        ctx.font = MONO;
        ctx.fillStyle = hover === i ? '#ffffff' : b.col;
        ctx.fillText(b.kb + ' KB', 150 + w + 8, y + rowH / 2);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('每 token KV 字节（红 = MHA 无压缩，绿 = GQA；悬停高亮）', 4, 14);
    }
    var cv = document.getElementById('modelsCanvas');
    if (cv) {
      cv.addEventListener('mousemove', function (e) {
        var rect = cv.getBoundingClientRect();
        var my = e.clientY - rect.top;
        var rowH = 164 / bars.length;
        var i = Math.floor((my - 28) / rowH);
        draw(i >= 0 && i < bars.length ? i : -1);
      });
      cv.addEventListener('mouseleave', function () { draw(-1); });
    }
    draw(-1); redraws.push(function () { draw(-1); });
  })();

  /* ============ 图5 · 四个压缩旋钮 ============ */
  (function () {
    function draw() {
      var c = fit('knobsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var defs = [
        { k: 'GQA', d: 'kv_heads 32->8', r: '4x', col: C.green },
        { k: '量化', d: 'bytes 2->1', r: '2x', col: C.blue },
        { k: '滑窗', d: '长度 L->L-w', r: '视窗口', col: C.purple },
        { k: '跨层共享', d: 'layers 减半', r: '2x', col: C.orange }
      ];
      var colW = c.w / 4;
      defs.forEach(function (d, i) {
        var cx = colW * i + colW / 2;
        ctx.strokeStyle = C.dark; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, 56, 22, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
        var ang = Math.PI * 1.5 + (i - 1.5) * 0.4;
        ctx.strokeStyle = d.col; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx, 56);
        ctx.lineTo(cx + 17 * Math.cos(ang), 56 + 17 * Math.sin(ang)); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = d.col; ctx.font = 'bold 14.5px monospace';
        ctx.fillText(d.k, cx - ctx.measureText(d.k).width / 2, 100);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(d.d, cx - ctx.measureText(d.d).width / 2, 120);
        ctx.fillStyle = d.col; ctx.font = 'bold 16.5px monospace';
        ctx.fillText(d.r, cx - ctx.measureText(d.r).width / 2, 148);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('公式里每一个因子都是旋钮，效果相乘：GQA 4x x int8 2x = 8x 压缩', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · GQA 机制示意 ============ */
  (function () {
    function draw() {
      var c = fit('gqaCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { label: 'MHA', y: 40, lit: 8, note: '每个 Q 头配 1 份独立 K/V = 8 份(示意)', gain: '8 份 K/V', col: C.red },
        { label: 'GQA-4', y: 140, lit: 2, note: '每 4 个 Q 头共享 1 份 K/V = 2 份(示意)', gain: '2 份 = 1/4 显存', col: C.green }
      ];
      var qw = 22, gap = 7, qx = 70;
      rows.forEach(function (r) {
        ctx.fillStyle = r.col; ctx.font = 'bold 14.5px monospace';
        ctx.fillText(r.label, 8, r.y + 6);
        for (var i = 0; i < 8; i++) {
          var x = qx + i * (qw + gap);
          ctx.fillStyle = 'rgba(255,166,87,.4)';
          ctx.fillRect(x, r.y - 12, qw, 24);
          ctx.strokeStyle = C.orange; ctx.strokeRect(x, r.y - 12, qw, 24);
        }
        var kx = qx + 8 * (qw + gap) + 34;
        for (var k = 0; k < 8; k++) {
          var xk = kx + k * (qw + gap);
          var on = k < r.lit;
          ctx.fillStyle = on ? 'rgba(88,166,255,.45)' : 'rgba(139,148,158,.08)';
          ctx.fillRect(xk, r.y - 12, qw, 24);
          ctx.strokeStyle = on ? C.blue : C.dark; ctx.strokeRect(xk, r.y - 12, qw, 24);
        }
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.note, qx, r.y + 32);
        ctx.fillStyle = r.col; ctx.font = MONO;
        ctx.fillText(r.gain, kx, r.y + 32);
      });
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('橙 = Query 头(8 个示意)', 8, c.h - 8);
      ctx.fillStyle = C.blue;
      ctx.fillText('蓝 = K/V 组；真实模型 32 Q 头：MHA=32 份，GQA-8=8 份', 160, c.h - 8);
      ctx.fillStyle = C.dim;
      ctx.fillText('Query 头(输入端)', qx, r0label()); 
      function r0label() { return rows[0].y - 26; }
      ctx.fillStyle = C.blue;
      ctx.fillText('K/V 组(缓存端 = 显存)', kxPos(), rows[0].y - 26);
      function kxPos() { return qx + 8 * (qw + gap) + 34; }
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图7 · 容量计算器（交互输入） ============ */
  (function () {
    function fmt(bytes) {
      if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      return Math.round(bytes / 1024) + ' KB';
    }
    function compute() {
      function $(id) { return document.getElementById(id); }
      var layers = +($('kv-layers').value || 32);
      var kvh = +($('kv-kvh').value || 32);
      var dh = +($('kv-dh').value || 128);
      var byt = +($('kv-bytes').value || 2);
      var L = +($('kv-len').value || 2048);
      var gbsize = +($('kv-gpu').value || 80);
      var wgt = +($('kv-weights').value || 26);
      var perTok = 2 * layers * kvh * dh * byt;
      var perSeq = perTok * L;
      var pool = (gbsize - wgt) * 1024 * 1024 * 1024;
      var n = pool > 0 && perSeq > 0 ? Math.floor(pool / perSeq) : 0;
      $('kv-out-per').textContent = fmt(perTok) + ' / token';
      $('kv-out-seq').textContent = fmt(perSeq) + ' / ' + L + ' tokens';
      $('kv-out-n').textContent = pool > 0 ? (n + ' 路并发') : '显存不足';
      $('kv-out-pool').textContent = fmt(Math.max(pool, 0));
      var p1 = Math.min(perSeq / pool * 100, 100);
      $('kv-bar-seq').style.width = Math.max(p1, 0.5) + '%';
      var p2 = Math.min(n * perSeq / pool * 100, 100);
      $('kv-bar-n').style.width = Math.max(p2, 0.5) + '%';
    }
    ['kv-layers', 'kv-kvh', 'kv-dh', 'kv-bytes', 'kv-len', 'kv-gpu', 'kv-weights'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', compute);
    });
    compute();
  })();

})();
