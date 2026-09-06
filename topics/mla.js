/* mla.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 压缩是生死题 ============ */
  (function () {
    function draw() {
      var c = fit('whyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('DS-V3 671B @ 128k 上下文 — KV 缓存不给压缩就上不了线', 16, 22);
      /* 两个模型对比 */
      var bars = [
        { n: '假如用 MHA', g: 488, col: C.red },
        { n: '假如用 GQA-8', g: 30.5, col: C.orange },
        { n: '实装 MLA', g: 8.6, col: C.green },
        { n: '参照: Llama-3-70B GQA-8', g: 40.0, col: C.blue }
      ];
      bars.forEach(function (b, i) {
        var y = 42 + i * 34;
        ctx.fillStyle = b.col + '12';
        ctx.fillRect(16, y, c.w - 32, 28);
        ctx.strokeStyle = b.col; ctx.strokeRect(16, y, c.w - 32, 28);
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(b.n, 26, y + 19);
        /* 数值条 */
        var w2 = Math.max(6, Math.min(1, b.g / 488) * 400);
        ctx.fillStyle = b.col;
        ctx.fillRect(280, y + 6, w2, 16);
        ctx.fillStyle = b.col; ctx.font = MONO;
        ctx.fillText(b.g + ' GB', 290 + w2, y + 19);
      });
      ctx.fillStyle = C.pink; ctx.font = FONT;
      ctx.fillText('恐怖账: 参数大 10 倍的巨兽, KV 缓存反而是 70B 模型的 11% — 「API 定价屠夫」的物理学', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 压缩-还原动画 (核心) ============ */
  (function () {
    var phase = 0;
    function draw() {
      var c = fit('flowCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('存的时候压, 用的时候升 — ' + ['① 生成完整 K/V', '② 压成潜在向量 c_kv (576维)', '③ 缓存里只存潜在向量', '④ 注意力时矩阵吸收还原'][phase], 16, 22);
      /* 缓存区 */
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(c.w / 2 - 90, 130, 180, 50);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('KV Cache (要长期驻留显存)', c.w / 2 - 88, 148);
      if (phase >= 2) {
        ctx.fillStyle = 'rgba(126,231,135,.25)';
        ctx.fillRect(c.w / 2 - 84, 152, 168 * (phase === 3 ? 0.22 : 1), 22);
        ctx.fillStyle = C.green; ctx.font = 'bold 11px monospace';
        ctx.fillText(phase === 3 ? 'c_kv 576 维' : 'c_kv 576 维 = 1.1KB/层', c.w / 2 - 80, 168);
      } else {
        ctx.fillStyle = 'rgba(248,81,73,.2)';
        ctx.fillRect(c.w / 2 - 84, 152, 168, 22);
        ctx.fillStyle = C.red; ctx.font = 'bold 11px monospace';
        ctx.fillText(phase === 0 ? 'K,V 32768 维 = 64KB/层' : '正在压缩...', c.w / 2 - 80, 168);
      }
      /* 左: 输入 token */
      ctx.fillStyle = 'rgba(88,166,255,.15)';
      ctx.fillRect(40, 140, 120, 32);
      ctx.strokeStyle = C.blue; ctx.strokeRect(40, 140, 120, 32);
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('token 隐状态', 58, 160);
      /* 下方流程箭头 */
      var steps = ['h → K,V (完整)', '↓ 压缩 W^DKV', '只存 c_kv', '↑ W^UK 吸收进 q / W^UV 吸收进 o'];
      ctx.fillStyle = phase === 0 ? C.blue : (phase === 1 ? C.orange : C.green);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(steps[phase], 40, 108);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('低秩思想: 32768 维的 K/V 其实活在 576 维的子空间里 — 与 LoRA 同族数学', 16, c.h - 10);
    }
    var btn = document.getElementById('mlaBtn');
    if (btn) btn.addEventListener('click', function () {
      phase = (phase + 1) % 4;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 四阶梯对比 (核心交互) ============ */
  (function () {
    var idx = 0; /* 0=MHA 1=GQA 2=MQA 3=MLA */
    var ladders = [
      { n: 'MHA (128 头)', e: 32768, kb: '64KB/层', q: '质量最高', col: C.blue },
      { n: 'GQA-8 (8 组)', e: 2048, kb: '4.0KB/层', q: '质量略降', col: C.green },
      { n: 'MQA (1 组)', e: 256, kb: '0.5KB/层', q: '质量明显降', col: C.orange },
      { n: 'MLA (潜在 576)', e: 576, kb: '1.1KB/层', q: '质量≈MHA', col: C.pink }
    ];
    function draw() {
      var c = fit('ladderCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var L = ladders[idx];
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('压缩阶梯第 ' + (idx + 1) + '/4 级: ' + L.n, 16, 22);
      /* 元素条 (log 刻度) */
      var x0 = 150, wMax = c.w - 240;
      ladders.forEach(function (ld, i) {
        var y = 44 + i * 34;
        var wl = wMax * (Math.log10(ld.e) / Math.log10(32768));
        ctx.fillStyle = i === idx ? ld.col + '55' : ld.col + '18';
        ctx.fillRect(x0, y, wl, 26);
        ctx.strokeStyle = ld.col; ctx.strokeRect(x0, y, wl, 26);
        ctx.fillStyle = i === idx ? C.text : C.dim;
        ctx.font = (i === idx ? 'bold ' : '') + '12px monospace';
        ctx.fillText(ld.n, 16, y + 18);
        ctx.fillStyle = i === idx ? ld.col : C.dim; ctx.font = MONO;
        ctx.fillText(ld.kb, x0 + wl + 10, y + 18);
      });
      /* 质量标注 */
      ctx.fillStyle = L.col; ctx.font = FONT;
      ctx.fillText('缓存代价: ' + L.kb + ' | ' + L.q, 16, 186);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('GQA/MQA: 砍 KV 头 (糙); MLA: 换表示 (低秩压缩, 128 头全保留)', 16, c.h - 10);
    }
    var btn = document.getElementById('ladBtn');
    if (btn) btn.addEventListener('click', function () {
      idx = (idx + 1) % 4;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 三件套咬合 ============ */
  (function () {
    function draw() {
      var c = fit('trioCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('DS-V3 三件套 — 每件各砍一维成本', 16, 22);
      var trio = [
        { n: 'MoE', d: '算力: 671B 参数只激活 37B', s: '×1/18', col: C.green },
        { n: 'MLA', d: '显存: KV 缓存压 57 倍', s: '×1/57', col: C.pink },
        { n: 'MTP', d: '速度: 投机解码 3 倍解码', s: '×3', col: C.orange }
      ];
      trio.forEach(function (t, i) {
        var x = 16 + i * (c.w / 3 - 8);
        ctx.fillStyle = t.col + '14';
        ctx.fillRect(x, 44, c.w / 3 - 30, 110);
        ctx.strokeStyle = t.col; ctx.strokeRect(x, 44, c.w / 3 - 30, 110);
        ctx.fillStyle = t.col; ctx.font = 'bold 15px monospace';
        ctx.fillText(t.n, x + 14, 70);
        ctx.fillStyle = t.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(t.s, x + 14, 96);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(t.d, x + 14, 124);
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('咬合成账: 巨大参数的智能 + 小模型的成本 — “屠夫定价”的全部物理学', 16, 172);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('每件套都有本站专页: MoE / 本页 / Speculative Decoding — 互链闭环', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 屠夫账本 ============ */
  (function () {
    function draw() {
      var c = fit('priceCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('读「价格战」新闻的物理学底层', 16, 22);
      var rows = [
        { s: 'KV 缓存 8.6GB @128k', v: '同规模 MHA 要 488GB — 根本上不了线', col: C.pink },
        { s: '激活 37B / 总 671B', v: '每 token 只走 5.5% 的参数', col: C.green },
        { s: 'MTP 解码加速', v: '吞吐 ×3 — 单位成本再除 3', col: C.orange },
        { s: 'V3.2 加 DSA 稀疏注意力', v: '128k 上下文注意力再砍几倍', col: C.blue },
        { s: '→ API 定价', v: '同档智能, 价格打到一个零头', col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 42 + i * 30;
        ctx.fillStyle = r.col + '12';
        ctx.fillRect(16, y, c.w - 32, 25);
        ctx.strokeStyle = r.col; ctx.strokeRect(16, y, c.w - 32, 25);
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.s, 26, y + 17);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.v, 300, y + 17);
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('反直觉总结: 巨兽比小兽更省 — 参数是摊薄成本, 缓存才是要害', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
