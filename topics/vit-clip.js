/* vit-clip.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 图像 vs token 序列的鸿沟 ============ */
  (function () {
    function draw() {
      var c = fit('gapCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('左边是模型想要的 · 右边是图像给的', 16, 20);
      /* 左: token 序列 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('Transformer 吃:', 16, 44);
      var tokColors = [C.blue, C.green, C.orange, C.purple, C.pink];
      for (var i = 0; i < 8; i++) {
        ctx.fillStyle = tokColors[i % 5] + '66';
        ctx.fillRect(16, 54 + i * 0, 0, 0);
      }
      var tx = 16;
      ['今','天','天','气','真','好','[SEP]','图?'].forEach(function (t, i) {
        var w = t === '图?' ? 34 : 26;
        ctx.fillStyle = (t === '图?' ? C.red : tokColors[i % 5]) + '44';
        ctx.fillRect(tx, 58, w, 26);
        ctx.strokeStyle = t === '图?' ? C.red : tokColors[i % 5];
        ctx.strokeRect(tx, 58, w, 26);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(t, tx + 6, 76);
        tx += w + 6;
      });
      /* 右: 像素立方体 */
      var rx = c.w / 2 + 40;
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('图像给的是:', rx, 44);
      /* 画一个像素网格立方体示意 */
      var gx = rx + 10, gy = 66, cell = 12;
      for (var yy = 0; yy < 6; yy++) {
        for (var xx = 0; xx < 6; xx++) {
          var v = (xx * 3 + yy * 5) % 11 / 11;
          ctx.fillStyle = 'rgba(88,166,255,' + (0.15 + v * 0.5) + ')';
          ctx.fillRect(gx + xx * cell, gy + yy * cell, cell - 2, cell - 2);
        }
      }
      ctx.fillStyle = C.red; ctx.font = MONO;
      ctx.fillText('224×224×3 = 150,528 个数字', rx + 100, gy + 40);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('没有「词」, 没有顺序, 没有语义单元', rx + 100, gy + 62);
      /* 底部 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('缺一个「图像版的 BPE」: 把像素变成有意义的单元序列', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · patch 切分 (核心交互) ============ */
  (function () {
    var patch = 16;
    function draw() {
      var c = fit('patchCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var size = 224;
      var disp = Math.min(200, c.h - 70);
      var ox = 40, oy = 40;
      var n = size / patch;
      /* 网格 */
      for (var yy = 0; yy < n; yy++) {
        for (var xx = 0; xx < n; xx++) {
          var v = ((xx * 7 + yy * 13) % 17) / 17;
          ctx.fillStyle = 'rgba(88,166,255,' + (0.1 + v * 0.35) + ')';
          ctx.fillRect(ox + xx * (disp / n), oy + yy * (disp / n), disp / n - 1, disp / n - 1);
        }
      }
      ctx.strokeStyle = C.dim;
      ctx.strokeRect(ox, oy, disp, disp);
      /* 信息 */
      var tokens = n * n;
      var dims = patch * patch * 3;
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('patch ' + patch + '×' + patch, ox + disp + 30, oy + 30);
      ctx.fillStyle = C.green;
      ctx.fillText(n + '×' + n + ' = ' + tokens + ' tokens', ox + disp + 30, oy + 56);
      ctx.fillStyle = C.orange;
      ctx.fillText('每 patch: ' + patch + '·' + patch + '·3 = ' + dims + ' 维向量', ox + disp + 30, oy + 82);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('线性投影 → 768 维 (ViT-Base)', ox + disp + 30, oy + 106);
      /* 经典点 */
      if (patch === 16) {
        ctx.fillStyle = C.pink; ctx.font = FONT;
        ctx.fillText('★ 经典 ViT: 16×16×3 = 768 恰好等于 hidden size', ox + disp + 30, oy + 130);
      }
      /* token 条 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('展平成序列 →', 40, oy + disp + 26);
      var tw = Math.min((c.w - 200) / Math.max(tokens, 196), 6);
      for (var t = 0; t < tokens && t < 200; t++) {
        ctx.fillStyle = 'rgba(126,231,135,.5)';
        ctx.fillRect(130 + t * (tw + 1), oy + disp + 18, tw, 12);
      }
      ctx.fillStyle = C.dim;
      ctx.fillText(tokens > 200 ? '(只画 200 个)' : '', 140 + 200 * (tw + 1), oy + disp + 28);
      /* 公式 */
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('+ 位置嵌入: patch 没有天然顺序, 位置信息也要学 (如同文本的词序)', 40, c.h - 8);
    }
    var slider = document.getElementById('patchSlider');
    var lbl = document.getElementById('patchLabel');
    if (slider) slider.addEventListener('input', function () {
      patch = [8, 14, 16, 28, 32][parseInt(slider.value, 10)];
      if (lbl) lbl.textContent = patch + '×' + patch;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · CLIP 双塔 + 相似度矩阵 (核心) ============ */
  (function () {
    function draw() {
      var c = fit('clipCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左塔: 图像 */
      var imgs = ['🐱', '🐕', '🚗'];
      var ix = 60, iy = 40;
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('图像塔 (ViT)', ix - 10, iy - 12);
      imgs.forEach(function (e, i) {
        ctx.font = '28px sans-serif';
        ctx.fillText(e, ix - 6, iy + 40 + i * 52);
        /* 编码向量 */
        ctx.strokeStyle = C.blue;
        ctx.strokeRect(ix + 40, iy + 18 + i * 52, 70, 22);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText('→向量', ix + 116, iy + 34 + i * 52);
      });
      /* 右塔: 文本 */
      var tx = c.w - 200;
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('文本塔', tx - 24, iy - 12);
      var txts = ['a cat', 'a dog', 'a car'];
      txts.forEach(function (t, i) {
        ctx.fillStyle = C.green; ctx.font = FONT;
        ctx.fillText(t, tx - 24, iy + 34 + i * 52);
        ctx.strokeStyle = C.green;
        ctx.strokeRect(tx + 44, iy + 18 + i * 52, 70, 22);
      });
      /* 中间相似度矩阵 */
      var mx = c.w / 2 - 60, my = iy + 6;
      var cell = 40;
      var sims = [
        [0.95, 0.20, 0.05],
        [0.12, 0.93, 0.08],
        [0.05, 0.10, 0.96]
      ];
      for (var r = 0; r < 3; r++) {
        for (var q = 0; q < 3; q++) {
          var v = sims[r][q];
          ctx.fillStyle = r === q ? 'rgba(126,231,135,' + (0.15 + v * 0.5) + ')' : 'rgba(248,81,73,' + (0.05 + v * 0.6) + ')';
          ctx.fillRect(mx + q * cell, my + r * cell, cell - 4, cell - 4);
          ctx.fillStyle = r === q ? C.green : C.dim;
          ctx.font = 'bold 11px monospace';
          ctx.fillText(v.toFixed(2), mx + q * cell + 8, my + r * cell + 22);
        }
      }
      ctx.fillStyle = C.dim; ctx.font = '11.5px sans-serif';
      ctx.fillText('对角线=正样本对(拉拢) · 非对角=负样本(推开)', mx - 20, my + 3 * cell + 16);
      /* 底部 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('4 亿图文对 · InfoNCE 对比学习 · 温度 τ=0.07', 16, c.h - 30);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('batch=32768 时一次对比 10.7 亿个负样本对 — 规模本身就是老师', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 零样本分类 ============ */
  (function () {
    function draw() {
      var c = fit('zeroshotCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('零样本: 没训练过「分类」却会分类', 16, 20);
      /* 一张新图 */
      ctx.font = '40px sans-serif';
      ctx.fillText('🦊', 36, 76);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('新图片 (狐狸)', 28, 96);
      /* 候选文本 */
      var cands = [
        { t: 'a photo of a fox', s: 0.31, col: C.green },
        { t: 'a photo of a dog', s: 0.24, col: C.orange },
        { t: 'a photo of a cat', s: 0.18, col: C.orange },
        { t: 'a photo of a car', s: 0.02, col: C.red }
      ];
      var bx = 150;
      cands.forEach(function (cd, i) {
        var y = 38 + i * 34;
        ctx.fillStyle = C.text; ctx.font = '12.5px monospace';
        ctx.fillText(cd.t, bx, y + 14);
        var w = cd.s / 0.35 * (c.w - bx - 260);
        ctx.fillStyle = cd.col + '55';
        ctx.fillRect(bx + 150, y, w, 20);
        ctx.strokeStyle = cd.col; ctx.strokeRect(bx + 150, y, w, 20);
        ctx.fillStyle = cd.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(cd.s.toFixed(2), bx + 156 + w, y + 15);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('argmax cos(图, 文) — 不训练, 现写候选就分类', 16, c.h - 34);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('ImageNet 零样本 76.2% · prompt 加「a type of animal」再 +3pp — 候选文本也是超参', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · GPT-6 看屏幕的账单 ============ */
  (function () {
    function draw() {
      var c = fit('screenCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: '1080p 原图 · patch 14', t: 10764, col: C.red },
        { n: '1080p 原图 · patch 28', t: 2691, col: C.orange },
        { n: '缩到 1344×756 · patch 28', t: 1296, col: C.green },
        { n: '缩到 896×504 · patch 28', t: 576, col: C.green }
      ];
      var maxT = 11000;
      rows.forEach(function (r, i) {
        var y = 24 + i * ((c.h - 66) / 4);
        var w = r.t / maxT * (c.w - 340);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(250, y, Math.max(8, w), 24);
        ctx.strokeStyle = r.col; ctx.strokeRect(250, y, Math.max(8, w), 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 17);
        ctx.font = MONO;
        ctx.fillText(r.t.toLocaleString() + ' tok', 256 + Math.max(8, w) + 8, y + 17);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('同一眼屏幕: 576 vs 10764 token — 18.7 倍的差距', 16, c.h - 30);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('缩图/加大 patch 是视觉账单第一旋钮 · 等价 ~1440 汉字上下文 (Tokenizer 页口径 1.5字/tok)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · VLM 配方 ============ */
  (function () {
    function draw() {
      var c = fit('vlmCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 通用 VLM 三段 */
      var blocks = [
        { n: '视觉编码器', d: 'ViT (常冻结/微调)', o: 'patch → 视觉向量', col: C.blue },
        { n: '投影层', d: 'MLP / Q-Former', o: '对齐到 LLM 词向量空间', col: C.orange },
        { n: 'LLM 主干', d: '普通 Decoder', o: '视觉 token 混进文本 token', col: C.green }
      ];
      blocks.forEach(function (b, i) {
        var x = 16 + i * ((c.w - 60) / 3 + 14);
        var bw = (c.w - 60) / 3;
        ctx.fillStyle = b.col + '18';
        ctx.fillRect(x, 30, bw, 92);
        ctx.strokeStyle = b.col; ctx.strokeRect(x, 30, bw, 92);
        ctx.fillStyle = b.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(b.n, x + 12, 54);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(b.d, x + 12, 78);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(b.o, x + 12, 102);
        if (i < 2) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + bw + 1, 76); ctx.lineTo(x + bw + 13, 76); ctx.stroke();
        }
      });
      /* 应用行 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('一眼看懂各家: GPT-4V/Gemini/Astra 的视觉通路都是这三段', 16, 150);
      var uses = [
        '· 「看屏幕」= 截图 → patch → 视觉 token → LLM 决策 (GPT-6 Astra 的日常)',
        '· 多模态 RAG: 图文同空间 (CLIP) → 以文搜图 / 以图搜图 (RAG 页的延伸)',
        '· Diffusion 文本引导: CLIP/T5 编码 prompt 作为条件 (下一页的主角)'
      ];
      ctx.fillStyle = C.dim; ctx.font = FONT;
      uses.forEach(function (u, i) {
        ctx.fillText(u, 16, 176 + i * 20);
      });
    }
    draw(); redraws.push(draw);
  })();

})();
