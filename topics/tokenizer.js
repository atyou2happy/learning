/* tokenizer.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · strawberry 之谜 ============ */
  (function () {
    function draw() {
      var c = fit('berryCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 人看到的 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('你问: "strawberry 里有几个 r?"', 16, 22);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('人看到 10 个字符:  s t r a w b e r r y', 16, 46);
      /* 模型看到的 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('模型看到 3 个 token:', 16, 78);
      var parts = [['str', C.blue], ['aw', C.green], ['berry', C.orange]];
      var x = 40;
      parts.forEach(function (p) {
        var w = p[0].length * 16 + 20;
        ctx.fillStyle = p[1] + '44';
        ctx.fillRect(x, 92, w, 30);
        ctx.strokeStyle = p[1]; ctx.strokeRect(x, 92, w, 30);
        ctx.fillStyle = C.text; ctx.font = MONO;
        ctx.fillText(p[0], x + 10, 112);
        x += w + 10;
      });
      /* 两个 r 分散 */
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('r #1 藏在 [str] 里 · r #2 r #3 藏在 [berry] 里 — 模型必须「反编译」token 才能数', 16, 146);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('答错不是不聪明, 是看不见字母 — 就像你数不了摩斯密码里的点', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · BPE 合并动画 (核心交互) ============ */
  (function () {
    /* 预计算的合并链: 语料 low low low lower lowest */
    var STEPS = [
      { seqs: [['l', 'o', 'w'], ['l', 'o', 'w'], ['l', 'o', 'w'], ['l', 'o', 'w', 'e', 'r'], ['l', 'o', 'w', 'e', 's', 't']], merge: null, freq: null, vocab: 7 },
      { merge: 'l+o', freq: 5, vocab: 8 },
      { merge: 'lo+w', freq: 5, vocab: 9 },
      { merge: 'low+e', freq: 2, vocab: 10 },
      { merge: 'lowe+r', freq: 1, vocab: 11 },
      { merge: 'lowe+s', freq: 1, vocab: 12 },
      { merge: 'lowes+t', freq: 1, vocab: 13 }
    ];
    var SEQS = [
      [['l', 'o', 'w'], ['l', 'o', 'w'], ['l', 'o', 'w'], ['l', 'o', 'w', 'e', 'r'], ['l', 'o', 'w', 'e', 's', 't']],
      [['lo', 'w'], ['lo', 'w'], ['lo', 'w'], ['lo', 'w', 'e', 'r'], ['lo', 'w', 'e', 's', 't']],
      [['low'], ['low'], ['low'], ['low', 'e', 'r'], ['low', 'e', 's', 't']],
      [['low'], ['low'], ['low'], ['lowe', 'r'], ['lowe', 's', 't']],
      [['low'], ['low'], ['low'], ['lower'], ['lowe', 's', 't']],
      [['low'], ['low'], ['low'], ['lower'], ['lowes', 't']],
      [['low'], ['low'], ['low'], ['lower'], ['lowest']]
    ];
    var COLORS = [C.blue, C.green, C.orange, C.purple, C.pink];
    var si = 0;

    function draw() {
      var c = fit('bpeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var seqs = SEQS[si];
      var y0 = 40;
      seqs.forEach(function (s, w) {
        var x = 24;
        ctx.fillStyle = COLORS[w % 5]; ctx.font = FONT;
        s.forEach(function (t) {
          var tw = Math.max(26, t.length * 11 + 12);
          ctx.fillStyle = COLORS[w % 5] + '44';
          ctx.fillRect(x, y0 + w * 26, tw, 22);
          ctx.strokeStyle = COLORS[w % 5];
          ctx.strokeRect(x, y0 + w * 26, tw, 22);
          ctx.fillStyle = C.text; ctx.font = FONT;
          ctx.fillText(t, x + 6, y0 + w * 26 + 15);
          x += tw + 6;
        });
      });
      /* 状态行 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      var st = STEPS[si];
      if (si === 0) {
        ctx.fillText('初始: 全是单字符 · 词表 7 (l o w e r s t)', 24, y0 + 5 * 26 + 24);
      } else {
        ctx.fillText('合并 #' + si + ': ' + st.merge + ' (频次 ' + st.freq + ') → 词表 ' + st.vocab, 24, y0 + 5 * 26 + 24);
      }
      /* 总 token 数 */
      var total = 0;
      seqs.forEach(function (s) { total += s.length; });
      ctx.fillStyle = C.green;
      ctx.fillText('语料总 token: ' + total + ' (初始 22)', 24, y0 + 5 * 26 + 44);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('规则: 数所有相邻对频次 → 合并最高的 → 词表+1 → 重复 (贪心)', 24, c.h - 8);
    }

    var btn = document.getElementById('bpeBtn');
    if (btn) btn.addEventListener('click', function () {
      si = (si + 1) % SEQS.length;
      btn.textContent = si < STEPS.length - 1 ? '下一步合并 → (' + si + '/' + (STEPS.length - 1) + ')' : '↺ 重置';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 词表演进 ============ */
  (function () {
    function draw() {
      var c = fit('vocabCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var vocabs = [
        { n: 'GPT-2 (2019)', v: 50257, bits: 15.6, col: C.dim },
        { n: 'Llama-2 (2023)', v: 32000, bits: 15.0, col: C.blue },
        { n: 'Qwen2.5 (2024)', v: 151646, bits: 17.2, col: C.green },
        { n: 'Llama-3 (2024)', v: 128256, bits: 17.0, col: C.orange },
        { n: 'Gemma-2 (2024)', v: 256128, bits: 18.0, col: C.pink }
      ];
      var maxV = 260000;
      vocabs.forEach(function (vb, i) {
        var y = 22 + i * ((c.h - 50) / 5);
        var w = vb.v / maxV * (c.w - 260);
        ctx.fillStyle = vb.col + '55';
        ctx.fillRect(150, y, w, 22);
        ctx.strokeStyle = vb.col; ctx.strokeRect(150, y, w, 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(vb.n, 16, y + 16);
        ctx.font = MONO;
        ctx.fillText(vb.v.toLocaleString(), 154 + w + 8, y + 16);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(vb.bits + ' bits', c.w - 60, y + 16);
      });
      ctx.fillStyle = C.purple; ctx.font = FONT;
      ctx.fillText('log2(词表) = 每 token 的信息量 — Mostik 页的 "17 bits/token" 就是这么来的 (Llama-3 = 17.0)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 中英效率对比 ============ */
  (function () {
    function draw() {
      var c = fit('effCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 同内容: 100 汉字 vs 100 英文词 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('同样信息量的 token 账单 (GPT-4o 级 tokenizer)', 16, 20);
      var rows = [
        { n: '英文 100 词 (600 字符)', t: 150, col: C.green },
        { n: '中文 100 汉字', t: 67, col: C.orange },
        { n: '中文 100 汉字 (旧 GPT-3.5)', t: 133, col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 38 + i * 34;
        var w = r.t / 160 * (c.w - 280);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(240, y, w, 22);
        ctx.strokeStyle = r.col; ctx.strokeRect(240, y, w, 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 16);
        ctx.font = MONO;
        ctx.fillText(r.t + ' tok', 244 + w + 8, y + 16);
      });
      /* 说明 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('英: ~4 字符/token · 中: ~1.5 字符/token — 同窗口装的内容, 中英文不等量', 16, 132);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('为什么中文「贵」: 高频汉字未进词表, 每字付 1-2 token 的价; 中文词表大的模型 (Qwen/Gemma) 把这笔钱省了', 16, 156);
      /* emoji */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('emoji 更惨: 一个 😀 在旧 tokenizer 里 = 3-4 token (UTF-8 4 字节被切碎)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 上下文换算器 (核心交互) ============ */
  (function () {
    var mode = 0; /* 0 英文 1 中文 */
    function calc(t) {
      if (mode === 0) {
        return {
          words: t * 0.75,
          pages: t * 0.75 / 500,
          books: t * 0.75 / 100000,
          unit: '英文词'
        };
      }
      return {
        words: t * 1.5,
        pages: t * 1.5 / 600,
        books: t * 1.5 / 300000,
        unit: '汉字'
      };
    }
    function draw() {
      var c = fit('ctxCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var presets = [
        { n: '8k (Llama-2)', t: 8192 },
        { n: '128k (Llama-3/Qwen)', t: 131072 },
        { n: '256k', t: 262144 },
        { n: '1M (Gemini)', t: 1048576 }
      ];
      presets.forEach(function (p, i) {
        var r = calc(p.t);
        var y = 26 + i * ((c.h - 56) / 4);
        var rh = (c.h - 64) / 4;
        ctx.fillStyle = i === 1 ? 'rgba(88,166,255,.15)' : 'rgba(139,148,158,.06)';
        ctx.fillRect(14, y, c.w - 28, rh - 8);
        ctx.strokeStyle = i === 1 ? C.blue : C.dark;
        ctx.strokeRect(14, y, c.w - 28, rh - 8);
        ctx.fillStyle = i === 1 ? C.blue : C.dim; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(p.n, 26, y + rh / 2);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText('≈ ' + fmt(r.words) + ' ' + r.unit, 220, y + rh / 2);
        ctx.fillStyle = C.dim;
        ctx.fillText('≈ ' + (r.pages < 1 ? r.pages.toFixed(2) : fmt(r.pages)) + ' 页', 420, y + rh / 2);
        ctx.fillText('≈ ' + r.books.toFixed(r.books < 10 ? 1 : 0) + ' 本书', 540, y + rh / 2);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('当前换算: ' + (mode === 0 ? '英文 (500词/页, 100k词/书)' : '中文 (600字/页, 30万字/书)') + ' · 点按钮切换语言', 16, c.h - 8);
    }
    function fmt(n) {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return Math.round(n / 1000) + 'k';
      return Math.round(n);
    }
    var btn = document.getElementById('langBtn');
    if (btn) btn.addEventListener('click', function () {
      mode = 1 - mode;
      btn.textContent = mode === 0 ? '🌐 英文 ⇄ 中文' : '🈶 中文 ⇄ 英文';
      draw();
    });
    draw(); redraws.push(draw);
  })();

})();
