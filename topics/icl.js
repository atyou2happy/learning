/* icl.js P1 — 图1 奇观 + 图2 induction 电路 stepper */
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

  /* ============ 图1 · 同一模型三种用法 ============ */
  (function () {
    function draw() {
      var c = fit('wowCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('同一个模型 · 三种用法 · 「学」发生在哪里', 14, 20);
      var rows = [
        { n: 'zero-shot 指令', acc: 55, cost: '参数不动 · 无示例', col: C.dim },
        { n: '3-shot ICL', acc: 92, cost: '参数不动 · 示例进上下文 (≈60 tok)', col: C.green },
        { n: '微调 (LoRA/全参)', acc: 93, cost: '改 10⁹ 参数 · 小时级训练', col: C.pink }
      ];
      rows.forEach(function (r, i) {
        var y = 44 + i * 52;
        ctx.fillStyle = C.text; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(r.n, 14, y + 4);
        ctx.fillStyle = C.dim; ctx.font = '11px monospace';
        ctx.fillText(r.cost, 14, y + 20);
        var bx = 240, bw = c.w - bx - 90;
        ctx.fillStyle = C.dark; ctx.fillRect(bx, y - 8, bw, 22);
        ctx.fillStyle = r.col; ctx.fillRect(bx, y - 8, bw * r.acc / 100, 22);
        ctx.fillStyle = r.col; ctx.font = 'bold 12px monospace';
        ctx.fillText(r.acc + '%', bx + bw + 8, y + 7);
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('ICL 与微调效果相当 — 但一个写盘 (权重), 一个只写内存 (上下文)', 14, c.h - 26);
      ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
      ctx.fillText('会话结束: 微调的进步留下, ICL 的进步蒸发 — 但下次再贴示例又立刻会了', 14, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · induction 二步电路 ============ */
  (function () {
    /* node 实算: attn [89.1, 4.5, 3.7, 2.7], P(喵)=87.8% */
    var SEQ = ['猫', '喵', '狗', '汪', '猫', '?'];
    var ATT = [89.1, 4.5, 3.7, 2.7];
    var step = 0, MAX = 4;
    var btn = document.getElementById('ihBtn');
    var rbtn = document.getElementById('ihReset');
    if (btn) btn.addEventListener('click', function () {
      step = Math.min(step + 1, MAX);
      if (btn) btn.textContent = step >= MAX ? '已完成 ↺' : '下一步 →';
      draw();
    });
    if (rbtn) rbtn.addEventListener('click', function () {
      step = 0; if (btn) btn.textContent = '下一步 →'; draw();
    });
    function draw() {
      var c = fit('ihCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('[猫 喵] [狗 汪] [猫 ?] → induction 电路找答案', 14, 20);
      /* token row */
      var tw = Math.min(72, (c.w - 60) / 6);
      SEQ.forEach(function (t, i) {
        var x = 30 + i * tw;
        var cur = i === 4, match = i === 0, next = i === 1, out = i === 5;
        var lit = (step >= 1 && match) || (step >= 3 && next) || (step >= 4 && out);
        ctx.strokeStyle = cur && step >= 1 ? C.blue : (lit ? C.green : C.dark);
        ctx.fillStyle = lit ? C.green + '22' : (cur ? C.blue + '22' : 'rgba(48,54,61,0.25)');
        ctx.fillRect(x, 36, tw - 8, 34); ctx.strokeRect(x, 36, tw - 8, 34);
        ctx.fillStyle = lit ? C.text : C.dim; ctx.font = 'bold 15px monospace';
        ctx.fillText(t, x + tw / 2 - 12, 58);
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        ctx.fillText('pos' + i, x + 4, 78);
      });
      /* step1 arrow: cur 猫 -> first 猫 */
      if (step >= 1) {
        ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30 + 4 * tw + (tw - 8) / 2, 76);
        ctx.quadraticCurveTo(30 + 4 * tw + (tw - 8) / 2, 130, 30 + (tw - 8) / 2, 130);
        ctx.quadraticCurveTo(30 + (tw - 8) / 2 - 10, 110, 30 + (tw - 8) / 2, 78);
        ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = C.blue; ctx.font = 'bold 11.5px monospace';
        ctx.fillText('① 匹配头 (QK): 当前「猫」找到 pos0 的「猫」 — attention ' + ATT[0] + '%', 60, 140);
      }
      /* step2 arrow: pos0 -> pos1 */
      if (step >= 3) {
        ctx.strokeStyle = C.green; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30 + (tw - 8) / 2, 90);
        ctx.quadraticCurveTo(30 + tw, 170, 30 + tw + (tw - 8) / 2, 92);
        ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = C.green; ctx.font = 'bold 11.5px monospace';
        ctx.fillText('② 归纳头: 从匹配位读「下一个词」= 喵 (shift-by-one)', 60, 186);
      }
      /* output readout */
      if (step >= 4) {
        var probs = [4.5, 87.8, 3.0, 4.7];
        var names = ['猫', '喵', '狗', '汪'];
        names.forEach(function (n, i) {
          var x = 30 + i * 130;
          ctx.fillStyle = i === 1 ? C.green : C.dim;
          ctx.font = (i === 1 ? 'bold ' : '') + '12px monospace';
          ctx.fillText('P(' + n + ') = ' + probs[i] + '%', x, 218);
        });
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText('临时查找表搭好: 「A→B」从上下文里学来, 零梯度', 30, 248);
      } else if (step >= 2) {
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText('匹配完成 — 但只找到 A 还不够, 需要读「A 的下一个」…', 30, 218);
      }
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('(数字 = node 真 softmax 实算, Elhage 2021 电路结构)', 30, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();
/* icl.js P2 — 图3 证据双图 + 图4 双速对照 */
  /* ============ 图3 · 随机标签 + 涌现拐点 ============ */
  (function () {
    function draw() {
      var c = fit('evCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* top: label experiment */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('实验一 · 随机标签 (Min et al. 2022)', 14, 20);
      var rows = [
        { n: '正确标签', v: 92, col: C.green },
        { n: '随机标签', v: 78, col: C.orange },
        { n: '无示例', v: 55, col: C.dim }
      ];
      rows.forEach(function (r, i) {
        var y = 36 + i * 26;
        ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(r.n, 14, y + 10);
        var bx = 100, bw = c.w / 2 - 130;
        ctx.fillStyle = C.dark; ctx.fillRect(bx, y, bw, 16);
        ctx.fillStyle = r.col; ctx.fillRect(bx, y, bw * r.v / 100, 16);
        ctx.fillStyle = r.col; ctx.font = 'bold 11.5px monospace';
        ctx.fillText(r.v + '%', bx + bw + 8, y + 12);
      });
      ctx.fillStyle = C.orange; ctx.font = 'bold 11px monospace';
      ctx.fillText('只掉 14pp — 学的主要是格式, 不是标签真值', 14, 118);
      /* bottom: bump curve */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('实验二 · in-context bump (Olsson 2022, 40M→2.25B 同型)', 14, 146);
      var x0 = 50, x1 = c.w - 40, y0 = c.h - 34, y1 = 158;
      /* loss curve with a bump/dip transition at 40% */
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= 100; i++) {
        var t = i / 100;
        var l = 3.2 * Math.pow(t + 0.08, -0.18) - 0.4;   /* base power law */
        if (t > 0.4) l -= (t - 0.4) * 1.35;              /* extra drop after bump */
        var y = y0 - (l - 0.4) / 2.6 * (y0 - y1);
        if (i === 0) ctx.moveTo(x0 + t * (x1 - x0), y); else ctx.lineTo(x0 + t * (x1 - x0), y);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      /* bump marker */
      var bx2 = x0 + 0.4 * (x1 - x0);
      ctx.strokeStyle = C.red; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(bx2, y1); ctx.lineTo(bx2, y0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red; ctx.font = 'bold 11px monospace';
      ctx.fillText('induction 电路接通', bx2 - 50, y1 + 12);
      ctx.fillStyle = C.dim; ctx.font = '10.5px monospace';
      ctx.fillText('训练步 →', x1 - 60, y0 + 16);
      ctx.fillText('loss', x0 - 24, y1 + 4);
      ctx.fillStyle = C.text; ctx.font = 'bold 11px monospace';
      ctx.fillText('能力的涌现时刻 = 电路的接通时刻 (晶体形成式, 非渐进)', 14, c.h - 12);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 双速对照 ============ */
  (function () {
    function draw() {
      var c = fit('dualCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('同构的两张键值表 — 快通路 vs 慢通路', 14, 20);
      var colW = (c.w - 40) / 2;
      var cards = [
        {
          n: '慢通路 · 微调 (梯度)', col: C.pink,
          lines: ['写入位置: FFN 键值表 (参数)', '代价: 16B/参数 · 小时级', '持久性: 永久 (写盘)', '能力: 行为/风格/知识沉淀'],
          verdict: 'von Oswald 2022: 两者数学同构'
        },
        {
          n: '快通路 · ICL (前向)', col: C.green,
          lines: ['写入位置: attention 激活 (KV Cache)', '代价: ≈60 token prefill · 秒级', '持久性: 会话即焚 (只写内存)', '能力: 格式/分布/临时映射'],
          verdict: 'ICL ≡ 激活上的梯度下降 (线性注意力已证)'
        }
      ];
      cards.forEach(function (cd, i) {
        var x = 14 + i * (colW + 12);
        ctx.strokeStyle = cd.col; ctx.fillStyle = cd.col + '10';
        ctx.fillRect(x, 38, colW, c.h - 96); ctx.strokeRect(x, 38, colW, c.h - 96);
        ctx.fillStyle = cd.col; ctx.font = 'bold 13px monospace';
        ctx.fillText(cd.n, x + 14, 62);
        ctx.fillStyle = C.text; ctx.font = '12px monospace';
        cd.lines.forEach(function (ln, j) {
          ctx.fillText('· ' + ln, x + 14, 88 + j * 24);
        });
        ctx.fillStyle = cd.col; ctx.font = 'bold 11px monospace';
        ctx.fillText(cd.verdict, x + 14, c.h - 66);
      });
      ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
      ctx.fillText('快通路处理任务 · 慢通路沉淀知识 — ICL 管格式 / RAG 管事实 / 微调管行为', 14, c.h - 24);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('(三种改表粒度与 FFN 页/LoRA 页的对齐)', 14, c.h - 8);
    }
    draw(); redraws.push(draw);
  })();
/* icl.js P3 — 图5 世界观 + 关闭 IIFE */
  /* ============ 图5 · 推理时学习全家福 ============ */
  (function () {
    function draw() {
      var c = fit('worldCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('每一次前向, 都是一次微型学习', 14, 20);
      /* center hub */
      var cx = c.w / 2, cy = c.h / 2 + 4;
      ctx.strokeStyle = C.pink; ctx.fillStyle = C.pink + '14';
      ctx.fillRect(cx - 115, cy - 26, 230, 52); ctx.strokeRect(cx - 115, cy - 26, 230, 52);
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace'; ctx.textAlign = 'center';
      ctx.fillText('ICL · 推理时学习', cx, cy - 4);
      ctx.fillStyle = C.dim; ctx.font = '11px monospace';
      ctx.fillText('激活即临时权重', cx, cy + 14);
      var members = [
        { n: 'Reasoning', d: '思维链 = 在 context 里自我教学', col: C.blue },
        { n: 'RAG', d: '检索 = 外挂示例, 知识不入权重', col: C.green },
        { n: 'Agent few-shot', d: '示例工具调用 = 行为克隆', col: C.orange },
        { n: '长上下文', d: 'RoPE 128k = 更大的临时课堂', col: C.purple },
        { n: 'KV Cache', d: '临时表存放处 (激活非参数)', col: C.pink },
        { n: '上下文工程', d: '2026 显学 — 全部站在 ICL 上', col: C.red }
      ];
      var pos = [
        { x: 130, y: 56 }, { x: c.w - 130, y: 56 }, { x: 92, y: cy },
        { x: c.w - 92, y: cy }, { x: 130, y: c.h - 40 }, { x: c.w - 130, y: c.h - 40 }
      ];
      members.forEach(function (m, i) {
        var p = pos[i];
        ctx.strokeStyle = m.col + '88';
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(cx + (p.x < cx ? -115 : 115), cy + (p.y < cy ? -18 : (p.y > cy ? 18 : 0)));
        ctx.stroke();
        ctx.fillStyle = m.col; ctx.font = 'bold 11.5px monospace'; ctx.textAlign = 'center';
        ctx.fillText(m.n, p.x, p.y - 4);
        ctx.fillStyle = C.dim; ctx.font = '10px monospace';
        ctx.fillText(m.d, p.x, p.y + 12);
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = C.text; ctx.font = 'bold 11.5px monospace';
      ctx.fillText('梯度下降改参数是学习, attention 改激活也是学习 — 双通路完整地图', 14, c.h - 14);
    }
    draw(); redraws.push(draw);
  })();
})();
