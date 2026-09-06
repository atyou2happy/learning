/* speculative-decoding.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 核心验证游戏 ============ */
  /* 三轮剧本: 大模型想的是确定性句子, 小模型起草, 用户看接受前缀 */
  (function () {
    var rounds = [
      { draft: ['the', 'cat', 'sat', 'dog'], truth: ['the', 'cat', 'sat', 'on', 'the'] },
      { draft: ['mat', 'and', 'looked', 'at'], truth: ['mat', '.', 'The', 'cat'] },
      { draft: ['sun', 'was', 'bright'], truth: ['sun', 'was', 'warm', 'today'] }
    ];
    var ri = 0;
    var stage = 0; /* 0=idle 1=draft shown 2=verified */
    var emitted = 0; /* 总 token 产出 */
    var forwards = 0; /* 目标模型 forward 次数 */
    var log = [];

    function acceptLen(r) {
      var n = 0;
      for (var i = 0; i < r.draft.length; i++) { if (r.draft[i] === r.truth[i]) n++; else break; }
      return n;
    }

    function draw() {
      var c = fit('gameCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var r = rounds[ri];
      var acc = acceptLen(r);
      /* 场景句: 大模型心中所想 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('大模型想生成的句子(每轮只验证一次):', 16, 20);
      ctx.fillStyle = C.blue; ctx.font = MONO;
      ctx.fillText('"' + r.truth.join(' ') + ' ..."', 16, 40);
      /* draft 行 */
      var y = 76, x = 16, tw = Math.min(92, (c.w - 60) / 5);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('小模型起草 γ=4:', 16, y - 10);
      r.draft.forEach(function (t, i) {
        var ok = i < acc;
        var col = stage >= 1 ? (ok ? C.green : (stage >= 2 ? C.red : C.orange)) : C.dim;
        ctx.fillStyle = stage >= 1 && ok ? 'rgba(126,231,135,.18)' : 'rgba(139,148,158,.08)';
        ctx.fillRect(x, y, tw - 6, 30);
        ctx.strokeStyle = col; ctx.strokeRect(x, y, tw - 6, 30);
        ctx.fillStyle = stage >= 1 ? C.text : C.dim; ctx.font = FONT;
        ctx.fillText(t, x + 8, y + 19);
        x += tw;
      });
      /* 验证结果行 */
      if (stage >= 2) {
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText('大模型一次 forward 并行验证 →', 16, y + 52);
        var x2 = 16;
        r.truth.forEach(function (t, i) {
          var isBonus = i === acc;
          var ok = i < acc;
          ctx.fillStyle = ok ? 'rgba(126,231,135,.3)' : isBonus ? 'rgba(163,113,247,.3)' : 'rgba(139,148,158,.06)';
          ctx.fillRect(x2, y + 60, tw - 6, 30);
          ctx.strokeStyle = ok ? C.green : isBonus ? C.purple : C.dark;
          ctx.strokeRect(x2, y + 60, tw - 6, 30);
          ctx.fillStyle = ok ? C.text : isBonus ? C.text : C.dim; ctx.font = FONT;
          ctx.fillText(t + (isBonus ? ' ◄' : ''), x2 + 6, y + 79);
          x2 += tw;
        });
        /* 说明 */
        var got = acc + 1;
        ctx.fillStyle = C.green; ctx.font = MONO;
        var msg = acc === r.draft.length ? '全部猜对! 收下 ' + got + ' 个 token (含验证白送的 1 个)' :
          '猜对 ' + acc + ' 个, 第 ' + (acc + 1) + ' 个错 → 收下前 ' + got + ' 个 (含纠正位), 丢弃其余 draft';
        ctx.fillText(msg, 16, y + 112);
      }
      /* 记分牌 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('累计: 产出 ' + emitted + ' token / 目标 forward ' + forwards + ' 次' + (forwards ? '  →  ' + (emitted / forwards).toFixed(1) + ' token/forward' : ''), 16, c.h - 12);
    }

    var btn = document.getElementById('sdBtn');
    if (btn) btn.addEventListener('click', function () {
      var r = rounds[ri];
      if (stage === 0) { stage = 1; }
      else if (stage === 1) {
        stage = 2;
        var acc = acceptLen(r);
        emitted += acc + 1;
        forwards += 1;
      } else {
        ri = (ri + 1) % rounds.length;
        stage = 0;
      }
      btn.textContent = stage === 0 ? '▶ 起草 (第 ' + (ri + 1) + ' 轮)' : stage === 1 ? '🔍 大模型验证 →' : '下一轮 →';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 为什么 decode 喂不饱 GPU ============ */
  (function () {
    function draw() {
      var c = fit('hungryCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: 标准 decode */
      var ax = 20, ay = 30, aw = (c.w - 70) / 2, ah = c.h - 90;
      ctx.strokeStyle = C.dark; ctx.strokeRect(ax, ay, aw, ah);
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('标准 decode', ax + 14, ay + 20);
      for (var i = 0; i < 5; i++) {
        var yy = ay + 36 + i * ((ah - 60) / 5);
        ctx.fillStyle = 'rgba(88,166,255,.2)';
        ctx.fillRect(ax + 14, yy, aw - 28, 18);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText('forward → ' + (i + 1) + ' token', ax + 22, yy + 13);
      }
      ctx.fillStyle = C.red; ctx.font = FONT;
      ctx.fillText('每步只产出 1 token · 大量算力空转', ax + 14, ay + ah - 12);
      /* 右: 投机 decode */
      var bx = ax + aw + 30;
      ctx.strokeStyle = C.dark; ctx.strokeRect(bx, ay, aw, ah);
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('投机 decode (γ=4)', bx + 14, ay + 20);
      for (var k = 0; k < 2; k++) {
        var y2 = ay + 36 + k * ((ah - 60) / 2.4);
        ctx.fillStyle = 'rgba(126,231,135,.2)';
        ctx.fillRect(bx + 14, y2, aw - 28, 18);
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText('大模型 forward # ' + (k + 1) + ' → 验证 4 个', bx + 22, y2 + 13);
        ctx.fillStyle = 'rgba(255,166,87,.25)';
        ctx.fillRect(bx + 14, y2 + 24, aw - 28, 14);
        ctx.fillStyle = C.dim;
        ctx.fillText('小模型起草 (可并行, 便宜 ' + '~10x)', bx + 22, y2 + 35);
      }
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('每次 forward 产出 2~5 token · 算力被填满', bx + 14, ay + ah - 12);
      /* 底部结论 */
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('关键: 目标模型验证 γ 个 token 与生成 1 个 token 的算力几乎相同 (并行) —— 猜对了就是白赚', 20, c.h - 14);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 加速比曲线 ============ */
  (function () {
    var hover = null;
    function draw() {
      var c = fit('curveCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 64, y0 = 24, y1 = c.h - 46, xmax = c.w - 20;
      /* 坐标系 */
      ctx.strokeStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(xmax, y1); ctx.stroke();
      /* y 刻度 1-5x */
      ctx.font = FONT; ctx.fillStyle = C.dim;
      for (var s = 1; s <= 5; s++) {
        var yy = y1 - (s - 1) / 4 * (y1 - y0);
        ctx.fillText(s + 'x', x0 - 28, yy + 4);
        ctx.strokeStyle = C.dark;
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(xmax, yy); ctx.stroke();
      }
      /* x 刻度 γ=1..8 */
      for (var g = 1; g <= 8; g++) {
        var xx = x0 + (g - 1) / 7 * (xmax - x0);
        ctx.fillStyle = C.dim;
        ctx.fillText('γ=' + g, xx - 10, y1 + 16);
      }
      /* 三条曲线 */
      function S(a, g, cost) { return (1 + a * (1 - Math.pow(a, g)) / (1 - a)) / (1 + g * cost); }
      var series = [
        { a: 0.7, col: C.orange },
        { a: 0.8, col: C.green },
        { a: 0.9, col: C.purple }
      ];
      series.forEach(function (s) {
        ctx.strokeStyle = s.col; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (var g = 1; g <= 8; g++) {
          var v = S(s.a, g, 0.05);
          var x = x0 + (g - 1) / 7 * (xmax - x0);
          var y = y1 - Math.min(4.99, v - 1) / 4 * (y1 - y0);
          g === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.lineWidth = 1;
        /* 最优点标记 */
        var best = { s: 0, g: 1 };
        for (var gg = 1; gg <= 8; gg++) { var sv = S(s.a, gg, 0.05); if (sv > best.s) best = { s: sv, g: gg }; }
        var bxp = x0 + (best.g - 1) / 7 * (xmax - x0);
        var byp = y1 - Math.min(4.99, best.s - 1) / 4 * (y1 - y0);
        ctx.fillStyle = s.col;
        ctx.beginPath(); ctx.arc(bxp, byp, 4, 0, 7); ctx.fill();
      });
      /* 图例 */
      ctx.font = FONT;
      ctx.fillStyle = C.orange; ctx.fillText('■ α=0.7 (草案差)', x0 + 8, y0 + 14);
      ctx.fillStyle = C.green; ctx.fillText('■ α=0.8 (典型)', x0 + 8, y0 + 30);
      ctx.fillStyle = C.purple; ctx.fillText('■ α=0.9 (草案好)', x0 + 8, y0 + 46);
      ctx.fillStyle = C.dim;
      ctx.fillText('每条曲线的圆点 = 最优 γ —— α 越低, 起草越多反而越亏 (草案费 + 浪费验证)', x0 + 8, y0 + 62);
      ctx.fillText('横轴: 每轮起草长度 γ · 纵轴: 墙钟加速比 (含草案成本 c=0.05)', x0 + 8, y1 + 34);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 变体家族 ============ */
  (function () {
    function draw() {
      var c = fit('familyCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: '原始投机 (2022)', d: '独立小模型起草, 串行 γ 步', col: C.blue },
        { n: 'Medusa (2023)', d: '目标模型自带多头, 一次并行出树', col: C.orange },
        { n: 'EAGLE-1/2/3 (2024-25)', d: '在特征层(隐态)起草, 树搜索, 2.7-3.7x', col: C.green },
        { n: 'MTP (DeepSeek-V3)', d: '训练时就带多 token 预测头, 1.8x', col: C.purple }
      ];
      rows.forEach(function (r, i) {
        var y = 18 + i * ((c.h - 44) / 4);
        var rh = (c.h - 52) / 4;
        ctx.fillStyle = r.col + '15';
        ctx.fillRect(14, y, c.w - 28, rh - 8);
        ctx.strokeStyle = r.col; ctx.strokeRect(14, y, c.w - 28, rh - 8);
        ctx.fillStyle = r.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(r.n, 26, y + (rh - 8) / 2 - 2);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.d, 230, y + (rh - 8) / 2 - 2);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('趋势: 起草器从「外挂」变成「长在模型身上」→ 草案质量(α)一路走高, 加速比跟着走高', 14, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 无损性 ============ */
  (function () {
    function draw() {
      var c = fit('losslessCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 目标分布条 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('大模型下一个 token 的分布 p(x)', 16, 22);
      var dist = [['the', 0.42, C.blue], ['a', 0.30, '#79c0ff'], ['my', 0.18, C.purple], ['this', 0.07, C.orange], ['...', 0.03, C.dim]];
      var x = 16, y = 32;
      dist.forEach(function (d) {
        var w = (d[1] / 0.42) * 90 + 26;
        ctx.fillStyle = d[2] + '66';
        ctx.fillRect(x, y, w, 26);
        ctx.strokeStyle = d[2]; ctx.strokeRect(x, y, w, 26);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(d[0] + ' ' + (d[1] * 100).toFixed(0) + '%', x + 6, y + 17);
        x += w + 8;
      });
      /* 情况1: 草案=the (高概率) */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('草案 = "the" (p=0.42): 42% 概率直接接受; 若未中, 按调整后分布 q(x) ∝ p(x)·(1-q_the·0.42) 重采样 —— 覆盖率不变', 16, 86);
      /* 情况2: 草案=冷门 */
      ctx.fillStyle = C.dim;
      ctx.fillText('草案 = "this" (p=0.07): 93% 概率被拒; 拒绝时大模型给出正确 token 并从那儿重启起草', 16, 110);
      /* 证明要点 */
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('拒绝采样保证: 最终序列分布 ≡ 目标模型独立生成的分布 (数学等价, 非近似)', 16, 146);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('直觉: 接受 = 白赚一个 token; 拒绝 = 大模型亲自出 token —— 两种结局都在原模型的分布里, 谁也没越权', 16, 170);
    }
    draw(); redraws.push(draw);
  })();

})();
