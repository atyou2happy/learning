/* mostik.js — 全部交互演示（node --check 可直接校验） */
(function () {
  'use strict';
  var C = {
    blue: '#58a6ff', pink: '#f778ba', green: '#7ee787',
    orange: '#ffa657', purple: '#a371f7', red: '#f85149',
    dim: '#8b949e', dark: '#30363d', bg: '#0a0d12', text: '#c9d1d9'
  };
  var FONT = '12px sans-serif';
  var MONO = 'bold 12px monospace';

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

  function arrow(ctx, ax, ay, bx, by, col) {
    ctx.strokeStyle = col || C.dim;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    var ang = Math.atan2(by - ay, bx - ax);
    ctx.fillStyle = col || C.dim;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 9 * Math.cos(ang - 0.4), by - 9 * Math.sin(ang - 0.4));
    ctx.lineTo(bx - 9 * Math.cos(ang + 0.4), by - 9 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1;
  }

  var redraws = [];
  window.addEventListener('resize', function () {
    redraws.forEach(function (fn) { fn(); });
  });

  /* ============ 图1 · 2MB 到 17bits 的信息瓶颈 ============ */
  (function () {
    function draw() {
      var c = fit('bottleneckCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 内态大块 */
      var bx = 20, by = 40, bw = 130, bh = 90;
      ctx.fillStyle = 'rgba(163,113,247,.3)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = C.purple;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = C.purple; ctx.font = MONO;
      ctx.fillText('内部状态', bx + 28, by + 32);
      ctx.font = FONT; ctx.fillStyle = C.text;
      ctx.fillText('~100+ 隐向量 / token', bx + 12, by + 56);
      ctx.fillText('~1M 数字 = 2 MB', bx + 12, by + 74);
      /* token 细条 */
      var tx = c.w - 92, tw = 8;
      ctx.fillStyle = 'rgba(255,166,87,.5)';
      ctx.fillRect(tx, by, tw, bh);
      ctx.strokeStyle = C.orange;
      ctx.strokeRect(tx, by, tw, bh);
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('1 token', tx - 14, by - 8);
      ctx.fillText('17 bits', tx - 14, by + bh + 16);
      /* 漏斗 */
      ctx.strokeStyle = C.dim;
      ctx.beginPath();
      ctx.moveTo(bx + bw + 8, by + 6);
      ctx.lineTo(tx - 8, by + bh / 2 - 4);
      ctx.moveTo(bx + bw + 8, by + bh - 6);
      ctx.lineTo(tx - 8, by + bh / 2 + 4);
      ctx.stroke();
      ctx.fillStyle = C.red; ctx.font = MONO;
      ctx.fillText('压缩比 ~1,000,000 : 1', (bx + bw + tx) / 2 - 66, by - 12);
      /* annotation */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('模型「想」的远多于它「说」的 —— 每个 token 丢弃 99.9999% 的内部计算', 20, by + bh + 44);
      ctx.fillStyle = C.text;
      ctx.fillText('两个模型对话时，全部理解只能挤过这个针眼 —— 然后从零重建', 20, by + bh + 64);
      ctx.fillStyle = C.green;
      ctx.fillText('Mostik 桥: 直接传 2MB 隐态, 绕过 17 bits 的语言针眼', 20, by + bh + 88);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 桥接架构 ============ */
  (function () {
    function draw() {
      var c = fit('archCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 大模型框 */
      var gx = 16, gy = 36, gw = 150, gh = 130;
      ctx.fillStyle = 'rgba(88,166,255,.14)';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = C.blue;
      ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = C.blue; ctx.font = 'bold 13px monospace';
      ctx.fillText('GLM-5.2', gx + 40, gy + 22);
      ctx.font = MONO;
      ctx.fillText('753B', gx + 55, gy + 40);
      ctx.font = FONT; ctx.fillStyle = C.text;
      ctx.fillText('只读不写', gx + 50, gy + 62);
      ctx.fillText('Prefill 理解', gx + 44, gy + 80);
      ctx.fillStyle = C.dim;
      ctx.fillText('(冻结, 不训练)', gx + 34, gy + 100);
      /* 小模型框 */
      var qx = c.w - 166, qy = gy, qw = 150, qh = gh;
      ctx.fillStyle = 'rgba(126,231,135,.12)';
      ctx.fillRect(qx, qy, qw, qh);
      ctx.strokeStyle = C.green;
      ctx.strokeRect(qx, qy, qw, qh);
      ctx.fillStyle = C.green; ctx.font = 'bold 13px monospace';
      ctx.fillText('Qwen-3.5', qx + 36, qy + 22);
      ctx.font = MONO;
      ctx.fillText('4B', qx + 66, qy + 40);
      ctx.font = FONT; ctx.fillStyle = C.text;
      ctx.fillText('负责写作', qx + 50, qy + 62);
      ctx.fillText('Decode 生成', qx + 44, qy + 80);
      ctx.fillStyle = C.dim;
      ctx.fillText('(冻结, 不训练)', qx + 34, qy + 100);
      /* bridge */
      var bx0 = gx + gw + 10, bx1 = qx - 10, byMid = gy + gh / 2;
      ctx.fillStyle = 'rgba(163,113,247,.22)';
      ctx.fillRect(bx0, byMid - 26, bx1 - bx0, 52);
      ctx.strokeStyle = C.purple;
      ctx.strokeRect(bx0, byMid - 26, bx1 - bx0, 52);
      ctx.fillStyle = C.purple; ctx.font = 'bold 12px monospace';
      ctx.fillText('BRIDGE', (bx0 + bx1) / 2 - 26, byMid - 8);
      ctx.font = FONT; ctx.fillStyle = C.text;
      ctx.fillText('翻译隐态', (bx0 + bx1) / 2 - 26, byMid + 10);
      ctx.fillStyle = C.dim;
      ctx.fillText('(唯一被训练的部件)', (bx0 + bx1) /  - 44, byMid + 26);
      /* flows */
      arrow(ctx, gx + gw / 2 - 30, gy - 8, gx + gw / 2 - 30, gy - 2, C.dim);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('prompt 进入大模型', gx - 4, gy - 14);
      arrow(ctx, bx0, byMid, bx0 + 14, byMid, C.purple);
      ctx.fillStyle = C.purple;
      ctx.fillText('hidden states', bx0 + 2, byMid - 32);
      arrow(ctx, bx1 - 14, byMid, bx1, byMid, C.green);
      ctx.fillText('context 预填 → 小模型直接 decode', qx - 130, qy + qh + 18);
      /* 经济账 */
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('经济账: 读 prompt (753B, 1 次并行) 便宜 | 写 token (4B, 逐个) 也便宜 —— 贵的部分各取所长', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 结果数字墙 ============ */
  (function () {
    function draw() {
      var c = fit('resultsCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var cards = [
        { v: '50%', d: '弥合大小模型差距', x: 16 },
        { v: '+25%', d: '小模型自身准确率提升', x: 16 + 168 },
        { v: '2x', d: '难题子集提升幅度', x: 16 + 336 },
        { v: '1/2.5', d: 'vs 等效中模型算力成本', x: 16 + 504 }
      ];
      cards.forEach(function (cd) {
        ctx.fillStyle = 'rgba(126,231,135,.1)';
        ctx.fillRect(cd.x, 30, 150, 84);
        ctx.strokeStyle = C.green;
        ctx.strokeRect(cd.x, 30, 150, 84);
        ctx.fillStyle = C.green; ctx.font = 'bold 26px monospace';
        ctx.fillText(cd.v, cd.x + 12, 72);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(cd.d, cd.x + 12, 100);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('来源: mostik.ai 官网公开实验 (2026-09, GLM-5.2 753B → Qwen-3.5 4B, 两模型冻结)', 16, 136);
      ctx.fillStyle = C.text;
      ctx.fillText('解读: 存在一个中模型, 其单独得分恰好等于桥接组合的得分 —— 但桥接组合只花它 40% 的算力', 16, 158);
      ctx.fillStyle = C.orange;
      ctx.fillText('对比文本交接: 隐态交接在每一档大模型算力下都更优, 早期交接时最高领先 10 个百分点', 16, 180);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 隐态 vs 文本交接曲线 ============ */
  (function () {
    function draw() {
      var c = fit('tradeoffCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 56, y0 = 26, x1 = c.w - 20, y1 = c.h - 44;
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
      /* 两条曲线: 隐态(上) vs 文本(下), 随大模型算力增加趋于大模型上限 */
      function curve(f, col) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (var i = 0; i <= 40; i++) {
          var t = i / 40;
          var v = 0.30 + 0.62 * Math.pow(t, f);
          var x = x0 + t * (x1 - x0);
          var y = y1 - v * (y1 - y0);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.lineWidth = 1;
      }
      curve(0.55, C.green);
      curve(1.25, C.orange);
      /* 上限线 */
      var ylim = y1 - 0.92 * (y1 - y0);
      ctx.strokeStyle = C.blue; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x0, ylim); ctx.lineTo(x1, ylim); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('大模型单独水平', x1 - 96, ylim - 6);
      /* 早期差距标注 */
      var ex = x0 + 0.12 * (x1 - x0);
      var ey1 = y1 - (0.30 + 0.62 * Math.pow(0.12, 0.55)) * (y1 - y0);
      var ey2 = y1 - (0.30 + 0.62 * Math.pow(0.12, 1.25)) * (y1 - y0);
      ctx.strokeStyle = C.red; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ex, ey1); ctx.lineTo(ex, ey2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = C.red; ctx.font = MONO;
      ctx.fillText('最高 +10pp', ex - 40, (ey1 + ey2) / 2);
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('■ 隐态交接 (Mostik)', x0 + 8, y0 + 12);
      ctx.fillStyle = C.orange;
      ctx.fillText('■ 文本交接 (传统 hand-off)', x0 + 8, y0 + 28);
      ctx.fillStyle = C.dim;
      ctx.fillText('横轴: 交给大模型的算力占比 (早期交接 → 充分思考)', x0, y1 + 16);
      ctx.fillText('纵轴: 组合系统准确率 —— 隐态交接全程 Pareto 占优', x0, y1 + 32);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 提前规划: a/an 证据 ============ */
  (function () {
    function draw() {
      var c = fit('planCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* token 行 */
      var toks = ['He', 'is', 'an', 'outstanding', 'accountant', '...'];
      var x0 = 24, ty = 44, tw = (c.w - 60) / toks.length;
      toks.forEach(function (t, i) {
        var x = x0 + i * tw;
        var hot = (t === 'an' || t === 'accountant');
        ctx.fillStyle = hot ? (t === 'accountant' ? 'rgba(126,231,135,.3)' : 'rgba(255,166,87,.3)') : 'rgba(139,148,158,.12)';
        ctx.fillRect(x, ty - 14, tw - 8, 30);
        ctx.strokeStyle = hot ? (t === 'accountant' ? C.green : C.orange) : C.dark;
        ctx.strokeRect(x, ty - 14, tw - 8, 30);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(t, x + 10, ty + 6);
      });
      /* 隐态强度曲线: 从 'is' 后开始上升, 'an' 处已高, 'accountant' 处文字才落地 */
      var gy = c.h - 56, gh = 78;
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, gy + gh); ctx.lineTo(x0, gy); ctx.stroke();
      ctx.strokeStyle = C.purple; ctx.lineWidth = 2.5;
      ctx.beginPath();
      toks.forEach(function (t, i) {
        var x = x0 + i * tw + (tw - 8) / 2;
        var v = [0.05, 0.12, 0.72, 0.88, 0.97, 0.9][i] || 0;
        var y = gy + gh - v * gh;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke(); ctx.lineWidth = 1;
      /* 标注 */
      var axA = x0 + 2 * tw + (tw - 8) / 2;
      var ayA = gy + gh - 0.72 * gh;
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(axA, ayA, 4, 0, 7); ctx.fill();
      arrow(ctx, axA, ayA - 8, axA, ty + 22, C.orange);
      ctx.fillStyle = C.orange; ctx.font = FONT;
      ctx.fillText('写 an 时, 隐态里「accountant」的表示已很强', axA - 40, ayA - 16);
      var axB = x0 + 4 * tw + (tw - 8) / 2;
      var ayB = gy + gh - 0.97 * gh;
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.arc(axB, ayB, 4, 0, 7); ctx.fill();
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('文字 accountant 才出现', axB - 34, ayB - 10);
      ctx.fillStyle = C.purple; ctx.font = FONT;
      ctx.fillText('■ 隐态中目标概念的表示强度 —— 先于文字数个 token (Hanna & Ameisen, ICLR 2026; Anthropic 同机制: 写诗前先定韵)', x0, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · 部署模式 ============ */
  (function () {
    function draw() {
      var c = fit('deployCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 模式A: 低延迟 */
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('模式 A · 低延迟服务', 16, 24);
      ctx.font = FONT; ctx.fillStyle = C.dim;
      ctx.fillText('大模型贡献 prefill 隐态 → 小模型 decode 全速生成', 16, 42);
      var ax = 16, ay = 58, ah = 22;
      ['prompt', '753B prefill', 'bridge', '4B decode', 'tokens'].forEach(function (s, i, arr) {
        var w = 96;
        ctx.fillStyle = i === 1 ? 'rgba(88,166,255,.25)' : i === 3 ? 'rgba(126,231,135,.25)' : 'rgba(163,113,247,.18)';
        ctx.fillRect(ax, ay, w - 8, ah);
        ctx.strokeStyle = i === 1 ? C.blue : i === 3 ? C.green : C.purple;
        ctx.strokeRect(ax, ay, w - 8, ah);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(s, ax + 6, ay + 15);
        if (i < arr.length - 1) arrow(ctx, ax + w - 8, ay + ah / 2, ax + w, ay + ah / 2, C.dim);
        ax += w;
      });
      /* 模式B: 跨端点 */
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('模式 B · 跨端点传输', 16, 134);
      ctx.font = FONT; ctx.fillStyle = C.dim;
      ctx.fillText('隐态在独立部署的端点间传输 —— 小模型跑在任意有空闲的 GPU 上 (含旧卡)', 16, 152);
      var bx0 = 24, byMid = 176;
      ctx.fillStyle = 'rgba(88,166,255,.2)';
      ctx.fillRect(bx0, byMid - 18, 130, 36);
      ctx.strokeStyle = C.blue; ctx.strokeRect(bx0, byMid - 18, 130, 36);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('端点 1: 753B', bx0 + 28, byMid + 4);
      var bx1 = c.w - 154;
      ctx.fillStyle = 'rgba(126,231,135,.2)';
      ctx.fillRect(bx1, byMid - 18, 130, 36);
      ctx.strokeStyle = C.green; ctx.strokeRect(bx1, byMid - 18, 130, 36);
      ctx.fillText('端点 2: 4B (旧卡)', bx1 + 20, byMid + 4);
      ctx.strokeStyle = C.purple; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(bx0 + 130, byMid); ctx.lineTo(bx1, byMid); ctx.stroke();
      ctx.setLineDash([]);
      arrow(ctx, bx1 - 14, byMid, bx1, byMid, C.purple);
      ctx.fillStyle = C.purple; ctx.font = FONT;
      ctx.fillText('latent state (网络传输)', (bx0 + 130 + bx1) / 2 - 60, byMid - 26);
    }
    draw(); redraws.push(draw);
  })();

})();
