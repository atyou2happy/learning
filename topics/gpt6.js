/* gpt6.js — 全部交互演示（node --check 可直接校验） */
(function () {
  'use strict';
  var C = {
    blue: '#58a6ff', pink: '#f778ba', green: '#7ee787',
    orange: '#ffa657', purple: '#a371f7', red: '#f85149',
    dim: '#8b949e', bg: '#0a0d12', text: '#c9d1d9'
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

  /* ============ 图1 · 从答问到干活: 三代范式 ============ */
  (function () {
    function draw() {
      var c = fit('paradigmCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var gens = [
        { n: 'GPT-3/4 时代', d: '回答 · 生成', ex: '问: 北京多少度?\n答: (基于训练数据的) 一段话', col: C.dim },
        { n: 'GPT-5 + 工具', d: '调用工具 · 单步', ex: 'FC 调天气 API\n回填后回答', col: C.blue },
        { n: 'GPT-6 Astra', d: '持续执行完整任务', ex: '看屏幕 → 操作软件 →\n按结果调下步 → 交付', col: C.orange }
      ];
      gens.forEach(function (g, i) {
        var x = 16 + i * ((c.w - 48) / 3 + 8);
        var bw = (c.w - 48) / 3;
        ctx.fillStyle = g.col + '18';
        ctx.fillRect(x, 22, bw, c.h - 66);
        ctx.strokeStyle = g.col; ctx.strokeRect(x, 22, bw, c.h - 66);
        ctx.fillStyle = g.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(g.n, x + 12, 44);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(g.d, x + 12, 68);
        g.ex.split('\n').forEach(function (ln, j) {
          ctx.fillStyle = C.dim; ctx.font = '12px monospace';
          ctx.fillText(ln, x + 12, 94 + j * 18);
        });
        if (i < 2) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + bw + 1, 50); ctx.lineTo(x + bw + 8, 50); ctx.stroke();
        }
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('「使用电脑」成为模型原生能力 — 企业不再需要为 AI 开发 API/插件/连接器', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 基准对比 (核心交互) ============ */
  (function () {
    var BENCH = [
      { n: 'ExploitBench 安全', a: 100, s: 78.5, col: C.red },
      { n: 'ScreenSpot-Pro 界面', a: 92.7, s: 76.9, col: C.blue },
      { n: 'BenchCAD 几何', a: 95.9, s: 83.3, col: C.purple },
      { n: 'OSWorld2.0 电脑操作', a: 72.6, s: 65.7, col: C.green },
      { n: 'Agents Last Exam', a: 59.3, s: 53.6, col: C.orange },
      { n: 'Terminal-Bench 4.0', a: 57.9, s: 37.3, col: C.pink },
      { n: 'T-Bench Science', a: 64.6, s: 22.4, col: C.purple },
      { n: 'SRE-Bench 逆向', a: 88.0, s: 55.9, col: C.red }
    ];
    function draw() {
      var c = fit('benchCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rowH = (c.h - 44) / BENCH.length;
      BENCH.forEach(function (b, i) {
        var y = 24 + i * rowH;
        /* Sol 底条 */
        var wS = b.s / 100 * (c.w - 320);
        ctx.fillStyle = 'rgba(139,148,158,.35)';
        ctx.fillRect(210, y, wS, rowH - 6);
        /* Astra 条 */
        var wA = b.a / 100 * (c.w - 320);
        ctx.fillStyle = b.col + '99';
        ctx.fillRect(210, y, wA, rowH - 10);
        ctx.strokeStyle = b.col;
        ctx.strokeRect(210, y, wA, rowH - 10);
        ctx.fillStyle = C.text; ctx.font = '12.5px sans-serif';
        ctx.fillText(b.n, 16, y + rowH / 2 - 2);
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = b.col;
        ctx.fillText(b.a + '%', 214 + wA + 6, y + rowH / 2 - 2);
        ctx.fillStyle = C.dim;
        ctx.fillText('vs ' + b.s, 214 + wA + 62, y + rowH / 2 - 2);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('GPT-6 Astra (彩) vs GPT-5.6 Sol (灰) · 来源: OpenAI 发布会 2026-09-03 — 提升集中在「连续行动」类任务', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 成本悖论 ============ */
  (function () {
    function draw() {
      var c = fit('costCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: token 单价 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('单价: 涨 2.5x', 16, 22);
      var prices = [
        { n: '输入', a: 10, s: 4, col: C.blue },
        { n: '输出', a: 50, s: 20, col: C.pink }
      ];
      prices.forEach(function (p, i) {
        var y = 36 + i * 36;
        var wA = p.a / 50 * (c.w / 2 - 120);
        var wS = p.s / 50 * (c.w / 2 - 120);
        ctx.fillStyle = 'rgba(139,148,158,.35)';
        ctx.fillRect(110, y, wS, 20);
        ctx.fillStyle = p.col + '99';
        ctx.fillRect(110, y, wA, 20);
        ctx.strokeStyle = p.col; ctx.strokeRect(110, y, wA, 20);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(p.n + ' $' + p.a + '/M', 116 + wA, y + 15);
        ctx.fillStyle = C.dim;
        ctx.fillText('(Sol $' + p.s + ')', 116 + wA + 90, y + 15);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('AA 测算: 智能指数几乎持平 (61.2 vs 60.9) — 单任务成本 +75%', 16, 116);
      /* 右: 每任务成本 */
      var rx = c.w / 2 + 20;
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('每任务成本: 降 9-86%', rx, 22);
      var rows = [
        { n: 'BenchCAD', d: '-86% vs Claude', col: C.green },
        { n: 'T-Bench 4.0', d: '-63% vs Claude', col: C.green },
        { n: 'T-B Science', d: '-31% vs Claude', col: C.green },
        { n: 'Agents LE', d: '输出token -65% vs Opus5', col: C.orange }
      ];
      rows.forEach(function (r, i) {
        var y = 38 + i * 24;
        ctx.fillStyle = r.col + '14';
        ctx.fillRect(rx, y, c.w - rx - 16, 20);
        ctx.fillStyle = C.text; ctx.font = '12px monospace';
        ctx.fillText(r.n, rx + 8, y + 15);
        ctx.fillStyle = r.col;
        ctx.fillText(r.d, rx + 130, y + 15);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('悖论的解法: token 更省 (输出 -65%) × 任务更快 (40 vs 75 min) — 单价贵但总账便宜', 16, c.h - 28);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('前提是 agent 型任务; 问答型场景反而更贵 (AA: 单任务 +75%)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 安全: 三重防线 ============ */
  (function () {
    function draw() {
      var c = fit('safetyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: '计算机使用不当行为', a: '2.4%', s: '22.0%', col: C.green },
        { n: '+ AutoReview', a: '1.8%', s: '4.5%', col: C.green },
        { n: '规避基准', a: '0.00%', s: '0.29%', col: C.green },
        { n: '蜜罐绕过', a: '0%', s: '48.2%', col: C.green },
        { n: '幻觉基准', a: '4.2%', s: '12.2%', col: C.green }
      ];
      rows.forEach(function (r, i) {
        var y = 20 + i * 30;
        ctx.fillStyle = r.col + '12';
        ctx.fillRect(16, y, c.w / 2 - 30, 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 24, y + 17);
        ctx.fillStyle = C.green; ctx.font = MONO;
        ctx.fillText(r.a, c.w / 2 - 130, y + 17);
        ctx.fillStyle = C.red; ctx.font = FONT;
        ctx.fillText('Sol: ' + r.s, c.w / 2 - 80, y + 17);
      });
      /* 右: 未对齐监控 */
      var rx = c.w / 2 + 10;
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('新增: 未对齐监控', rx, 26);
      var pts = [
        '· 检查推理 + 行动, 发现越权即暂停',
        '· 能力越强, 推理越难看懂 (Pachocki)',
        '· 代价: 合法任务也会被减速/暂停',
        '· 发现2个零日漏洞已披露, 拒绝高级攻防任务'
      ];
      ctx.fillStyle = C.dim; ctx.font = FONT;
      pts.forEach(function (p, i) {
        ctx.fillText(p, rx, 48 + i * 20);
      });
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('「模型能操作什么」取代「模型会不会答错」成为新的安全问题', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 巨头竞速 2026 ============ */
  (function () {
    function draw() {
      var c = fit('raceCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: 'OpenAI GPT-6 Astra', tag: '9/3 发布', spec: '计算机使用 · >10万 DBU Stargate 预训练', score: 'AA 61.2', col: C.orange },
        { n: 'Anthropic Claude Fable5.1', tag: '主力对手', spec: 'T-Bench 55.8 · BenchCAD 84.3 · Science 52.6', score: 'AA 68.1 (Opus5)', col: C.purple },
        { n: 'Google Gemini 系列', tag: '生态位', spec: '长上下文 + 多模态传统强项', score: '-', col: C.blue },
        { n: 'DeepSeek R2 系列', tag: '性价比', spec: '开源 + MoE + $5.58M 训练成本路线', score: '-', col: C.green }
      ];
      rows.forEach(function (r, i) {
        var y = 20 + i * 42;
        ctx.fillStyle = r.col + '12';
        ctx.fillRect(16, y, c.w - 32, 36);
        ctx.strokeStyle = r.col; ctx.strokeRect(16, y, c.w - 32, 36);
        ctx.fillStyle = r.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(r.n, 26, y + 15);
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(r.tag, 26, y + 30);
        ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
        ctx.fillText(r.spec, 240, y + 15);
        ctx.fillStyle = r.col; ctx.font = '12px monospace';
        ctx.fillText(r.score, c.w - 150, y + 15);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('范式趋同: 都在从「回答模型」转向「持续干活的智能体」— 差异在成本结构与生态', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 冷静清单 ============ */
  (function () {
    function draw() {
      var c = fit('coldCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('发布会没放进主材料的:', 16, 22);
      var items = [
        { t: 'GDPval 未公布', d: 'OpenAI 自家「现实经济工作」基准 (44 职业 1320 任务) — AA 测出 -80 Elo 退步', col: C.red },
        { t: 'τ³-Banking / SciCode 退步', d: '银行流程与科学计算任务上落后上一代', col: C.red },
        { t: '问答场景反而更贵', d: 'AA: 单任务成本 +75% — 省 token 的收益只在长程 agent 任务显现', col: C.orange },
        { t: 'FrontierMath 略降', d: '80.5 vs 83.0 — 推理基准没涨反跌, 能力重心明显挪向行动', col: C.orange }
      ];
      items.forEach(function (it, i) {
        var y = 40 + i * 40;
        ctx.fillStyle = it.col + '12';
        ctx.fillRect(16, y, c.w - 32, 34);
        ctx.strokeStyle = it.col; ctx.strokeRect(16, y, c.w - 32, 34);
        ctx.fillStyle = it.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(it.t, 26, y + 15);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(it.d, 26, y + 29);
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('规律: 每代新模型的能力都是「搬家」不是「纯增」— 挪向发布会主推的场景', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
