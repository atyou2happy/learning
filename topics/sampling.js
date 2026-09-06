/* sampling.js — 全部交互演示（node --check 可直接校验） */
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

  /* 真值: logits for '今天天气真…' */
  var TOKS = ['好', '不错', '冷', '热', '糟糕', '晴', '阴', '舒服'];
  var LOGITS = [4.2, 3.8, 3.1, 2.4, 1.9, 1.1, 0.3, -0.8];

  function softmax(xs, T) {
    T = T || 1;
    var m = -Infinity;
    for (var i = 0; i < xs.length; i++) { var v = xs[i] / T; if (v > m) m = v; }
    var es = xs.map(function (x) { return Math.exp(x / T - m); });
    var s = es.reduce(function (a, b) { return a + b; }, 0);
    return es.map(function (e) { return e / s; });
  }

  /* ============ 图1 · logits -> 分布 + 贪心重复陷阱 ============ */
  (function () {
    function draw() {
      var c = fit('logitsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 上: logits 条 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('模型输出的原始分数 logits (还没归一化)', 16, 20);
      var bw = (c.w - 40) / TOKS.length;
      var lmax = 4.6;
      LOGITS.forEach(function (l, i) {
        var h = (l + 1) / (lmax + 1) * 52;
        ctx.fillStyle = 'rgba(88,166,255,.35)';
        ctx.fillRect(24 + i * bw, 30, bw - 8, 52);
        ctx.fillStyle = C.blue;
        ctx.fillRect(24 + i * bw, 82 - h, bw - 8, h);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(l.toFixed(1), 24 + i * bw + 2, 30 + 64);
        ctx.fillStyle = C.text;
        ctx.fillText(TOKS[i], 24 + i * bw + 10, 104);
      });
      /* 下: 贪心循环 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('贪心 (argmax) 的陷阱: 重复循环', 16, 134);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('「...很好很好很好很好...」— 每步都选最大, 一旦被自己的输出强化, 就困在环里', 16, 152);
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('采样 = 从分布里抽签, 时不时跳出环 —— 多样性的来源也是自我纠错的来源', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 温度滑块 (核心交互) ============ */
  (function () {
    var T = 1.0;
    var slider = document.getElementById('tempSlider');
    var lbl = document.getElementById('tempLabel');
    function draw() {
      var c = fit('tempCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var p = softmax(LOGITS, T);
      var bw = (c.w - 40) / TOKS.length;
      var pmax = 0.72;
      p.forEach(function (v, i) {
        var h = v / pmax * (c.h - 76);
        var col = i === 0 ? C.green : C.blue;
        ctx.fillStyle = col + '99';
        ctx.fillRect(24 + i * bw, c.h - 46 - h, bw - 8, h);
        ctx.strokeStyle = col;
        ctx.strokeRect(24 + i * bw, c.h - 46 - h, bw - 8, h);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText((v * 100).toFixed(1) + '%', 24 + i * bw, c.h - 52 - h);
        ctx.fillStyle = C.dim;
        ctx.fillText(TOKS[i], 24 + i * bw + 10, c.h - 28);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      var mode = T < 0.15 ? '≈ argmax 贪心' : T < 0.8 ? '锐利 · 抽写/抽取' : T <= 1.3 ? '标准' : '奔放 · 创意写作';
      ctx.fillText('T = ' + T.toFixed(2) + '  ' + mode, 16, 20);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('分布从左往右: T小→尖峰(确定性) T大→摊平(随机性)', 16, c.h - 8);
    }
    if (slider) slider.addEventListener('input', function () {
      T = parseFloat(slider.value);
      if (lbl) lbl.textContent = 'T = ' + T.toFixed(2);
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · top-k vs top-p 截断 ============ */
  (function () {
    function draw() {
      var c = fit('truncCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var p = softmax(LOGITS, 1);
      var bw = (c.w - 40) / TOKS.length;
      /* top-k=3 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('top-k = 3 (固定条数)', 16, 20);
      p.forEach(function (v, i) {
        var h = v / 0.72 * 80;
        var inK = i < 3;
        ctx.fillStyle = inK ? 'rgba(126,231,135,.5)' : 'rgba(248,81,73,.15)';
        ctx.fillRect(24 + i * bw, 30, bw - 8, 84);
        ctx.strokeStyle = inK ? C.green : C.red;
        ctx.setLineDash(inK ? [] : [4, 3]);
        ctx.strokeRect(24 + i * bw, 30, bw - 8, 84);
        ctx.setLineDash([]);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText((v * 100).toFixed(0) + '%', 24 + i * bw + 2, 34 + 96);
        ctx.fillStyle = inK ? C.text : C.dim;
        ctx.fillText(TOKS[i], 24 + i * bw + 10, 30 + 100);
      });
      /* top-p=0.9 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('top-p = 0.9 (累积圈选, 本例选中 4 个)', 16, 148);
      var cum = 0;
      p.forEach(function (v, i) {
        var before = cum; cum += v;
        var inP = before < 0.9;
        var h = v / 0.72 * 80;
        ctx.fillStyle = inP ? 'rgba(163,113,247,.5)' : 'rgba(139,148,158,.08)';
        ctx.fillRect(24 + i * bw, 158, bw - 8, 84);
        ctx.strokeStyle = inP ? C.purple : C.dark;
        ctx.setLineDash(inP ? [] : [4, 3]);
        ctx.strokeRect(24 + i * bw, 158, bw - 8, 84);
        ctx.setLineDash([]);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText((v * 100).toFixed(0) + '%', 24 + i * bw + 2, 162 + 96);
        ctx.fillStyle = inP ? C.text : C.dim;
        ctx.fillText(TOKS[i], 24 + i * bw + 10, 158 + 100);
        if (inP && cum >= 0.9) {
          ctx.fillStyle = C.purple; ctx.font = FONT;
          ctx.fillText('累积 ' + (cum * 100).toFixed(1) + '% ◄ 截断线', 24 + i * bw, 156 + 118);
        }
      });
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 平坦/尖峰分布的反例 ============ */
  (function () {
    function draw() {
      var c = fit('shapeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 平坦: top-p 圈 7 个 vs top-k=3 误删 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('分布平坦 (开放性创作): top-p 圈 7/8, top-k=3 误删一半合理候选', 16, 20);
      var bw = (c.w / 2 - 50) / 8;
      var flat = [2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3];
      var pf = softmax(flat, 1);
      pf.forEach(function (v, i) {
        var h = v / 0.16 * 52;
        ctx.fillStyle = i < 7 ? 'rgba(163,113,247,.45)' : 'rgba(248,81,73,.2)';
        ctx.fillRect(24 + i * bw, 30, bw - 4, 58);
        ctx.strokeStyle = i < 7 ? C.purple : C.red;
        ctx.strokeRect(24 + i * bw, 30, bw - 4, 58);
      });
      /* 尖峰: top-p 圈 1 个 vs top-k=5 放进垃圾 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('分布尖峰 (事实问答): top-p 圈 1 个, top-k=5 放进 4 个垃圾候选', c.w / 2 + 16, 20);
      var peak = [8, 2, 1, 0.5, 0.2, 0, 0, 0];
      var pp = softmax(peak, 1);
      pp.forEach(function (v, i) {
        var h = v / 0.99 * 52;
        var x = c.w / 2 + 40 + i * bw;
        ctx.fillStyle = i < 1 ? 'rgba(163,113,247,.45)' : (i < 5 ? 'rgba(248,81,73,.2)' : 'rgba(139,148,158,.06)');
        ctx.fillRect(x, 30, bw - 4, 58);
        ctx.strokeStyle = i < 1 ? C.purple : C.red;
        ctx.strokeRect(x, 30, bw - 4, 58);
      });
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('结论: top-p 自适应分布形状 —— 尖峰时收紧(1个), 平坦时放开(7个); top-k 两头都出错', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 组合拳决策树 ============ */
  (function () {
    function draw() {
      var c = fit('comboCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { q: '要确定的答案?', a: 'T=0 (或极低) — 代码/抽取/数学', col: C.blue },
        { q: '要多样但靠谱?', a: 'T=0.7-1.0 + top-p=0.9 — 通用对话/创作', col: C.green },
        { q: '要野一点?', a: 'T=1.2-1.5 + top-p=0.95 — 头脑风暴', col: C.orange },
        { q: 'API 只给 temperature?', a: '只调 T, 心里记住 top-p≈0.9 是默认值', col: C.purple }
      ];
      rows.forEach(function (r, i) {
        var y = 20 + i * ((c.h - 40) / 4);
        var rh = (c.h - 48) / 4;
        ctx.fillStyle = r.col + '15';
        ctx.fillRect(14, y, c.w - 28, rh - 8);
        ctx.strokeStyle = r.col; ctx.strokeRect(14, y, c.w - 28, rh - 8);
        ctx.fillStyle = r.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(r.q, 26, y + (rh - 8) / 2 + 5);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.a, 240, y + (rh - 4) / 2 + 5);
      });
    }
    draw(); redraws.push(draw);
  })();

})();
