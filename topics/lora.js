/* lora.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 训练账单: 每参数 16 字节 ============ */
  (function () {
    function draw() {
      var c = fit('billCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('训练时每个参数要养几份?', 16, 22);
      var parts = [
        { n: 'fp16 权重', b: 2, col: C.blue },
        { n: 'fp16 梯度', b: 2, col: C.green },
        { n: 'fp32 母版', b: 4, col: C.orange },
        { n: 'Adam m+v', b: 8, col: C.red }
      ];
      var x = 16;
      parts.forEach(function (p) {
        var w = p.b / 16 * (c.w - 60);
        ctx.fillStyle = p.col + '66';
        ctx.fillRect(x, 36, w - 4, 30);
        ctx.strokeStyle = p.col; ctx.strokeRect(x, 36, w - 4, 30);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(p.n + ' (' + p.b + 'B)', x + 6, 55);
        x += w;
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('合计 16 B/参数', 16, 92);
      /* 对比条 */
      var rows = [
        { n: '7B 推理', gb: 14, col: C.blue },
        { n: '7B 全参训练', gb: 112, col: C.orange },
        { n: '70B 全参训练', gb: 1120, col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 108 + i * 34;
        var w = r.gb / 1120 * (c.w - 260);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(190, y, Math.max(6, w), 22);
        ctx.strokeStyle = r.col; ctx.strokeRect(190, y, Math.max(6, w), 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 16);
        ctx.font = MONO;
        ctx.fillText(r.gb + ' GB', 196 + Math.max(6, w) + 6, y + 16);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('70B 全参微调 = 1.1TB = 14 张 A100-80G — 这就是「微调一只大模型」的真实门槛 (对照量化页 140GB 推理)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · rank 滑块 (核心交互) ============ */
  (function () {
    var r = 16;
    function draw() {
      var c = fit('rankCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var d = 4096, k = 4096;
      /* 左: 全量矩阵 */
      var mx = 30, my = 40, ms = 110;
      ctx.fillStyle = 'rgba(88,166,255,.2)';
      ctx.fillRect(mx, my, ms, ms);
      ctx.strokeStyle = C.blue; ctx.strokeRect(mx, my, ms, ms);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('W', mx + ms / 2 - 8, my + ms / 2 + 5);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('d×k = 16.8M 参数', mx - 10, my + ms + 20);
      /* 中间等号 */
      ctx.fillStyle = C.text; ctx.font = 'bold 20px monospace';
      ctx.fillText('+', mx + ms + 26, my + ms / 2 + 7);
      /* 右: B·A 分解 */
      var bx = mx + ms + 60;
      var hB = Math.min(ms, 20 + r * 3);
      var wA = Math.min(ms, 20 + r * 3);
      /* B: d x r 竖条 */
      ctx.fillStyle = 'rgba(247,120,186,.35)';
      ctx.fillRect(bx, my, 26, ms);
      ctx.strokeStyle = C.pink; ctx.strokeRect(bx, my, 26, ms);
      ctx.fillStyle = C.pink; ctx.font = FONT;
      ctx.fillText('B d×' + r, bx - 10, my - 10);
      ctx.fillStyle = C.text; ctx.font = 'bold 20px monospace';
      ctx.fillText('·', bx + 36, my + ms / 2 + 7);
      /* A: r x k 横条 */
      var ax = bx + 50;
      ctx.fillStyle = 'rgba(126,231,135,.35)';
      ctx.fillRect(ax, my + ms / 2 - 12, ms, 24);
      ctx.strokeStyle = C.green; ctx.strokeRect(ax, my + ms / 2 - 12, ms, 24);
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('A ' + r + '×k', ax, my + ms / 2 - 20);
      /* 数字 */
      var pct = (r * (d + k)) / (d * k) * 100;
      var loraM = (r * (d + k) / 1e6).toFixed(2);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('ΔW = B·A', ax + ms + 30, my + 24);
      ctx.fillStyle = r <= 16 ? C.green : (r <= 64 ? C.orange : C.red);
      ctx.fillText(loraM + 'M (' + pct.toFixed(1) + '%)', ax + ms + 30, my + 48);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      var verdict = r <= 8 ? '风格/格式: 绰绰有余' : (r <= 16 ? '大多数任务的甜点区' : (r <= 64 ? '领域知识迁移' : '边际收益骤减 — 考虑全参'));
      ctx.fillText('r=' + r + ' · ' + verdict, ax + ms + 30, my + 72);
      /* 关键句 */
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('冻结的 W 永不动 — 训练的只有 B 和 A · Wx 变成 Wx + B·A·x', 30, my + ms + 44);
      ctx.fillStyle = C.dim;
      ctx.fillText('直觉: 微调是「小改动」, 小改动天然低秩 — 值得一提: B 初始化为 0, 训练从 ΔW=0 平滑出发', 30, my + ms + 64);
    }
    var slider = document.getElementById('rankSlider');
    var lbl = document.getElementById('rankLabel');
    if (slider) slider.addEventListener('input', function () {
      r = [1, 4, 8, 16, 32, 64, 128, 256][parseInt(slider.value, 10)];
      if (lbl) lbl.textContent = 'r=' + r;
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 三档方案显存对比 ============ */
  (function () {
    function draw() {
      var c = fit('cmpCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: '全参微调 70B', gb: 1120, note: '14 × A100-80G', col: C.red },
        { n: 'LoRA 70B (r=16)', gb: 160, note: '2 × A100-80G', col: C.orange },
        { n: 'QLoRA 70B', gb: 48, note: '1 × 48G 卡', col: C.green },
        { n: 'QLoRA 7B', gb: 8, note: '1 × 12G 卡', col: C.green }
      ];
      var maxG = 1150;
      rows.forEach(function (r, i) {
        var y = 24 + i * ((c.h - 70) / 4);
        var w = r.gb / maxG * (c.w - 380);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(210, y, Math.max(8, w), 26);
        ctx.strokeStyle = r.col; ctx.strokeRect(210, y, Math.max(8, w), 26);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 18);
        ctx.font = MONO;
        ctx.fillText(r.gb + ' GB', 216 + Math.max(8, w) + 8, y + 18);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.note, 216 + Math.max(8, w) + 88, y + 18);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('同是微调 70B: 1120 → 48 GB, 23 倍差距 — 「冻结 + 低秩 + 4bit 底座」三连击', 16, c.h - 28);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('QLoRA: 权重 NF4 存储 + LoRA 参数保持 fp16 训练 + 分页优化器防峰值溢出 (量化页的 QLoRA 钩子)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 冻结思想家族 ============ */
  (function () {
    function draw() {
      var c = fit('familyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('「冻结大部 · 只训小部」思想家族', 16, 22);
      var cards = [
        { n: 'LoRA', d: '冻结基座|只训 ΔW=B·A', link: '本页', col: C.blue },
        { n: 'Mostik', d: '冻结 753B+4B 双模型|只训 bridge', link: 'mostik.html', col: C.purple },
        { n: 'Adapters', d: '冻结基座|层间插小模块', link: '本页变体', col: C.green },
        { n: 'Prompt/Prefix', d: '模型完全冻结|只学软提示向量', link: '本页变体', col: C.orange },
        { n: '线性探测', d: '冻结骨干|只训分类头', link: 'vit-clip.html', col: C.pink }
      ];
      cards.forEach(function (cd, i) {
        var x = 16 + i * (c.w - 32) / 5;
        var bw = (c.w - 32) / 5 - 10;
        ctx.fillStyle = cd.col + '16';
        ctx.fillRect(x, 36, bw, 88);
        ctx.strokeStyle = cd.col; ctx.strokeRect(x, 36, bw, 88);
        ctx.fillStyle = cd.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(cd.n, x + 10, 58);
        cd.d.split('|').forEach(function (ln, j) {
          ctx.fillStyle = C.dim; ctx.font = '11.5px sans-serif';
          ctx.fillText(ln, x + 10, 80 + j * 16);
        });
        ctx.fillStyle = cd.col; ctx.font = '11px monospace';
        ctx.fillText(cd.link, x + 10, 116);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('共同洞察: 大模型的知识已经够用, 任务适配只需要动很小一块 — 小到低秩/桥接/几个向量就装得下', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · LoRA vs 全参 vs RAG 决策 ============ */
  (function () {
    function draw() {
      var c = fit('decisionCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { q: '想要什么', a: '换知识 (昨天的财报)', b: '改行为 (风格/格式/领域语感)', d: 'RAG 页已答: 检索' },
        { q: '数据量', a: '几万条以上', b: '几百~几万条', d: '-' },
        { q: '更新频率', a: '低 (训练一次用很久)', b: '低', d: '高 (随时换文档)' },
        { q: '预算', a: '多卡集群', b: '单张消费级卡', d: '无需训练' },
        { q: '本知识库', a: '全参微调 (Pretraining页的继续)', b: 'LoRA/QLoRA (本页)', d: 'RAG (rag.html)' }
      ];
      /* 表头 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('问题维度', 20, 26);
      ctx.fillStyle = C.orange;
      ctx.fillText('全参微调', c.w / 2 - 180, 26);
      ctx.fillStyle = C.green;
      ctx.fillText('LoRA/QLoRA', c.w / 2 + 20, 26);
      ctx.fillStyle = C.blue;
      ctx.fillText('RAG', c.w - 130, 26);
      rows.forEach(function (r, i) {
        var y = 48 + i * 30;
        ctx.fillStyle = i % 2 ? 'rgba(139,148,158,.05)' : 'transparent';
        ctx.fillRect(14, y - 16, c.w - 28, 26);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.q, 20, y + 2);
        ctx.fillStyle = C.orange; ctx.font = '12.5px sans-serif';
        ctx.fillText(r.a, c.w / 2 - 180, y + 2);
        ctx.fillStyle = C.green;
        ctx.fillText(r.b, c.w / 2 + 20, y + 2);
        ctx.fillStyle = C.blue;
        ctx.fillText(r.d, c.w - 130, y + 2);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('现实配方: 知识用 RAG 挂, 行为用 LoRA 改, 两者不冲突', 20, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 坑: 灾难性遗忘 ============ */
  (function () {
    function draw() {
      var c = fit('forgetCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 能力保留对比 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('微调后的「副作用」: 学会新本事, 忘掉旧本事?', 16, 22);
      var groups = [
        { n: '全参微调', bars: [['新任务', 95, C.green], ['通用能力', 62, C.red]] },
        { n: 'LoRA (冻结基座)', bars: [['新任务', 88, C.green], ['通用能力', 93, C.green]] },
        { n: 'LoRA + 混入通用数据', bars: [['新任务', 90, C.green], ['通用能力', 96, C.green]] }
      ];
      groups.forEach(function (g, i) {
        var x = 30 + i * (c.w - 60) / 3;
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(g.n, x, 48);
        g.bars.forEach(function (b, j) {
          var y = 60 + j * 40;
          ctx.fillStyle = C.dim; ctx.font = '11.5px sans-serif';
          ctx.fillText(b[0], x, y - 4);
          var w = b[1] / 100 * ((c.w - 60) / 3 - 30);
          ctx.fillStyle = b[2] + '55';
          ctx.fillRect(x, y, w, 16);
          ctx.strokeStyle = b[2]; ctx.strokeRect(x, y, w, 16);
          ctx.fillStyle = b[2]; ctx.font = 'bold 11px monospace';
          ctx.fillText(b[1], x + w + 6, y + 12);
        });
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('数字为示意 — 冻结本身就是防遗忘的保险: 基座没动过, 通用能力的「地基」不会塌', 16, c.h - 30);
      ctx.fillStyle = C.green;
      ctx.fillText('全参的通用能力衰减是真实风险; LoRA 天然温和, 再混 5-10% 通用数据双保险', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
