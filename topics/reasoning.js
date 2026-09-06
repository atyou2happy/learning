/* reasoning.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 同一道题两种模式 ============ */
  (function () {
    function draw() {
      var c = fit('twoCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 左: 直接答 */
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('模式A · 直接答', 16, 20);
      var lsteps = [
        ['读题 → 立刻输出公式 → 8×7=54', C.red],
        ['答案 54 ✗', C.red]
      ];
      lsteps.forEach(function (s, i) {
        ctx.fillStyle = s[1] + '33';
        ctx.fillRect(16, 30 + i * 26, c.w / 2 - 40, 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(s[0], 24, 45 + i * 26);
      });
      /* 右: 思考链 */
      var rx = c.w / 2 + 16;
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('模式B · 先思考再答', rx, 20);
      var rsteps = [
        ['读题… 8×7… 等等, 先列竖式', C.blue],
        ['7×8 五十六… 但进位呢? 检查一遍', C.blue],
        ['发现口算可能错 → 重算 → 56', C.green],
        ['答案 56 ✓ (还多花了 4 秒)', C.green]
      ];
      rsteps.forEach(function (s, i) {
        ctx.fillStyle = s[1] + '33';
        ctx.fillRect(rx, 30 + i * 26, c.w / 2 - 32, 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(s[0], rx + 8, 45 + i * 26);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('同一个模型! 差别只在「生成前允许先写多少思考」', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · R1 训练配方四阶段 ============ */
  (function () {
    function draw() {
      var c = fit('recipeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var stages = [
        { n: 'SFT 冷启动', d: '数千条长 CoT 样本教会「思考的格式」', col: C.blue },
        { n: 'GRPO 推理 RL', d: '奖励=答案对错+格式 → 反思/验证涌现', col: C.green },
        { n: '拒绝采样+再 SFT', d: '挑最优样本重训, 补全对话/写作/事实', col: C.orange },
        { n: '全场景 RL', d: '推理奖励继续 + 人类偏好对齐', col: C.purple }
      ];
      var bw = (c.w - 40) / 4 - 12;
      stages.forEach(function (s, i) {
        var x = 16 + i * (bw + 16);
        ctx.fillStyle = s.col + '25';
        ctx.fillRect(x, 34, bw, c.h - 78);
        ctx.strokeStyle = s.col; ctx.strokeRect(x, 34, bw, c.h - 78);
        ctx.fillStyle = s.col; ctx.font = 'bold 13.5px monospace';
        ctx.fillText('阶段' + (i + 1), x + 12, 58);
        ctx.fillStyle = C.text; ctx.font = 'bold 13.5px sans-serif';
        ctx.fillText(s.n, x + 12, 80);
        /* 描述竖排小字 */
        ctx.fillStyle = C.dim; ctx.font = '12.5px sans-serif';
        wrapText(ctx, s.d, x + 12, 102, bw - 20, 16);
        /* 箭头 */
        if (i < 3) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + bw + 2, 60); ctx.lineTo(x + bw + 14, 60); ctx.stroke();
        }
      });
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('关键: 没人教过「检查/回溯/换个思路」— 它们是从「答对拿奖励」里长出来的', 16, c.h - 14);
    }
    function wrapText(ctx, txt, x, y, maxw, lh) {
      var line = '';
      for (var i = 0; i < txt.length; i++) {
        if (ctx.measureText(line + txt[i]).width > maxw && line) {
          ctx.fillText(line, x, y); line = txt[i]; y += lh;
        } else line += txt[i];
      }
      ctx.fillText(line, x, y);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · aha moment ============ */
  (function () {
    function draw() {
      var c = fit('ahaCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 训练步数 x 轴, 平均思考长度 y 轴 */
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(50, 20); ctx.lineTo(50, c.h - 34); ctx.lineTo(c.w - 16, c.h - 34); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('训练步数 →', c.w - 100, c.h - 16);
      ctx.fillText('思考长度', 8, 30);
      /* 三段折线: 平坦→激增→稳定 */
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, c.h - 40);
      ctx.lineTo(50 + (c.w - 80) * 0.3, c.h - 40 - (c.h - 70) * 0.15);
      ctx.lineTo(50 + (c.w - 80) * 0.55, 34);
      ctx.lineTo(50 + (c.w - 80) * 0.75, 40);
      ctx.lineTo(c.w - 20, 30);
      ctx.stroke(); ctx.lineWidth = 1;
      /* aha 标注 */
      var ax = 50 + (c.w - 80) * 0.55;
      ctx.strokeStyle = C.orange;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(ax, 34); ctx.lineTo(ax, c.h - 34); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('"aha moment"', ax - 34, 24);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('模型自发写出:', ax + 10, 50);
      ctx.fillStyle = C.green; ctx.font = MONO;
      ctx.fillText('"等一下, 让我重新想想"', ax + 10, 70);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('没有任何人教 — 奖励只看答案对错', ax + 10, 90);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 准确率 vs 思考预算 (核心交互) ============ */
  (function () {
    var LOGMAX = Math.log(32768);
    function accAt(t) {
      return 79.8 - 14 * Math.log(32768 / t) / Math.log(16);
    }
    function draw() {
      var c = fit('budgetCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var x0 = 64, y0 = c.h - 44, x1 = c.w - 20, y1 = 24;
      ctx.strokeStyle = C.dim;
      ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('准确率%', 8, y1 + 8);
      ctx.fillText('思考 token (log 刻度) →', x0 + 40, c.h - 14);
      [55, 60, 65, 70, 75, 80].forEach(function (v) {
        var y = y0 - (v - 55) / 25 * (y0 - y1);
        ctx.strokeStyle = 'rgba(139,148,158,.15)';
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.fillStyle = C.dim;
        ctx.fillText('' + v, x0 - 26, y + 4);
      });
      var pts = [512, 1024, 2048, 4096, 8192, 16384, 32768];
      pts.forEach(function (t) {
        var x = x0 + (Math.log(t) - Math.log(512)) / (LOGMAX - Math.log(512)) * (x1 - x0);
        ctx.fillStyle = C.dim;
        ctx.fillText(t >= 1024 ? (t / 1024) + 'k' : '' + t, x - 12, y0 + 16);
      });
      ctx.strokeStyle = C.green; ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach(function (t, i) {
        var x = x0 + (Math.log(t) - Math.log(512)) / (LOGMAX - Math.log(512)) * (x1 - x0);
        var y = y0 - (accAt(t) - 55) / 25 * (y0 - y1);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.strokeStyle = C.red; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      pts.forEach(function (t, i) {
        var x = x0 + (Math.log(t) - Math.log(512)) / (LOGMAX - Math.log(512)) * (x1 - x0);
        var cost = t / 32768 * 100;
        var y = y0 - cost / 100 * (y0 - y1) * 0.9;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('准确率 (对数线性)', x1 - 170, 34);
      ctx.fillStyle = C.red;
      ctx.fillText('成本 (线性)', x1 - 100, y0 - 60);
      var cur = document.getElementById('budgetSlider');
      var t = cur ? parseInt(cur.value, 10) : 8192;
      var cx = x0 + (Math.log(t) - Math.log(512)) / (LOGMAX - Math.log(512)) * (x1 - x0);
      var cy = y0 - (accAt(t) - 55) / 25 * (y0 - y1);
      ctx.fillStyle = C.orange;
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText(accAt(t).toFixed(1) + '% @ ' + (t >= 1024 ? (t / 1024) + 'k' : t) + ' tok', cx + 10, cy - 10);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('示意曲线 (R1 渐近 79.8%): 预算 x16 -> +14pp, 但成本 x16 — 后半段性价比骤降', x0, y1 - 6);
    }
    var slider = document.getElementById('budgetSlider');
    var lbl = document.getElementById('budgetLabel');
    if (slider) slider.addEventListener('input', function () {
      if (lbl) lbl.textContent = (parseInt(slider.value, 10) >= 1024 ? (parseInt(slider.value, 10) / 1024) + 'k' : slider.value) + ' tok';
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 思考的账单 ============ */
  (function () {
    function draw() {
      var c = fit('billCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: '13B 权重 fp16', gb: 26, col: C.blue },
        { n: '20k 思考 KV fp16', gb: 15.3, col: C.red },
        { n: '同 KV int8', gb: 7.6, col: C.orange },
        { n: '同 KV int4', gb: 3.8, col: C.green }
      ];
      var maxG = 28;
      rows.forEach(function (r, i) {
        var y = 26 + i * ((c.h - 60) / 4);
        var w = r.gb / maxG * (c.w - 240);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(180, y, w, 24);
        ctx.strokeStyle = r.col; ctx.strokeRect(180, y, w, 24);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 17);
        ctx.font = MONO;
        ctx.fillText(r.gb + ' GB', 186 + w + 8, y + 17);
      });
      ctx.fillStyle = C.orange; ctx.font = MONO;
      ctx.fillText('20k 思考 = 权重的 59%! 一条请求的临时账单快赶上模型本身', 16, c.h - 30);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('KV/token 0.78MB (13B, 40层, fp16) x 20k token · 生成耗时 @40tok/s 约 8.3 分钟 · 还要付这 2 万个 token 的钱', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
