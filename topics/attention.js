/* attention.js — 全部交互演示（node --check 可直接校验） */
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

  function softmax(arr) {
    var m = Math.max.apply(null, arr);
    var e = arr.map(function (a) { return Math.exp(a - m); });
    var s = e.reduce(function (a, b) { return a + b; }, 0);
    return e.map(function (x) { return x / s; });
  }

  var redraws = [];
  window.addEventListener('resize', function () {
    redraws.forEach(function (fn) { fn(); });
  });

  /* ============ 图1 · "it" 指什么 (核心交互: 热力图) ============ */
  (function () {
    var WORDS = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'];
    var ZH = ['那只', '动物', '没有', '穿过', '这条', '街', '因为', '它', '太', '累', '了'];
    /* 简化的手工 attention: it 主要看 animal; cross 看 street 等 */
    var ATT = {
      7: [0.02, 0.55, 0.03, 0.06, 0.01, 0.05, 0.02, 0.00, 0.10, 0.04, 0.12],
      1: [0.05, 0.00, 0.06, 0.30, 0.03, 0.35, 0.04, 0.03, 0.04, 0.05, 0.05],
      3: [0.04, 0.18, 0.05, 0.00, 0.06, 0.45, 0.05, 0.04, 0.04, 0.05, 0.04],
      10: [0.03, 0.30, 0.05, 0.08, 0.02, 0.05, 0.04, 0.18, 0.04, 0.06, 0.00]
    };
    var sel = 7;
    function draw() {
      var c = fit('itCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('点任意词, 看它在「看」谁:', 16, 22);
      var n = WORDS.length;
      var tw = (c.w - 32) / n;
      WORDS.forEach(function (w, i) {
        var x = 16 + i * tw;
        var cur = i === sel;
        var dist = ATT[sel] ? ATT[sel][i] : 0.05;
        var isDefault = !ATT[sel];
        var inten = isDefault ? 0.08 : dist;
        ctx.fillStyle = cur ? C.pink : (inten > 0.25 ? 'rgba(126,231,135,' + (0.2 + inten) + ')' : (inten > 0.08 ? 'rgba(126,231,135,' + (0.1 + inten) + ')' : 'rgba(48,54,61,.5)'));
        ctx.fillRect(x + 2, 36, tw - 6, 40);
        ctx.strokeStyle = cur ? C.pink : (inten > 0.25 ? C.green : C.dark);
        ctx.strokeRect(x + 2, 36, tw - 6, 40);
        ctx.fillStyle = cur ? C.pink : (inten > 0.25 ? '#e6ffea' : C.dim);
        ctx.font = (cur ? 'bold ' : '') + '12px monospace';
        ctx.fillText(w, x + tw / 2 - w.length * 3.2, 54);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = cur ? C.pink : C.dim;
        ctx.fillText(ZH[i], x + tw / 2 - ZH[i].length * 5.5, 70);
        if (!isDefault) {
          ctx.fillStyle = C.green; ctx.font = 'bold 11px monospace';
          if (dist > 0.03) ctx.fillText((dist * 100).toFixed(0) + '%', x + tw / 2 - 10, 92);
        }
      });
      /* 解读 */
      ctx.fillStyle = C.text; ctx.font = FONT;
      var who = WORDS[sel], zh = ZH[sel];
      var msg;
      if (sel === 7) msg = '「it」55% 的注意力给了 animal —— 指代消解! (换 tired 会变 wide, 指 street)';
      else if (sel === 1 || sel === 3 || sel === 10) msg = '「' + zh + '」的注意力分布 —— 注意力就是「相关性的计算」, 无需任何规则';
      else msg = '普通词的注意力较分散 —— 每个词每层都在动态计算它需要看谁';
      ctx.fillText(msg, 16, 118);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('这一步没有任何语言学规则 — Q·K 点积自然学出了指代、句法、语义关联', 16, c.h - 10);
    }
    var cv = document.getElementById('itCanvas');
    if (cv) cv.addEventListener('click', function (e) {
      var rect = cv.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var n = WORDS.length;
      var tw = (cv.clientWidth - 32) / n;
      var idx = Math.floor((x - 16) / tw);
      if (idx >= 0 && idx < n) { sel = idx; draw(); }
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · QKV 图书馆 ============ */
  (function () {
    function draw() {
      var c = fit('qkvCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var roles = [
        { n: 'Q 查询', q: '「我要找什么」', ex: 'it 在找: 主语是谁?', col: C.blue },
        { n: 'K 键', q: '「我的标签」', ex: 'animal 的标签: 名词/主语/生物', col: C.green },
        { n: 'V 值', q: '「我的内容」', ex: 'animal 携带的信息本身', col: C.orange }
      ];
      roles.forEach(function (r, i) {
        var x = 16 + i * (c.w - 48) / 3;
        var bw = (c.w - 48) / 3;
        ctx.fillStyle = r.col + '16';
        ctx.fillRect(x, 24, bw, 100);
        ctx.strokeStyle = r.col; ctx.strokeRect(x, 24, bw, 100);
        ctx.fillStyle = r.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(r.n, x + 12, 48);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.q, x + 12, 72);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(r.ex, x + 12, 96);
      });
      /* 四步公式 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('Attention(Q,K,V) = softmax(QKᵀ/√d)·V', 16, 152);
      var steps = ['① QKᵀ 算相关', '② /√d 压方差', '③ softmax 变权重', '④ 加权求和 V'];
      steps.forEach(function (s, i) {
        var x = 16 + i * (c.w - 32) / 4;
        ctx.fillStyle = [C.blue, C.pink, C.green, C.orange][i];
        ctx.font = FONT;
        ctx.fillText(s, x, 176);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('Q/K 决定「看谁」, V 决定「取什么」— 相似度与内容解耦, 这就是设计的天才之处', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · √d 缩放演示 (核心交互) ============ */
  (function () {
    var scaled = true;
    function draw() {
      var c = fit('scaleCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var d = 64;
      var logits = [3.1, 1.2, -0.8, 2.2, 0.4, -1.5, 1.8, -0.3];
      var processed = logits.map(function (l) {
        return scaled ? l : l * Math.sqrt(d);
      });
      var probs = softmax(processed);
      /* 条形图 */
      probs.forEach(function (p, i) {
        var bw = (c.w - 120) / 8;
        var x = 70 + i * bw;
        var h = p * 130;
        ctx.fillStyle = p > 0.5 ? C.red + '99' : C.blue + '66';
        ctx.fillRect(x, 150 - h, bw - 8, h);
        ctx.strokeStyle = p > 0.5 ? C.red : C.blue;
        ctx.strokeRect(x, 150 - h, bw - 8, h);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText('K' + i, x + bw / 2 - 12, 166);
        if (p > 0.01) {
          ctx.fillStyle = C.text;
          ctx.fillText((p * 100).toFixed(1) + '%', x + bw / 2 - 18, 150 - h - 6);
        }
      });
      /* logits 展示 */
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('logits: [' + processed.slice(0, 4).map(function (v) { return v.toFixed(1); }).join(', ') + ' ...]', 16, 26);
      ctx.fillStyle = scaled ? C.green : C.red; ctx.font = MONO;
      var verdict = scaled ? '除以 √d=' + Math.sqrt(d).toFixed(0) + ': std≈1, softmax 平滑 — 每个候选都有梯度' : '不除: logits ±13 → softmax 变 one-hot (99.9%) — 其余候选梯度≈e⁻¹³≈0, 学不动';
      ctx.fillText(verdict, 16, 48);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText(scaled ? '温和询问: 「都来点信息」' : '极端宣判: 「只要第一名」', 16, 186);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('点按钮切换 — d=64 时随机点积 std≈8: 不缩放的话 softmax 天生饱和, 注意力训练不动', 16, c.h - 8);
    }
    var btn = document.getElementById('scaleBtn');
    if (btn) btn.addEventListener('click', function () {
      scaled = !scaled;
      btn.textContent = scaled ? '√d 缩放: 开 (点我关掉)' : '√d 缩放: 关 (点我打开)';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 多头 + GQA ============ */
  (function () {
    function draw() {
      var c = fit('headsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: 多头分工 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('多头: 32 个视角同时看', 16, 22);
      var heads = [
        { n: '头3', d: '指代: it→animal', col: C.blue },
        { n: '头7', d: '句法: 动词→宾语', col: C.green },
        { n: '头12', d: '位置: 前一个词', col: C.orange },
        { n: '头19', d: '罕见词→高频同义', col: C.purple }
      ];
      heads.forEach(function (h, i) {
        var y = 40 + i * 26;
        ctx.fillStyle = h.col + '18';
        ctx.fillRect(16, y, c.w / 2 - 40, 22);
        ctx.fillStyle = h.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(h.n, 24, y + 16);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(h.d, 70, y + 16);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('每头 128 维独立 QKV — 合起来 4096 维', 16, 150);
      /* 右: GQA */
      var rx = c.w / 2 + 10;
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('GQA: KV 头合并', rx, 22);
      var gens = [
        { n: 'MHA 32:32', mb: '0.50MB', pct: 100, col: C.red },
        { n: 'GQA 32:8', mb: '0.13MB', pct: 25, col: C.orange },
        { n: 'GQA 32:4', mb: '0.06MB', pct: 13, col: C.green },
        { n: 'MQA 32:1', mb: '0.02MB', pct: 3, col: C.purple }
      ];
      gens.forEach(function (g, i) {
        var y = 40 + i * 26;
        var w = g.pct / 100 * (c.w / 2 - 150);
        ctx.fillStyle = g.col + '55';
        ctx.fillRect(rx + 80, y, Math.max(4, w), 20);
        ctx.strokeStyle = g.col; ctx.strokeRect(rx + 80, y, Math.max(4, w), 20);
        ctx.fillStyle = C.text; ctx.font = '11.5px monospace';
        ctx.fillText(g.n, rx, y + 15);
        ctx.fillText(g.mb, rx + 86 + Math.max(4, w), y + 15);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('32 个 Q 头共享少数 KV 头 — 质量≈不掉, KV Cache 直降', rx, 150);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('这就是 KV Cache 页 0.78MB/token 口径背后的旋钮', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 因果掩码 ============ */
  (function () {
    function draw() {
      var c = fit('maskCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var toks = ['我', '爱', '学', '习', 'LLM', '→'];
      var n = toks.length;
      var cell = Math.min(46, (c.w - 200) / n);
      var ox = 150, oy = 30;
      /* 下三角矩阵 */
      for (var q = 0; q < n; q++) {
        for (var k = 0; k < n; k++) {
          var x = ox + k * cell, y = oy + q * cell;
          if (k > q) {
            ctx.fillStyle = 'rgba(248,81,73,.13)';
            ctx.fillRect(x, y, cell - 3, cell - 3);
            ctx.fillStyle = 'rgba(248,81,73,.5)';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('×', x + cell / 2 - 5, y + cell / 2 + 4);
          } else {
            var isLast = (q === n - 1);
            ctx.fillStyle = isLast ? 'rgba(126,231,135,.3)' : 'rgba(88,166,255,.15)';
            ctx.fillRect(x, y, cell - 3, cell - 3);
            ctx.strokeStyle = isLast ? C.green : C.blue;
            ctx.strokeRect(x, y, cell - 3, cell - 3);
          }
        }
      }
      /* 标签 */
      toks.forEach(function (t, i) {
        ctx.fillStyle = C.text; ctx.font = '12px monospace';
        ctx.fillText(t, ox + i * cell + cell / 2 - 10, oy - 8);
        ctx.fillText(t, ox - 26, oy + i * cell + cell / 2 + 4);
      });
      /* 说明 */
      var rx = ox + n * cell + 24;
      ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('行=查询 token', rx, oy + 8);
      ctx.fillText('列=被看 token', rx, oy + 28);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      var notes = [
        '× = 未来不可见',
        '(防作弊: 答案在后面)',
        '',
        '绿行: 推理时唯一用到的',
        '= KV Cache 只存 K/V 的原因',
        '(kv-cache 页)',
        '',
        '训练: 一次前向 = 6 个位置',
        '同时出 loss (教师强制)'
      ];
      notes.forEach(function (nt, i) {
        ctx.fillText(nt, rx, oy + 52 + i * 17);
      });
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 参数账 + 全站枢纽 ============ */
  (function () {
    function draw() {
      var c = fit('hubCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: 每层参数账 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('每层参数账 (d=4096)', 16, 22);
      var parts = [
        { n: 'Attention 4d²', m: 67, col: C.blue },
        { n: 'FFN 3×d×4d', m: 201, col: C.orange }
      ];
      parts.forEach(function (p, i) {
        var y = 40 + i * 40;
        var w = p.m / 268 * (c.w / 2 - 100);
        ctx.fillStyle = p.col + '55';
        ctx.fillRect(150, y, w, 26);
        ctx.strokeStyle = p.col; ctx.strokeRect(150, y, w, 26);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(p.n, 16, y + 18);
        ctx.font = MONO;
        ctx.fillText(p.m + 'M', 156 + w + 8, y + 18);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('attention 只占 25% — MoE 页换掉的就是那 75% 里的 FFN', 16, 128);
      ctx.fillStyle = C.green;
      ctx.fillText('为什么不敢换 attention? 信息路由比特征变换更难稀疏化', 16, 148);
      /* 右: 枢纽图 */
      var rx = c.w / 2 + 20;
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('attention 是全站的枢纽', rx, 22);
      var links = [
        ['KV Cache', '存的就是 K/V'],
        ['FlashAttention', '优化 QKᵀ 显存'],
        ['PagedAttention', '管理 K/V 空间'],
        ['MoE', '保留 attention 换 FFN'],
        ['SD', 'QK 匹配做验证']
      ];
      links.forEach(function (l, i) {
        var y = 42 + i * 22;
        ctx.fillStyle = C.blue + '18';
        ctx.fillRect(rx, y, c.w - rx - 16, 18);
        ctx.fillStyle = C.text; ctx.font = '12px monospace';
        ctx.fillText(l[0], rx + 8, y + 13);
        ctx.fillStyle = C.dim; ctx.font = '11.5px sans-serif';
        ctx.fillText(l[1], rx + 130, y + 13);
      });
      ctx.fillStyle = C.purple; ctx.font = MONO;
      ctx.fillText('2017 论文标题: Attention Is All You Need', rx, 42 + 5 * 22 + 8);
    }
    draw(); redraws.push(draw);
  })();

})();
