/* diffusion.js — 全部交互演示（node --check 可直接校验） */
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

  /* 伪随机 (确定性, 供噪点与图像图案) */
  function rand(seed) {
    var s = seed;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /* Chinchilla 风格 abar: 线性 beta 1e-4->0.02 T=1000 */
  function abarLinear(t) {
    var T = 1000, b0 = 1e-4, b1 = 0.02, acc = 1;
    for (var i = 0; i < t; i++) {
      var b = b0 + (b1 - b0) * i / (T - 1);
      acc *= (1 - b);
    }
    return acc;
  }

  var redraws = [];
  window.addEventListener('resize', function () {
    redraws.forEach(function (fn) { fn(); });
  });

  /* ============ 图1 · 加噪滑块 (核心交互) ============ */
  (function () {
    var t = 400;
    /* 画一个"猫"的图案: 圆头+耳朵+胡须, 8x8 像素块风格 */
    function drawCat(ctx, ox, oy, size) {
      var px = size / 8;
      var r = rand(42);
      for (var yy = 0; yy < 8; yy++) {
        for (var xx = 0; xx < 8; xx++) {
          /* 猫形 mask */
          var edge = (yy === 1 && (xx === 0 || xx === 7)) ||
                     (yy >= 2 && yy <= 6 && xx >= 1 && xx <= 6);
          var inner = (yy === 3 && (xx === 2 || xx === 5)) ||
                      (yy === 4 && xx >= 2 && xx <= 5) ||
                      (yy === 5 && (xx === 3 || xx === 4));
          var isCat = edge || inner;
          var v = isCat ? 0.85 : 0.1;
          ctx.fillStyle = 'rgba(126,231,135,' + v * 0.55 + ')';
          ctx.fillRect(ox + xx * px, oy + yy * px, px - 1, px - 1);
        }
      }
    }
    function draw() {
      var c = fit('noiseCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var N = 6;
      var size = Math.min(84, (c.w - 80) / N - 10);
      for (var k = 0; k < N; k++) {
        var tt = Math.round(k / (N - 1) * 999);
        var ox = 40 + k * (size + 18);
        var oy = 34;
        /* abar 混合 */
        var ab = abarLinear(tt);
        var sig = Math.sqrt(ab);
        var noi = Math.sqrt(1 - ab);
        /* 背景: 噪声部分 */
        var r = rand(tt + 7);
        for (var gy = 0; gy < 8; gy++) {
          for (var gx = 0; gx < 8; gx++) {
            var nv = r();
            ctx.fillStyle = 'rgba(139,148,158,' + (nv * noi * 0.75) + ')';
            ctx.fillRect(ox + gx * size / 8, oy + gy * size / 8, size / 8 - 1, size / 8 - 1);
          }
        }
        /* 前景: 猫按信号权重 */
        if (sig > 0.02) drawCat(ctx, ox, oy, size * sig * 0.0 + size);
        /* 高亮当前滑块位置 */
        var dist = Math.abs(tt - t);
        if (dist < 85) {
          ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5;
          ctx.strokeRect(ox - 4, oy - 4, size + 8, size + 8);
          ctx.lineWidth = 1;
        }
        /* 标注 */
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText('t=' + tt, ox + size / 2 - 16, oy + size + 16);
        ctx.fillStyle = sig > 0.5 ? C.green : (sig > 0.1 ? C.orange : C.red);
        ctx.fillText('信号 ' + (sig * 100).toFixed(0) + '%', ox + size / 2 - 26, oy + size + 30);
      }
      /* 当前 t 的大图 */
      var bigX = c.w - 130, bigY = 40, bigS = 96;
      var ab2 = abarLinear(t);
      var r2 = rand(t + 7);
      for (var by = 0; by < 8; by++) {
        for (var bx = 0; bx < 8; bx++) {
          var nv2 = r2();
          ctx.fillStyle = 'rgba(139,148,158,' + (nv2 * Math.sqrt(1 - ab2) * 0.8) + ')';
          ctx.fillRect(bigX + bx * bigS / 8, bigY + by * bigS / 8, bigS / 8 - 1, bigS / 8 - 1);
        }
      }
      ctx.globalAlpha = Math.sqrt(ab2);
      drawCat(ctx, bigX, bigY, bigS);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2;
      ctx.strokeRect(bigX - 4, bigY - 4, bigS + 8, bigS + 8);
      ctx.lineWidth = 1;
      ctx.fillStyle = C.pink; ctx.font = MONO;
      ctx.fillText('x_' + t, bigX + 4, bigY - 10);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('x_t = √ᾱ·x₀ + √(1−ᾱ)·ε', 16, c.h - 26);
      ctx.fillStyle = C.dim;
      ctx.fillText('拖滑块: 同一张猫图在不同 t 的样子 — 橙框跟随 · 生成 = 从最右走回最左', 16, c.h - 8);
    }
    var slider = document.getElementById('tSlider');
    var lbl = document.getElementById('tLabel');
    if (slider) slider.addEventListener('input', function () {
      t = parseInt(slider.value, 10);
      if (lbl) lbl.textContent = 't=' + t;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 噪声调度曲线 ============ */
  (function () {
    function abarCos(s, t) {
      var T = 1000;
      return Math.pow(Math.cos(((t / T + s) / (1 + s)) * Math.PI / 2), 2);
    }
    function draw() {
      var c = fit('schedCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 56, y0 = c.h - 40, x1 = c.w - 24, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('ᾱ_t', 12, y1 + 8);
      ctx.fillText('t →', x1 - 30, c.h - 12);
      [0, 0.25, 0.5, 0.75, 1.0].forEach(function (v) {
        var y = y0 - v * (y0 - y1);
        ctx.strokeStyle = 'rgba(139,148,158,.12)';
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.fillStyle = C.dim;
        ctx.fillText(v.toFixed(2), x0 - 34, y + 4);
      });
      [0, 250, 500, 750, 1000].forEach(function (t) {
        ctx.fillStyle = C.dim;
        ctx.fillText('' + t, x0 + t / 1000 * (x1 - x0) - 14, y0 + 16);
      });
      /* linear */
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var t = 0; t <= 1000; t += 20) {
        var X = x0 + t / 1000 * (x1 - x0);
        var Y = y0 - abarLinear(t) * (y0 - y1);
        if (t === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      /* cosine */
      ctx.strokeStyle = C.green;
      ctx.beginPath();
      for (var t2 = 0; t2 <= 1000; t2 += 20) {
        var X2 = x0 + t2 / 1000 * (x1 - x0);
        var Y2 = y0 - abarCos(0.008, t2) * (y0 - y1);
        if (t2 === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('linear β: 末端砸得太快', x0 + 60, y1 + 40);
      ctx.fillStyle = C.green;
      ctx.fillText('cosine: 中段平缓 — 每步任务量均匀', x0 + 60, y1 + 60);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('ᾱ = ∏(1−β): 信号保留率 — 曲线决定网络每一步要剥多少噪声', x0, y0 + 32);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 去噪网络 ============ */
  (function () {
    function draw() {
      var c = fit('denoiseCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 循环: x_t + t + prompt -> 网络 -> eps -> 剥掉 */
      var bx = 30, by = c.h / 2 - 50, bw = 150, bh = 100;
      ctx.fillStyle = 'rgba(163,113,247,.15)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = C.purple; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = C.purple; ctx.font = 'bold 13px monospace';
      ctx.fillText('ε-网络', bx + 42, by + 28);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('输入: x_t, t, prompt', bx + 16, by + 54);
      ctx.fillText('输出: 预测的噪声 ε', bx + 24, by + 76);
      /* 输入 */
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('x_t →', 2, by + 50);
      /* 输出与剥除 */
      var rx = bx + bw + 30;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(bx + bw + 2, by + 50); ctx.lineTo(rx - 6, by + 50); ctx.stroke();
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('ε̂', rx, by + 44);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('→ x_{t-1} = (x_t − β·ε̂/√(1−ᾱ))/√(1−β) + σz', rx + 24, by + 54);
      /* 关键句 */
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('网络从不生成图像 — 它只学一件事: 「这里混了多少噪声」', 16, 30);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('训练: 拿干净图自己加噪再让网络猜 ε (监督信号是已知噪声 — 又一种「免费教材」)', 16, c.h - 30);
      ctx.fillText('生成: 从纯噪声出发, 剥一千次 — 每次 ε̂ 都把画面拉向「数据分布里合理的样子」', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · CFG 引导滑块 (核心交互) ============ */
  (function () {
    var w = 7;
    function draw() {
      var c = fit('cfgCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var labels = [
        { n: 'w=1 无引导', d: '听话但平淡', col: C.dim },
        { n: 'w=' + w, d: w <= 4 ? '弱引导' : (w <= 8 ? '平衡区' : '过度引导'), col: w <= 4 ? C.blue : (w <= 8 ? C.green : C.red) },
        { n: 'w=15 过强', d: '伪影/饱和', col: C.red }
      ];
      labels.forEach(function (L, i) {
        var x = 30 + i * (c.w - 60) / 3;
        var bw = (c.w - 60) / 3 - 20;
        ctx.fillStyle = L.col + '18';
        ctx.fillRect(x, 36, bw, 110);
        ctx.strokeStyle = L.col;
        ctx.lineWidth = i === 1 ? 2.5 : 1;
        ctx.strokeRect(x, 36, bw, 110);
        ctx.lineWidth = 1;
        ctx.fillStyle = L.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(L.n, x + 14, 60);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(L.d, x + 14, 84);
        var sat = i === 0 ? 0.25 : (i === 1 ? Math.min(0.55, w / 14 + 0.25) : 0.95);
        ctx.fillStyle = 'rgba(247,120,186,' + sat * 0.6 + ')';
        ctx.fillRect(x + 14, 100, bw - 28, 30);
        if (i === 2) {
          ctx.strokeStyle = C.red;
          for (var z = 0; z < 4; z++) {
            ctx.beginPath();
            ctx.moveTo(x + 14, 106 + z * 8);
            ctx.lineTo(x + bw - 14, 104 + z * 8);
            ctx.stroke();
          }
        }
      });
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('eps_cfg = eps_uncond + w*(eps_cond - eps_uncond)', 30, 172);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('条件与无条件之差 = 「prompt 的方向」— w 是沿这个方向推多远 · 训练时 10% 随机丢 prompt 学无条件', 16, c.h - 10);
    }
    var slider = document.getElementById('cfgSlider');
    var lbl = document.getElementById('cfgLabel');
    if (slider) slider.addEventListener('input', function () {
      w = parseInt(slider.value, 10);
      if (lbl) lbl.textContent = 'w=' + w;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 家族树 + 两范式对照 ============ */
  (function () {
    function draw() {
      var c = fit('familyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var gens = [
        { n: 'SD1.5 (2022)', d: 'U-Net 860M|+ CLIP 引导', col: C.dim },
        { n: 'SDXL (2023)', d: 'U-Net 2.6B|更大分辨率', col: C.blue },
        { n: 'SD3/Flux (2024)', d: 'DiT + 流匹配|T5 文本编码', col: C.green },
        { n: 'Sora/Veo (2024-26)', d: '时空 patch DiT|视频=3D token', col: C.orange },
        { n: '扩散LLM (2025-26)', d: 'LLaDA/Mercury|并行出 token', col: C.pink }
      ];
      gens.forEach(function (g, i) {
        var x = 16 + i * (c.w - 32) / 5;
        var bw = (c.w - 32) / 5 - 10;
        ctx.fillStyle = g.col + '18';
        ctx.fillRect(x, 26, bw, 84);
        ctx.strokeStyle = g.col; ctx.strokeRect(x, 26, bw, 84);
        ctx.fillStyle = g.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(g.n, x + 8, 46);
        g.d.split('|').forEach(function (ln, j) {
          ctx.fillStyle = C.dim; ctx.font = '11.5px sans-serif';
          ctx.fillText(ln, x + 8, 68 + j * 16);
        });
        if (i < 4) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + bw + 1, 68); ctx.lineTo(x + bw + 9, 68); ctx.stroke();
        }
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('自回归 vs 扩散: 文本与图像的不同选择', 16, 136);
      var rows = [
        ['生成方式', '逐 token 串行', '全图并行迭代'],
        ['注意力', '因果掩码 (只见前文)', '双向 (全局同时看)'],
        ['KV Cache', '可用 (推理便宜)', '不可用 (每步重算)'],
        ['天生优势', '离散序列 · 可流式', '连续像素 · 一步出全局'],
        ['2026 现状', 'LLM 主流', '图像/视频主流; 文本在追赶 (>1000 tok/s)']
      ];
      rows.forEach(function (r, i) {
        var y = 152 + i * 18;
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(r[0], 22, y);
        ctx.fillStyle = i % 2 ? C.green : C.blue; ctx.font = '11.5px sans-serif';
        ctx.fillText(r[1], 120, y);
        ctx.fillStyle = i % 2 ? C.pink : C.orange;
        ctx.fillText(r[2], 420, y);
      });
    }
    draw(); redraws.push(draw);
  })();

})();
