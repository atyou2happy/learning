/* merging.js P1 — 图1 四则运算 + 图2 操作面板 */
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

  /* ============ 图1 · 四则运算 ============ */
  (function () {
    function draw() {
      var c = fit('arithCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('τ = M_ft − M_base — 技能的四则运算 (node 实测 cos)', 14, 20);
      var ops = [
        { f: 'M + τ_A + τ_B', n: '加 = 同时会两技能', v: 'cos(w,u)=0.708 cos(w,v)=0.706 (双保留 1/√2)', col: C.green },
        { f: 'M + τ_A − τ_A', n: '减 = 遗忘 A', v: 'cos(,u)=0.000 cos(,v)=1.000 (只剩 B)', col: C.blue },
        { f: 'M − τ_align', n: '乘负 = 反学习', v: '剥除能力 (对齐可被减法绕过的原因)', col: C.red },
        { f: 'M + α·τ_A', n: '缩放 = 强度旋钮', v: 'α<1 减弱 α>1 增强 (过冲有上限)', col: C.orange }
      ];
      ops.forEach(function (o, i) {
        var y = 42 + i * 46;
        ctx.strokeStyle = o.col; ctx.fillStyle = o.col + '12';
        ctx.fillRect(20, y, c.w - 40, 38); ctx.strokeRect(20, y, c.w - 40, 38);
        ctx.fillStyle = o.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(o.f, 34, y + 16);
        ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(o.n, 240, y + 16);
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(o.v, 34, y + 32);
      });
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('技能生活在近似线性的权重空间 — 一切合并方法的地基', 20, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · LoRA 同构 ============ */
  (function () {
    function draw() {
      var c = fit('vecCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('ΔW = B·A 就是任务向量 — LoRA 插卡的算术身份', 14, 20);
      /* left: LoRA card as vector */
      ctx.strokeStyle = C.purple;
      ctx.fillStyle = C.purple + '18';
      ctx.fillRect(24, 44, 230, 120); ctx.strokeRect(24, 44, 230, 120);
      ctx.fillStyle = C.purple; ctx.font = 'bold 12.5px monospace';
      ctx.fillText('LoRA 卡', 40, 68);
      ctx.fillStyle = C.text; ctx.font = '12px monospace';
      ctx.fillText('ΔW = B·A (d×r · r×k)', 40, 92);
      ctx.fillText('= 一个低秩任务向量', 40, 112);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('多 LoRA = 可插拔技能包', 40, 140);
      /* right: three uses */
      var uses = [
        { n: '合并', d: '两张卡的增量都加进基座 → 一个模型双技能', col: C.green },
        { n: '切换', d: '运行时换卡 → S GPU 显存多个人格', col: C.blue },
        { n: '剥离', d: '减法可逆 → 对齐安全的负债', col: C.red }
      ];
      uses.forEach(function (u, i) {
        var y = 44 + i * 42;
        ctx.fillStyle = u.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(u.n, 290, y + 14);
        ctx.fillStyle = C.text; ctx.font = '11.5px monospace';
        ctx.fillText(u.d, 345, y + 14);
      });
      /* arrow */
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(254, 104); ctx.lineTo(284, 104); ctx.stroke();
      ctx.fillStyle = C.dim;
      ctx.fillText('→', 258, 98);
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('swarm 微调 N 个小模型再合并 — 一次训练预算买多个专家', 24, 192);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('技能从「模型文件」降维成「N 维数组」— 可加可减可分发', 24, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
/* merging.js P2 — 图3 夹角模拟器 + 图4 四代方法 */
  /* ============ 图3 · 夹角冲突模拟器 ============ */
  (function () {
    var ang = 90;   /* degrees */
    var slider = document.getElementById('angSlider');
    var label = document.getElementById('angVal');
    if (slider) slider.addEventListener('input', function () {
      ang = parseInt(slider.value, 10);
      if (label) label.textContent = ang + '°';
      draw();
    });
    function draw() {
      var c = fit('confCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rad = ang * Math.PI / 180;
      var cosv = Math.cos(rad);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('夹角 ' + ang + '° — 合并后双任务保留度', 14, 20);
      /* vector geometry (left) */
      var ox = 130, oy = 190, L = 110;
      ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - L); ctx.stroke();
      ctx.strokeStyle = C.blue;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + L * Math.sin(rad), oy - L * cosv); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.green; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('τ_A', ox - 20, oy - L - 8);
      ctx.fillStyle = C.blue;
      ctx.fillText('τ_B', ox + L * Math.sin(rad) + 6, oy - L * cosv - 4);
      ctx.fillStyle = C.dim;
      ctx.fillText(ang + '°', ox + 14, oy - 12);
      /* merged vector */
      var mx = (0 + L * Math.sin(rad)) / 2, my = (-L - L * cosv) / 2;
      ctx.strokeStyle = C.red; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + mx, oy + my); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red;
      ctx.fillText('w=τ_A+τ_B', ox + mx + 6, oy + my);
      /* right: retention bars. merged vector makes angle with each: cos = sqrt((1+cosv)/2) */
      var keepA = Math.sqrt((1 + cosv) / 2);
      var keepB = keepA;   /* symmetric by construction */
      var conflict = (1 - keepA) * 100;
      var rows = [
        { n: '任务 A 保留', v: keepA * 100, col: C.green },
        { n: '任务 B 保留', v: keepB * 100, col: C.blue },
        { n: '冲突损耗', v: 100 - keepA * 100, col: C.red }
      ];
      var bx = 300, bw = c.w - bx - 120;
      rows.forEach(function (r, i) {
        var y = 44 + i * 44;
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.n, bx, y + 4);
        ctx.fillStyle = C.dark; ctx.fillRect(bx, y + 10, bw, 16);
        ctx.fillStyle = r.col; ctx.fillRect(bx, y + 10, bw * r.v / 100, 16);
        ctx.fillStyle = r.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.v.toFixed(1) + '%', bx + bw + 8, y + 23);
      });
      /* verdict */
      var verdict = ang > 75 ? '正交: 平面叠加, 各留 1/√2 ≈ 71% — 高维随机方向的默认待遇'
        : (ang > 30 ? '部分重叠: 同维踩脚开始 — 符号冲突与过冲并存'
          : '近共线: 完全冲突 — 只能留一个, 线性合并失效');
      ctx.fillStyle = ang > 75 ? C.green : (ang > 30 ? C.orange : C.red);
      ctx.font = 'bold 12px monospace';
      ctx.fillText(verdict, 300, 186);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('(保留度 = cos(w, τ) = √((1+cosθ)/2), 玩具模型)', 300, 204);
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('高维随机两方向 cos ~ 1/√N → 0: 正交是免费的默认值 — 「维度祝福」', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 四代方法 + DARE 干扰账 ============ */
  (function () {
    function draw() {
      var c = fit('methodCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('四代方法 — 每代治上代的病', 14, 20);
      var gens = [
        { n: '① 线性平均', d: '直接相加/平均 — 正交时够用', fix: '病: 冲突维互相抵消', col: C.dim },
        { n: '② SLERP', d: '球面插值走大圆 — 保范数', fix: '病: 直线中点范数失真', col: C.blue },
        { n: '③ TIES (2023)', d: '剪枝→符号仲裁→平均', fix: '治: 抵消 (输家清零)', col: C.purple },
        { n: '④ DARE (2023)', d: '随机丢 90% + ×10 缩放', fix: '治: 干扰 — 让路比仲裁便宜', col: C.orange }
      ];
      gens.forEach(function (g, i) {
        var x = 14 + i * ((c.w - 28) / 4);
        var w = (c.w - 28) / 4 - 8;
        ctx.strokeStyle = g.col; ctx.fillStyle = g.col + '10';
        ctx.fillRect(x, 36, w, 92); ctx.strokeRect(x, 36, w, 92);
        ctx.fillStyle = g.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(g.n, x + 10, 56);
        ctx.fillStyle = C.text; ctx.font = '10.5px monospace';
        ctx.fillText(g.d, x + 10, 76);
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        ctx.fillText(g.fix, x + 10, 96);
        ctx.fillText(g.fix2 || '', x + 10, 112);
      });
      /* DARE interference bars */
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('DARE 干扰账 (100 重叠维, 双方存活冲突维期望 = 100·k², node 实算)', 14, 156);
      var rows = [
        { k: 1.0, n: '不丢 (k=1)', conf: 100, col: C.red },
        { k: 0.5, n: '丢 50%', conf: 25, col: C.orange },
        { k: 0.1, n: '丢 90%', conf: 1, col: C.green },
        { k: 0.01, n: '丢 99%', conf: 0.01, col: C.green }
      ];
      rows.forEach(function (r, i) {
        var y = 172 + i * 24;
        ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
        ctx.fillText(r.n, 24, y + 10);
        var bx = 110, bw = c.w / 2 - 150;
        ctx.fillStyle = C.dark; ctx.fillRect(bx, y, bw, 14);
        ctx.fillStyle = r.col; ctx.fillRect(bx, y, Math.max(1.5, bw * r.conf / 100), 14);
        ctx.fillStyle = r.col; ctx.font = 'bold 11px monospace';
        ctx.fillText(r.conf >= 1 ? r.conf.toFixed(0) + ' 个冲突维' : r.conf.toFixed(2) + ' 个', bx + bw + 8, y + 11);
      });
      ctx.fillStyle = C.green; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('丢 90%: 干扰 ÷100 (k²衰减) > 自身损失 ÷10 (缩放补回) — 净赚', c.w / 2 + 40, 210);
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('Yu 2023: 95 任务性能 ≈ 不降 — 与 dropout 抑制共适应同族', c.w / 2 + 40, 228);
    }
    draw(); redraws.push(draw);
  })();
/* merging.js P3 — 图5 三方案账本 + 关闭 IIFE */
  /* ============ 图5 · 三种多任务方案 ============ */
  (function () {
    function draw() {
      var c = fit('costCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('一个模型会 N 个任务 — 三条路线的账', 14, 20);
      var rows = [
        {
          n: '合并', col: C.green,
          cells: ['训练: N 次 LoRA + 一次算术', '推理: 0 额外开销', '上限: 受冲突制约'],
          verdict: 'mergekit 一行配置 — frankenmerge 文化'
        },
        {
          n: '多 LoRA 路由', col: C.blue,
          cells: ['训练: N 次微调', '推理: 换卡开销', '上限: 技能无损'],
          verdict: '工程复杂, 灵活但重'
        },
        {
          n: '大一统微调', col: C.orange,
          cells: ['训练: 一次混合数据', '推理: 0 额外开销', '上限: 最高'],
          verdict: '要一次性预算 + 数据工程'
        }
      ];
      rows.forEach(function (r, i) {
        var y = 42 + i * 56;
        ctx.strokeStyle = r.col; ctx.fillStyle = r.col + '10';
        ctx.fillRect(20, y, c.w - 40, 48); ctx.strokeRect(20, y, c.w - 40, 48);
        ctx.fillStyle = r.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(r.n, 34, y + 19);
        ctx.fillStyle = C.text; ctx.font = '11px monospace';
        ctx.fillText(r.cells.join('  ·  '), 130, y + 15);
        ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
        ctx.fillText(r.verdict, 130, y + 36);
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('权重空间的可组合性 = 开源生态独有红利 — 闭源 API 只暴露 logits, 任务向量不可得', 20, c.h - 26);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('开放权重不只是「能本地跑」— 是开放了权重空间的一切运算', 20, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();
})();
