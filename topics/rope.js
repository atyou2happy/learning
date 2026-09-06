/* rope.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 集合不是序列 ============ */
  (function () {
    function draw() {
      var c = fit('setCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('打乱词序, attention 输出不变?!', 16, 22);
      /* 两行句子 */
      var s1 = ['猫', '追', '老鼠'], s2 = ['老鼠', '追', '猫'];
      [s1, s2].forEach(function (s, r) {
        var y = 48 + r * 52;
        s.forEach(function (w2, i) {
          var x = 40 + i * 110;
          ctx.fillStyle = 'rgba(88,166,255,.2)';
          ctx.fillRect(x, y, 90, 36);
          ctx.strokeStyle = C.blue; ctx.strokeRect(x, y, 90, 36);
          ctx.fillStyle = C.text; ctx.font = 'bold 15px monospace';
          ctx.fillText(w2, x + 30, y + 24);
        });
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText('→ 相同的集合 {猫,追,老鼠}', 380, y + 24);
      });
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('「猫追老鼠」和「老鼠追猫」在 attention 眼里是同一个袋子 — 位置必须从外面注入', 16, 156);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('方案史: 正弦编码(GPT era) → 可学习绝对位置 → RoPE 旋转(相对, 2020-)', 16, 178);
      ctx.fillStyle = C.dim;
      ctx.fillText('RoPE 胜出原因: 相对性 + 不引入新参数 + 理论优雅(旋转保内积)', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 旋转星图 (核心交互) ============ */
  (function () {
    var m = 12; /* 位置 */
    function draw() {
      var c = fit('rotCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var d = 128, base = 10000;
      var panels = 4;
      var idx = [0, 4, 12, 31];
      for (var p = 0; p < panels; p++) {
        var i = idx[p];
        var theta = Math.pow(base, -2 * i / d);
        var cx = 90 + p * ((c.w - 140) / (panels - 1));
        var cy = 100;
        var R = 52;
        /* 圆 */
        ctx.strokeStyle = 'rgba(139,148,158,.25)';
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        /* 初始向量 (位置0) */
        ctx.strokeStyle = C.dim;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
        /* 转过的弧 */
        var ang = m * theta;
        ctx.strokeStyle = C.orange;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.4, 0, ang % (Math.PI * 2)); ctx.stroke();
        /* 当前向量 */
        ctx.strokeStyle = C.pink; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(ang), cy - R * Math.sin(ang));
        ctx.stroke(); ctx.lineWidth = 1;
        /* 标注 */
        ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
        ctx.fillText('维度对 ' + i, cx - 26, cy + R + 20);
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        var turns = ang / (2 * Math.PI);
        ctx.fillText('θ=' + (theta >= 0.01 ? theta.toFixed(2) : theta.toExponential(1)), cx - 30, cy + R + 36);
        ctx.fillStyle = turns > 1 ? C.orange : C.green;
        ctx.fillText((turns >= 100 ? (turns / 1000).toFixed(1) + 'k' : turns.toFixed(2)) + ' 圈', cx - 18, cy + R + 52);
      }
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('位置 m=' + m + ': 高频飞转, 低频几乎不动', 16, 22);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('d=128 共 64 个频率, 从 ~6 pos 波长到 10^8 pos — 词序到整本书全包', 16, c.h - 8);
    }
    var slider = document.getElementById('posSlider');
    var lbl = document.getElementById('posLabel');
    if (slider) slider.addEventListener('input', function () {
      m = [1, 4, 12, 64, 256, 1024][parseInt(slider.value, 10)];
      if (lbl) lbl.textContent = 'm = ' + m;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 相对性: 共轭相消 ============ */
  (function () {
    function draw() {
      var c = fit('relCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('点积只看相对角度 — 绝对位置被消掉', 16, 22);
      /* 两个复平面 */
      [{ x: c.w * 0.25, n: 'q 在位置 m' }, { x: c.w * 0.7, n: 'k 在位置 n' }].forEach(function (pnl, k) {
        var cx = pnl.x, cy = 100, R = 44;
        ctx.strokeStyle = 'rgba(139,148,158,.25)';
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        var mAng = k === 0 ? 0.6 : 2.1;
        ctx.strokeStyle = k === 0 ? C.pink : C.blue; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(mAng), cy - R * Math.sin(mAng));
        ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = k === 0 ? C.pink : C.blue; ctx.font = FONT;
        ctx.fillText(pnl.n, cx - 36, cy + R + 22);
      });
      /* 中间夹角 */
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(c.w * 0.25 + 44 * Math.cos(0.6), 100 - 44 * Math.sin(0.6));
      ctx.lineTo(c.w * 0.7 + 44 * Math.cos(2.1), 100 - 44 * Math.sin(2.1));
      ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('夹角 (m − n)·θ', c.w / 2 - 60, 72);
      /* 公式 */
      ctx.fillStyle = C.text; ctx.font = 'bold 14px monospace';
      ctx.fillText('⟨q_m, k_n⟩ = ⟨q, k⟩ · cos((m−n)θ)', 16, 186);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('整体平移句子 (m,n 同加常数): 夹角不变, attention 分数不变 — 平移不变性', 16, 206);
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('模型读到的是「隔多远」, 不是「在第几位」— 更符合语言的本质', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 外推事故与续命 ============ */
  (function () {
    var scale = 1; /* 插值因子 */
    function draw() {
      var c = fit('extCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 训练区间条 */
      var bx = 50, bw2 = c.w - 100;
      ctx.fillStyle = 'rgba(126,231,135,.18)';
      ctx.fillRect(bx, 40, bw2 * 0.35, 30);
      ctx.strokeStyle = C.green; ctx.strokeRect(bx, 40, bw2 * 0.35, 30);
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('训练见过: 0 ~ 4096', bx + 8, 60);
      /* 越界区 */
      ctx.fillStyle = 'rgba(248,81,73,.12)';
      ctx.fillRect(bx + bw2 * 0.35, 40, bw2 * 0.65, 30);
      ctx.strokeStyle = C.red; ctx.strokeRect(bx + bw2 * 0.35, 40, bw2 * 0.65, 30);
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('没见过: 角度爆表 → 崩', bx + bw2 * 0.35 + 10, 60);
      /* 128k 目标 */
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('128k', bx + bw2 - 30, 88);
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(bx + bw2, 40); ctx.lineTo(bx + bw2, 130); ctx.stroke();
      ctx.setLineDash([]);
      /* 角度条 (当前 scale) */
      var trainFrac = Math.min(1, 1 / scale);
      ctx.fillStyle = 'rgba(255,166,87,.4)';
      ctx.fillRect(bx, 106, bw2 * trainFrac * 0.35, 24);
      ctx.strokeStyle = C.orange; ctx.strokeRect(bx, 106, bw2 * trainFrac * 0.35, 24);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('插值后 128k 的角度被压回: ' + (scale === 1 ? '未插值 — 爆表' : '×1/' + scale.toFixed(0) + ' → ' + (128 / scale).toFixed(1) + 'k 相当于训练 ' + (4.096 / scale).toFixed(2) + 'k'), bx, 146);
      /* 三方案 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('PI 线性内插: 全部 θ/s — 简单粗暴, 高频受损需微调', 16, 176);
      ctx.fillText('NTK-aware: 只压低频 (base 10000→10000^s^~1) — 保住词序分辨率', 16, 196);
      ctx.fillText('YaRN: NTK + 注意力温度 + 分段 — 免微调近似, 主流选择', 16, 216);
      ctx.fillStyle = C.purple; ctx.font = MONO;
      ctx.fillText('2026: base 直接提到 500k~5M, 从头训练长上下文', 16, c.h - 8);
    }
    var slider = document.getElementById('piSlider');
    var lbl = document.getElementById('piLabel');
    if (slider) slider.addEventListener('input', function () {
      var v = parseInt(slider.value, 10);
      scale = [1, 2, 4, 8, 16, 32][v];
      if (lbl) lbl.textContent = scale === 1 ? '未插值' : 's = ' + scale;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 长上下文账单 ============ */
  (function () {
    function draw() {
      var c = fit('billCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('RoPE 解决「能不能表示」, 账单在别处', 16, 22);
      var rows = [
        { n: 'KV Cache @128k', v: '64 GB', link: 'kv-cache 页', col: C.red },
        { n: 'attention 分数 N²', v: '16.4G 元', link: 'flash-attention 页', col: C.orange },
        { n: '显存装不下?', v: '分页 + 流式', link: 'pagedattn / airllm 页', col: C.purple },
        { n: '位置表示', v: 'RoPE 搞定', link: '本页', col: C.green }
      ];
      rows.forEach(function (r, i) {
        var y = 42 + i * 40;
        ctx.fillStyle = r.col + '18';
        ctx.fillRect(16, y, c.w - 32, 32);
        ctx.strokeStyle = r.col; ctx.strokeRect(16, y, c.w - 32, 32);
        ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
        ctx.fillText(r.n, 26, y + 21);
        ctx.fillStyle = r.col; ctx.font = MONO;
        ctx.fillText(r.v, 300, y + 21);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.link, 450, y + 21);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('长上下文 = 位置表示(RoPE) + 显存管理(分页) + 计算优化(FA) + 调度(连续批处理) — 四页拼图', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 读发布会的姿势 ============ */
  (function () {
    function draw() {
      var c = fit('readCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.pink; ctx.font = MONO;
      ctx.fillText('「支持 1M token 上下文」怎么读?', 16, 22);
      var qs = [
        ['训练到多长?', 'base 10k 训 8k + YaRN 外推 ≠ 从头训 1M'],
        ['大海捞针测过?', '针插得准 ≠ 全文推理强'],
        ['价目表?', '1M 上下文的 prefill 账单是 128k 的 64 倍'],
        ['真实用法?', '多数场景 RAG 前 8k 挡 90% 的活']
      ];
      qs.forEach(function (q, i) {
        var y = 44 + i * 40;
        ctx.fillStyle = 'rgba(247,120,186,.1)';
        ctx.fillRect(16, y, c.w - 32, 32);
        ctx.strokeStyle = C.pink; ctx.strokeRect(16, y, c.w - 32, 32);
        ctx.fillStyle = C.pink; ctx.font = 'bold 12.5px monospace';
        ctx.fillText('问 ' + (i + 1) + ': ' + q[0], 26, y + 21);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(q[1], 200, y + 21);
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('百万 token 是工程杂技: 外推 + 微调 + RAG 兜底混达成的 — 读宣传语先问这四句', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
