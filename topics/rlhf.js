/* rlhf.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 为什么需要对齐 ============ */
  (function () {
    function draw() {
      var c = fit('problemCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('用户: 帮我取消会员', 16, 20);
      /* 左: base 续写 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('预训练模型 (续写训练):', 16, 44);
      var base = ['取消会员要收费吗?', '会员怎么退?', '我也要取消!!'];
      base.forEach(function (s, i) {
        ctx.fillStyle = 'rgba(248,81,73,.18)';
        ctx.fillRect(16, 52 + i * 24, c.w / 2 - 40, 20);
        ctx.fillStyle = C.red; ctx.font = FONT;
        ctx.fillText(s, 24, 66 + i * 24);
      });
      /* 右: 对齐后 */
      var rx = c.w / 2 + 12;
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('对齐后 (RLHF):', rx, 44);
      var al = ['1. 打开 设置→账户', '2. 订阅管理 → 取消', '确认后下期不续费 ✓'];
      al.forEach(function (s, i) {
        ctx.fillStyle = 'rgba(126,231,135,.15)';
        ctx.fillRect(rx, 52 + i * 24, c.w / 2 - 28, 20);
        ctx.fillStyle = C.green; ctx.font = FONT;
        ctx.fillText(s, rx + 8, 66 + i * 24);
      });
      /* 底部 1.3B vs 175B */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('人类偏好评估: 1.3B InstructGPT 胜 175B GPT-3  约 85% 的对比', 16, 142);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('参数少 130 倍却更有用 — 预训练学「世界怎么运转」, 对齐学「人要什么」', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · RLHF 三步流水线 (核心交互) ============ */
  (function () {
    var step = 0;
    var STAGES = [
      { n: 'SFT', d: '13k 人工演示', r: '学会助手格式', col: C.blue },
      { n: 'RM', d: '33k A>B 偏好对', r: '学会给回答打分', col: C.green },
      { n: 'PPO', d: '31k 提示 + RM 当教练', r: '优化策略 + KL 缰绳', col: C.purple }
    ];
    function draw() {
      var c = fit('pipeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var bw = (c.w - 70) / 3 - 14;
      STAGES.forEach(function (s, i) {
        var x = 20 + i * (bw + 30);
        var active = i < step;
        var cur = i === step;
        ctx.fillStyle = active ? s.col + '30' : (cur ? s.col + '18' : 'rgba(48,54,61,.25)');
        ctx.fillRect(x, 30, bw, c.h - 84);
        ctx.strokeStyle = cur ? s.col : (active ? s.col : C.dark);
        ctx.lineWidth = cur ? 2.5 : 1;
        ctx.strokeRect(x, 30, bw, c.h - 84);
        ctx.lineWidth = 1;
        ctx.fillStyle = cur ? s.col : (active ? s.col : C.dim);
        ctx.font = 'bold 15px monospace';
        ctx.fillText('步骤 ' + (i + 1) + ' · ' + s.n, x + 14, 58);
        ctx.fillStyle = active || cur ? C.text : C.dim;
        ctx.font = FONT;
        ctx.fillText('数据: ' + s.d, x + 14, 84);
        ctx.fillStyle = active || cur ? s.col : C.dim;
        ctx.fillText('得到: ' + s.r, x + 14, 104);
        if (cur) {
          ctx.fillStyle = C.orange; ctx.font = MONO;
          ctx.fillText('◀ 正在进行', x + 14, 128);
        } else if (active) {
          ctx.fillStyle = C.green;
          ctx.fillText('✓ 完成', x + 14, 128);
        }
        if (i < 2) {
          ctx.strokeStyle = active || cur ? C.dim : C.dark;
          ctx.beginPath(); ctx.moveTo(x + bw + 4, 60); ctx.lineTo(x + bw + 24, 60); ctx.stroke();
        }
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      var notes = [
        '点按钮开始 — 三步各养一个模型, 上一步的输出是下一步的教练',
        'SFT: 像临摹 — 看范例学格式, 但分不清好坏',
        'RM: 像裁判 — Bradley-Terry 拟合人类偏好, 会打分了',
        'PPO: 像带教练训练 — 最大化 RM 分数, 但被 KL 拴住不许跑偏'
      ];
      ctx.fillText(notes[step], 20, c.h - 16);
    }
    var btn = document.getElementById('rlBtn');
    if (btn) btn.addEventListener('click', function () {
      step = (step + 1) % 4;
      btn.textContent = step < 3 ? '下一步 → (' + step + '/3)' : (step === 3 ? '✓ 全部完成 (点我重置)' : '▶ 开始三步训练');
      if (step === 0) btn.textContent = '▶ 开始三步训练';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · Reward Hacking / Goodhart ============ */
  (function () {
    function draw() {
      var c = fit('goodhartCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 56, y0 = c.h - 40, x1 = c.w - 24, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('分数', 10, y1 + 8);
      ctx.fillText('PPO 训练步 →', x0 + 40, c.h - 12);
      var rm = [0.20, 0.38, 0.56, 0.72, 0.84, 0.92];
      var tq = [0.20, 0.35, 0.44, 0.42, 0.33, 0.26];
      function py(v) { return y0 - v / 1.0 * (y0 - y1) * 0.92; }
      function px(i) { return x0 + i / 5 * (x1 - x0); }
      /* y 刻度 */
      [0.2, 0.4, 0.6, 0.8].forEach(function (v) {
        var y = py(v);
        ctx.strokeStyle = 'rgba(139,148,158,.15)';
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.fillStyle = C.dim;
        ctx.fillText(v.toFixed(1), x0 - 30, y + 4);
      });
      /* 两条线 */
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.beginPath();
      rm.forEach(function (v, i) { if (i === 0) ctx.moveTo(px(i), py(v)); else ctx.lineTo(px(i), py(v)); });
      ctx.stroke();
      ctx.strokeStyle = C.red; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      tq.forEach(function (v, i) { if (i === 0) ctx.moveTo(px(i), py(v)); else ctx.lineTo(px(i), py(v)); });
      ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
      /* 交叉点标注 */
      var cx = px(2.5), cy = py(0.43);
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, y0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('交叉点: 此后 RM 越高, 真实越差', cx - 60, cy - 12);
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('RM 打的分 (一直涨)', x1 - 150, 40);
      ctx.fillStyle = C.red;
      ctx.fillText('真实质量 (先升后降)', x1 - 150, 58);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('Goodhart 定律: 代理指标被优化过头, 就不再是好指标 — 模型学会「讨好裁判」而非「真的答好」', x0, y0 + 22);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · KL 缰绳 ============ */
  (function () {
    function draw() {
      var c = fit('klCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* base 模型山丘 */
      var bx = c.w * 0.22, by = c.h - 46;
      ctx.fillStyle = 'rgba(88,166,255,.15)';
      ctx.beginPath();
      ctx.moveTo(bx - 90, by);
      ctx.quadraticCurveTo(bx, by - 130, bx + 90, by);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.blue; ctx.stroke();
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('SFT 参考模型 π_ref', bx - 46, by + 16);
      /* policy 小球: 距离越远 KL 越大 */
      var px = c.w * 0.62, py = by - 40;
      ctx.fillStyle = C.purple;
      ctx.beginPath(); ctx.arc(px, py, 10, 0, 7); ctx.fill();
      ctx.fillStyle = C.purple; ctx.font = FONT;
      ctx.fillText('策略 π (在 RM 引力下狂奔)', px - 40, py - 20);
      /* 缰绳 */
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx + 30, by - 44); ctx.lineTo(px - 10, py); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('KL 缰绳: β·KL(π‖π_ref)', (bx + px) / 2 - 70, (by + py) / 2 - 10);
      /* RM 引力 */
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('RM 高分区 →', c.w - 110, py - 44);
      /* 公式 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('目标 = E[RM(x)] − β·KL(π‖π_ref)', 16, 24);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('β 太小 → reward hacking (上图) · β 太大 → 寸步难行回到 SFT · 拉锯找平衡', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · DPO: 跳过 RM ============ */
  (function () {
    function draw() {
      var c = fit('dpoCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 上下两条流水线 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('PPO (三步, 4 个模型同住显存):', 16, 24);
      var ppo = ['SFT', 'RM 训练', 'RM 当教练', 'PPO 优化'];
      var x = 16;
      ppo.forEach(function (s, i) {
        var w = (c.w - 60) / 4 - 12;
        ctx.fillStyle = 'rgba(163,113,247,.15)';
        ctx.fillRect(x, 34, w, 34);
        ctx.strokeStyle = C.purple; ctx.strokeRect(x, 34, w, 34);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(s, x + w / 2 - 20, 55);
        if (i < 3) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + w + 2, 51); ctx.lineTo(x + w + 10, 51); ctx.stroke();
        }
        x += w + 12;
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('DPO (一步, 2 个模型):', 16, 96);
      var dpo = ['偏好对直接进 loss', 'policy + ref 搞定'];
      x = 16;
      dpo.forEach(function (s, i) {
        var w = (c.w - 60) / 2 - 16;
        ctx.fillStyle = 'rgba(126,231,135,.15)';
        ctx.fillRect(x, 106, w, 34);
        ctx.strokeStyle = C.green; ctx.strokeRect(x, 106, w, 34);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(s, x + 14, 127);
        if (i < 1) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + w + 2, 123); ctx.lineTo(x + w + 12, 123); ctx.stroke();
        }
        x += w + 24;
      });
      /* loss 曲线 */
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('DPO loss = −log σ( β·[ log π(w)/π_ref(w) − log π(l)/π_ref(l) ] )', 16, 162);
      /* 4 个点 */
      var pts = [
        { z: 0.00, l: 0.693, lbl: '平手' },
        { z: 0.05, l: 0.668, lbl: '略好' },
        { z: 0.15, l: 0.621, lbl: '更好' },
        { z: 0.30, l: 0.554, lbl: '远好' }
      ];
      var x0 = 60, y0 = c.h - 22;
      pts.forEach(function (p, i) {
        var px2 = x0 + i * 110;
        var py2 = y0 - p.l * 90;
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(px2, py2, 5, 0, 7); ctx.fill();
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(p.lbl + ' z=' + p.z.toFixed(2), px2 - 26, py2 - 14);
        ctx.fillText('loss ' + p.l.toFixed(3), px2 - 22, py2 + 18);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('赢者与输者的隐式奖励差 (z) 越大, loss 越小 — 论文标题: 「你的语言模型其实已经是奖励模型」', 16, c.h - 4);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 2026 汇流 ============ */
  (function () {
    function draw() {
      var c = fit('evolveCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var nodes = [
        { n: 'RLHF-PPO', d: '2022 InstructGPT', col: C.blue, x: 0.08 },
        { n: 'RLAIF/宪法AI', d: 'AI 反馈替代人类标注', col: C.green, x: 0.30 },
        { n: 'DPO 家族', d: '离线 · 简单 · 稳', col: C.orange, x: 0.52 },
        { n: 'GRPO 规则奖励', d: '2024 R1: 答案对错当奖励', col: C.purple, x: 0.74 },
        { n: '2026 主流', d: '偏好对齐 + 推理 RL 双轨', col: C.pink, x: 0.92 }
      ];
      nodes.forEach(function (nd, i) {
        var x = nd.x * (c.w - 130) + 16;
        var y = c.h / 2 - 30;
        ctx.fillStyle = nd.col + '25';
        ctx.fillRect(x - 8, y - 26, 122, 64);
        ctx.strokeStyle = nd.col; ctx.strokeRect(x - 8, y - 26, 122, 64);
        ctx.fillStyle = nd.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(nd.n, x, y - 6);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(nd.d, x, y + 14);
        if (i < nodes.length - 1) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + 116, y + 4); ctx.lineTo(x + 130, y + 4); ctx.stroke();
        }
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('共同骨架: 「更好的输出 → 更高的分数 → 更新权重」 — 变的只是分数谁来打: 人类 / AI / 规则 / 数学', 16, c.h - 14);
    }
    draw(); redraws.push(draw);
  })();

})();
