/* airllm.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 140GB vs 1.75GB ============ */
  (function () {
    function draw() {
      var c = fit('layerCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('70B fp16 = 140GB 全量  vs  单层 1.75GB (80 层)', 16, 22);
      /* 左: 全量块 */
      var bx = 30, by = 40, bw = 90, bh = 130;
      ctx.fillStyle = 'rgba(248,81,73,.18)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = C.red; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('140GB', bx + 22, by + 70);
      ctx.fillStyle = C.dim;
      ctx.fillText('全装进显存', bx + 12, by + 90);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('需要 2×80GB A100', bx - 6, by + bh + 20);
      /* 右: 单层流 */
      for (var i = 0; i < 5; i++) {
        var lx = 180 + i * 52;
        var active = i === 2;
        ctx.fillStyle = active ? 'rgba(126,231,135,.5)' : 'rgba(48,54,61,.7)';
        ctx.fillRect(lx, by + bh / 2 - 14, 44, 28);
        ctx.strokeStyle = active ? C.green : C.dark;
        ctx.strokeRect(lx, by + bh / 2 - 14, 44, 28);
        ctx.fillStyle = active ? C.green : C.dim; ctx.font = '11px monospace';
        ctx.fillText('L' + (i * 19 + 1), lx + 12, by + bh / 2 + 4);
      }
      /* 磁盘 */
      ctx.fillStyle = 'rgba(139,148,158,.12)';
      ctx.fillRect(180, by + bh - 24, 260, 20);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('NVMe 磁盘: 其余 76 层待机', 190, by + bh - 9);
      /* 标注 */
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('显存只住一层: 1.75GB', 180, by - 10);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('+ KV cache + 激活 → 4GB 卡装下', 180, by + bh + 20);
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('代价: 每生成 1 个 token, 80 层全部从磁盘读一遍 = 搬 140GB', 30, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 逐层流水动画 (核心交互) ============ */
  (function () {
    var step = 0;
    /* 0-3: 载入L1 -> 计算 -> 释放载L2 -> ... 演示3层循环 */
    function draw() {
      var c = fit('flowCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* GPU 框 */
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.strokeRect(60, 30, 200, 120);
      ctx.lineWidth = 1;
      ctx.fillStyle = C.blue; ctx.font = MONO;
      ctx.fillText('GPU 显存 (4GB)', 90, 50);
      /* 磁盘 */
      ctx.strokeStyle = C.dim;
      ctx.strokeRect(340, 30, 180, 120);
      ctx.fillStyle = C.dim; ctx.font = MONO;
      ctx.fillText('NVMe (140GB)', 380, 50);
      /* 80 层小格 */
      for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 8; j++) {
          ctx.fillStyle = 'rgba(139,148,158,.25)';
          ctx.fillRect(352 + j * 20, 66 + i * 8, 16, 6);
        }
      }
      /* 当前层 */
      var cur = Math.floor(step / 3) % 5;
      var phase = step % 3;
      var loading = phase === 0, computing = phase === 1, releasing = phase === 2;
      /* 层在 GPU 内 */
      ctx.fillStyle = computing ? 'rgba(126,231,135,.55)' : (loading ? 'rgba(255,166,87,.55)' : 'rgba(248,81,73,.35)');
      ctx.fillRect(100, 75, 120, 40);
      ctx.strokeStyle = computing ? C.green : (loading ? C.orange : C.red);
      ctx.strokeRect(100, 75, 120, 40);
      ctx.fillStyle = C.text; ctx.font = 'bold 13px monospace';
      ctx.fillText('层 ' + (cur * 19 + 1), 130, 100);
      /* 传输箭头 */
      if (loading) {
        ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(330, 95); ctx.lineTo(266, 95); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 1;
        ctx.fillStyle = C.orange; ctx.font = FONT;
        ctx.fillText('1.75GB 传输中...', 268, 82);
      }
      if (computing) {
        ctx.fillStyle = C.green; ctx.font = FONT;
        ctx.fillText('矩阵乘法...', 120, 135);
      }
      if (releasing) {
        ctx.fillStyle = C.red; ctx.font = FONT;
        ctx.fillText('释放 → 下一层', 120, 135);
      }
      /* token 计数 */
      var tokens = Math.floor(Math.floor(step / 3) / 5);
      ctx.fillStyle = C.pink; ctx.font = MONO;
      ctx.fillText('已生成 token: ' + tokens, 340, 172);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      var notes = [
        '载入: L' + (cur * 19 + 1) + ' 从 NVMe 进显存 (~1.75GB)',
        '计算: 这一层的前向 — 只有此刻它在干活',
        '释放: 算完即弃, 显存让位给 L' + ((cur + 1) * 19 + 1),
        '循环 80 次 = 1 个 token 诞生'
      ];
      ctx.fillText(notes[phase], 16, c.h - 10);
    }
    var btn = document.getElementById('airBtn');
    if (btn) btn.addEventListener('click', function () {
      step = (step + 1) % 15;
      btn.textContent = '推进 → (第 ' + (Math.floor(step / 3) + 1) + '/5 段演示)';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 速度账: 每token搬140GB ============ */
  (function () {
    function draw() {
      var c = fit('speedCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('每 token 的 IO 账: 全模型从磁盘过一遍', 16, 22);
      var rows = [
        { n: '70B fp16 · 7GB/s NVMe', t: '20 s/tok', col: C.red },
        { n: '70B 4bit · 7GB/s NVMe', t: '5 s/tok', col: C.orange },
        { n: '社区实测区间', t: '4-6 s/tok (20token)', col: C.green },
        { n: '对照: 整装 70B (2×A100)', t: '~0.05 s/tok', col: C.blue }
      ];
      rows.forEach(function (r, i) {
        var y = 40 + i * 32;
        ctx.fillStyle = r.col + '18';
        ctx.fillRect(16, y, c.w - 32, 26);
        ctx.strokeStyle = r.col; ctx.strokeRect(16, y, c.w - 32, 26);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 26, y + 18);
        ctx.fillStyle = r.col; ctx.font = MONO;
        ctx.fillText(r.t, c.w - 220, y + 18);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('400 倍差距 — 这不是 bug, 是「时间换空间」的明码标价', 16, 172);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('20 个 token 的生成 = 搬 2.8TB 数据 (140GB × 20) — NVMe 也要过热', 16, 192);
      ctx.fillStyle = C.green;
      ctx.fillText('反直觉: 序列越长单 token 越慢 (attention 计算∝长度), IO 却恒定 — 与 vLLM 的 batch 瓶颈相反', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 四机制旋钮 ============ */
  (function () {
    function draw() {
      var c = fit('knobCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var mechs = [
        { n: '① 分层加载', d: '显存: 全量→单层+KV', v: '决定能不能跑', col: C.blue },
        { n: '② 块级量化', d: 'IO 减半/四分', v: '~3x 加速', col: C.orange },
        { n: '③ 预取', d: '算 N 层时读 N+1', v: '~10% 加速', col: C.green },
        { n: '④ 稀疏 MoE', d: '只载被路由的专家', v: '671B→12GB', col: C.purple }
      ];
      mechs.forEach(function (m, i) {
        var x = 16 + (i % 2) * (c.w / 2 - 12);
        var y = 20 + Math.floor(i / 2) * 84;
        var bw = c.w / 2 - 28;
        ctx.fillStyle = m.col + '16';
        ctx.fillRect(x, y, bw, 76);
        ctx.strokeStyle = m.col; ctx.strokeRect(x, y, bw, 76);
        ctx.fillStyle = m.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(m.n, x + 12, y + 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(m.d, x + 12, y + 44);
        ctx.fillStyle = m.col;
        ctx.fillText(m.v, x + 12, y + 64);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('四个旋钮作用于流水线不同环节, 独立开关 — 但上限受最弱一环制约 (4bit 开了磁盘仍慢, 预取就白搭)', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 显存成绩单 (核心) ============ */
  (function () {
    function draw() {
      var c = fit('boardCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('官方实测成绩单 (README, 截至 2026-09)', 16, 22);
      var rows = [
        { n: 'Qwen3-235B (MoE)', s: '235B', v: '~3 GB', note: '专家稀疏', col: C.green },
        { n: 'Kimi K3', s: '2.8T', v: '3.72 GB', note: '最大开源模型', col: C.pink },
        { n: 'Llama-3 70B fp16', s: '70B', v: '~4 GB', note: '本页主角', col: C.blue },
        { n: 'Qwen3.8-Flash-Next', s: '125B', v: '5.95 GB', note: 'MoE+PLE', col: C.purple },
        { n: 'Llama-3.1 405B', s: '405B', v: '~8 GB', note: '需 4bit', col: C.orange },
        { n: 'DeepSeek-V3', s: '671B', v: '~12 GB', note: 'MoE 稀疏加载', col: C.red }
      ];
      var maxV = 13;
      rows.forEach(function (r, i) {
        var y = 38 + i * ((c.h - 74) / 6);
        var w = parseFloat(r.v) / maxV * (c.w - 460);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(250, y, Math.max(10, w), 24);
        ctx.strokeStyle = r.col; ctx.strokeRect(250, y, Math.max(10, w), 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 17);
        ctx.font = 'bold 12px monospace';
        ctx.fillText(r.s, 200, y + 17);
        ctx.fillStyle = r.col;
        ctx.fillText(r.v, 256 + Math.max(10, w) + 8, y + 17);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(r.note, 256 + Math.max(10, w) + 88, y + 17);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('规律: 显存需求只取决于「单层大小」, 与总参数无关 — 2.8T 只要 3.72GB · 2026/09 新增训练: 125B 训练 <6GB', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 四条路线对照 ============ */
  (function () {
    function draw() {
      var c = fit('routesCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('「大模型塞小卡」四条路线', 16, 22);
      var routes = [
        { n: '量化', d: '压每个参数的字节', cost: '精度略降', link: 'quantization', col: C.blue },
        { n: 'MoE', d: '只激活部分参数', cost: '要重新训练', link: 'moe', col: C.green },
        { n: 'PagedAttention', d: 'KV Cache 分页管理', cost: '治 KV 不治权重', link: 'pagedattention', col: C.purple },
        { n: 'AirLLM 分层', d: '权重住磁盘按需调入', cost: '慢 100-400x', link: '本页', col: C.orange }
      ];
      routes.forEach(function (r, i) {
        var x = 16 + i * (c.w - 32) / 4;
        var bw = (c.w - 32) / 4 - 12;
        ctx.fillStyle = r.col + '16';
        ctx.fillRect(x, 36, bw, 110);
        ctx.strokeStyle = r.col; ctx.strokeRect(x, 36, bw, 110);
        ctx.fillStyle = r.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(r.n, x + 10, 58);
        ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
        ctx.fillText(r.d, x + 10, 82);
        ctx.fillStyle = C.red; ctx.font = '11.5px sans-serif';
        ctx.fillText('代价: ' + r.cost, x + 10, 106);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText(r.link, x + 10, 132);
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('四条可叠加: AirLLM 自己也用块级量化 (4bit) + MoE 稀疏 — 组合拳是常态', 16, 162);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('什么时候选 AirLLM: 显存装不下 + 延迟不敏感 + 不想损失精度', 16, 184);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('论文复现 · 边缘 demo · 「就是想看看 671B 长什么样」 — 高 QPS 服务请走 vLLM', 16, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

})();
