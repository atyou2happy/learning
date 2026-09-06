/* moe.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · Dense 悖论 ============ */
  (function () {
    function draw() {
      var c = fit('denseCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: dense 每个 token 过全部参数 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('Dense (GPT-4级): 每个 token 过全部参数', 16, 20);
      var blocks = 12;
      var bw = (c.w / 2 - 60) / blocks;
      for (var i = 0; i < blocks; i++) {
        ctx.fillStyle = 'rgba(88,166,255,.4)';
        ctx.fillRect(24 + i * bw, 30, bw - 4, 46);
      }
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('知识↑ ⇒ 参数↑ ⇒ 每 token 算力↑ (线性买单)', 24, 96);
      /* 右: MoE */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('MoE: 每 token 只点亮 5.5%', c.w / 2 + 16, 20);
      for (var j = 0; j < blocks; j++) {
        var on = j === 2 || j === 5 || j === 9;
        ctx.fillStyle = on ? 'rgba(126,231,135,.6)' : 'rgba(139,148,158,.08)';
        ctx.fillRect(c.w / 2 + 24 + j * bw, 30, bw - 4, 46);
      }
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('知识↑ ⇒ 参数↑ ⇒ 算力不变 (只付点亮的)', c.w / 2 + 24, 96);
      /* 结论 */
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('MoE = 用「点菜」代替「吃自助」— 知识容量与计算成本解耦', 16, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · Router 动画 (核心交互) ============ */
  (function () {
    var TOKENS = ['猫', 'def', '量子', 'love', '税率', 'the', '熵', 'loop'];
    var TOKEN_COLORS = [C.orange, C.blue, C.purple, C.pink, C.green, C.dim, '#79c0ff', '#d2a8ff'];
    /* 每 token 的专家偏好 (演示用, 固定映射) */
    var PREF = [
      [0, 3], [1, 5], [2, 7], [4, 6], [2, 0], [1, 6], [7, 3], [5, 1]
    ];
    var ENAMES = ['语言', '代码', '科学', '常识', '情感', '语法', '数学', '推理'];
    var ECOLS = [C.orange, C.blue, C.purple, C.green, C.pink, C.dim, '#79c0ff', '#d2a8ff'];
    var step = 0; /* 0 idle, 1 gate打分, 2 分发, 3 输出 */
    var counts = [0, 0, 0, 0, 0, 0, 0, 0];

    function draw() {
      var c = fit('routerCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 20, y0 = 34;
      var tokY = c.h / 2 + 10;
      /* 8 个 token */
      TOKENS.forEach(function (t, i) {
        ctx.fillStyle = step >= 1 ? TOKEN_COLORS[i] + '44' : 'rgba(139,148,158,.15)';
        ctx.fillRect(x0, tokY - 14 + (i % 4) * 30 - 45, 52, 24);
        ctx.strokeStyle = TOKEN_COLORS[i];
        ctx.strokeRect(x0, tokY - 14 + (i % 4) * 30 - 45, 52, 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(t, x0 + 12, tokY - 14 + (i % 4) * 30 - 29);
      });
      /* gate */
      var gx = x0 + 100;
      ctx.fillStyle = C.bg;
      ctx.strokeStyle = step >= 1 ? C.orange : C.dark;
      ctx.lineWidth = step >= 1 ? 2.5 : 1;
      ctx.fillRect(gx, c.h / 2 - 44, 74, 88);
      ctx.strokeRect(gx, c.h / 2 - 44, 74, 88);
      ctx.lineWidth = 1;
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('Router', gx + 8, c.h / 2 - 18);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('gate 打分', gx + 8, c.h / 2 + 2);
      ctx.fillText('选 top-2', gx + 8, c.h / 2 + 20);
      /* 专家列 */
      var ex0 = gx + 150, exw = 74;
      ENAMES.forEach(function (n, e) {
        var ey = 24 + e * ((c.h - 60) / 8);
        var active = step >= 2 && counts.indexOf(Math.max.apply(null, counts)) >= 0;
        var lit = step >= 2 && TOKENS.some(function (t, i) { return step >= 3 || PREF[i].indexOf(e) >= 0; }) && PREF.some(function (p, i) { return p.indexOf(e) >= 0 && (step >= 2); });
        var hot = counts[e] > 0;
        ctx.fillStyle = hot && step >= 2 ? ECOLS[e] + '55' : 'rgba(139,148,158,.07)';
        ctx.fillRect(ex0 + e * (exw + 8), ey, exw, (c.h - 68) / 8 - 6);
        ctx.strokeStyle = hot && step >= 2 ? ECOLS[e] : C.dark;
        ctx.strokeRect(ex0 + e * (exw + 8), ey, exw, (c.h - 68) / 8 - 6);
        ctx.fillStyle = hot && step >= 2 ? C.text : C.dim; ctx.font = FONT;
        ctx.fillText(n, ex0 + e * (exw + 8) + 8, ey + (c.h - 68) / 16 - 3);
      });
      /* 连线: token -> gate */
      ctx.strokeStyle = C.dark;
      TOKENS.forEach(function (t, i) {
        var yy = tokY - 14 + (i % 4) * 30 - 45 + 12;
        ctx.beginPath(); ctx.moveTo(x0 + 52, yy); ctx.lineTo(gx, c.h / 2); ctx.stroke();
      });
      /* 连线: gate -> expert (step>=2) */
      if (step >= 2) {
        TOKENS.forEach(function (t, i) {
          PREF[i].forEach(function (e) {
            var ey = 24 + e * ((c.h - 60) / 8) + ((c.h - 68) / 8 - 6) / 2;
            ctx.strokeStyle = TOKEN_COLORS[i];
            ctx.beginPath();
            ctx.moveTo(gx + 74, c.h / 2);
            ctx.lineTo(ex0 + e * (exw + 8), ey);
            ctx.stroke();
          });
        });
      }
      /* 输出 */
      if (step >= 3) {
        ctx.fillStyle = C.green; ctx.font = MONO;
        ctx.fillText('8 专家只有 5 个被用到 · 每个 token 恰好 2 票 加权输出', 16, c.h - 10);
      } else {
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText('步骤 ' + step + '/3 · ' + ['token 进入 MoE 层', 'router 为每个 token 打 8 分选 top-2', 'token 被分发到选中专家 · 未选中专家 0 计算'][step], 16, c.h - 10);
      }
    }

    var btn = document.getElementById('moeBtn');
    if (btn) btn.addEventListener('click', function () {
      if (step < 3) step++;
      else { step = 0; counts = [0, 0, 0, 0, 0, 0, 0, 0]; }
      /* 统计每专家被选中次数 */
      counts = [0, 0, 0, 0, 0, 0, 0, 0];
      if (step >= 2) TOKENS.forEach(function (t, i) { PREF[i].forEach(function (e) { counts[e]++; }); });
      btn.textContent = step < 3 ? '下一步 → (' + (step + 1) + '/4)' : '↺ 重置';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 参数账本 ============ */
  (function () {
    function draw() {
      var c = fit('ledgerCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 总参 vs 激活 */
      var bw = c.w - 60;
      ctx.fillStyle = 'rgba(88,166,255,.35)';
      ctx.fillRect(30, 30, bw, 34);
      ctx.fillStyle = C.blue; ctx.font = MONO;
      ctx.fillText('总参数 671B (全部 256 专家装进显存)', 40, 52);
      ctx.fillStyle = 'rgba(126,231,135,.6)';
      ctx.fillRect(30, 76, bw * 0.055, 34);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('激活 37B (5.5%) — 每 token 真正用到的', 40, 98);
      /* 分解 */
      var items = [
        ['每专家参数', '44M (3×7168×2048)'],
        ['每层: 256 路由 + 1 共享', '11.32B'],
        ['58 MoE 层专家合计', '656.5B (+注意力 ≈671B)'],
        ['每 token 每层: top-8 + 共享', '9 专家 = 396M'],
        ['58 层激活合计', '23B (+注意力 ≈37B)']
      ];
      items.forEach(function (it, i) {
        var y = 126 + i * 26;
        ctx.fillStyle = C.dim; ctx.font = FONT;
        ctx.fillText(it[0], 30, y);
        ctx.fillStyle = C.text; ctx.font = MONO;
        ctx.fillText(it[1], 260, y);
      });
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('训练 2.788M H800 时 ≈ \$5.58M — GPT-4 传闻 \$100M+ 的零头', 30, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 专家坍缩演示 ============ */
  (function () {
    function draw() {
      var c = fit('collapseCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 2000 token 有偏 gate 模拟结果 (预计算) */
      var counts = [1908, 866, 211, 191, 203, 199, 205, 217];
      var ideal = 250;
      var bw = (c.w - 60) / 8;
      counts.forEach(function (n, i) {
        var h = n / 2000 * (c.h - 90);
        var col = i === 0 ? C.red : i === 1 ? C.orange : C.blue;
        ctx.fillStyle = col + '66';
        ctx.fillRect(30 + i * bw, c.h - 52 - h, bw - 10, h);
        ctx.strokeStyle = col;
        ctx.strokeRect(30 + i * bw, c.h - 52 - h, bw - 10, h);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(n, 30 + i * bw + 4, c.h - 58 - h);
        ctx.fillStyle = C.dim;
        ctx.fillText('E' + i, 30 + i * bw + 14, c.h - 36);
      });
      /* 理想线 */
      var iy = c.h - 52 - ideal / 2000 * (c.h - 90);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = C.green;
      ctx.beginPath(); ctx.moveTo(24, iy); ctx.lineTo(c.w - 30, iy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('理想均衡 250 (12.5%)', c.w - 190, iy - 6);
      /* 注解 */
      ctx.fillStyle = C.red; ctx.font = MONO;
      ctx.fillText('E0 占 48% — 2000 个 token 挤爆 1 个专家, 其余 7 个几乎失业', 30, 22);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('原因: gate 天然偏好某些专家 → 热者愈热 → 能力退化 + 显存/算力失衡', 30, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 定位对比: MoE vs Mostik ============ */
  (function () {
    function draw() {
      var c = fit('positionCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: 'MoE', q: '一个模型的容量切分', d: '专家是模型的一部分, 训练时一起学路由', col: C.green },
        { n: 'Mostik', q: '两个模型的接力协作', d: '大模型只读不写, 小模型接隐态续写 — 冻结+桥训练', col: C.purple },
        { n: 'Speculative', q: '两个模型的猜测协作', d: '小模型起草, 大模型验证 — 拒绝采样保无损', col: C.blue }
      ];
      rows.forEach(function (r, i) {
        var y = 20 + i * ((c.h - 40) / 3);
        var rh = (c.h - 48) / 3;
        ctx.fillStyle = r.col + '15';
        ctx.fillRect(14, y, c.w - 28, rh - 10);
        ctx.strokeStyle = r.col; ctx.strokeRect(14, y, c.w - 28, rh - 10);
        ctx.fillStyle = r.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText(r.n, 26, y + 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.q, 130, y + 22);
        ctx.fillStyle = C.dim;
        ctx.fillText(r.d, 130, y + 42);
      });
    }
    draw(); redraws.push(draw);
  })();

})();
