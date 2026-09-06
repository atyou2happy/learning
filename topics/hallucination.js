/* hallucination.js — 全部交互演示（node --check 可直接校验） */
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

  /* ============ 图1 · 幻觉众生相 ============ */
  (function () {
    function draw() {
      var c = fit('zooCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('一本正经地胡说 — 三个真实形态', 16, 22);
      var cases = [
        { n: '虚构引用', q: '「这篇 2023 年论文怎么引用？」', a: 'Smith et al. (2023). "A Novel Approach to..." — 论文不存在, 但格式完美', col: C.red },
        { n: '编造 API', q: '「用 pandas 的 merge_better()」', a: '函数不存在 — 但参数说明和示例代码写得有模有样', col: C.orange },
        { n: '张冠李戴', q: '「XX 桥是哪年建的？」', a: '把 1892 年安到 1887 年 — 半真半假最难察觉', col: C.purple }
      ];
      cases.forEach(function (cs, i) {
        var y = 40 + i * 52;
        ctx.fillStyle = cs.col + '12';
        ctx.fillRect(16, y, c.w - 32, 44);
        ctx.strokeStyle = cs.col; ctx.strokeRect(16, y, c.w - 32, 44);
        ctx.fillStyle = cs.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(cs.n, 26, y + 18);
        ctx.fillStyle = C.dim; ctx.font = '11.5px monospace';
        ctx.fillText(cs.q, 130, y + 18);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(cs.a, 26, y + 36);
      });
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('共同点: 流畅、自信、格式完美 — 语言层面毫无破绽, 事实层面完全塌方', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 温度 vs 幻觉 (核心交互) ============ */
  (function () {
    var T = 1.0;
    function softmaxIdx(logits, temp) {
      var zs = logits.map(function (l) { return l / temp; });
      var m = Math.max.apply(null, zs);
      var es = zs.map(function (z) { return Math.exp(z - m); });
      var s = es.reduce(function (a, b) { return a + b; }, 0);
      return es.map(function (e) { return e / s; });
    }
    function draw() {
      var c = fit('tempCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var cands = [
        { t: '"2020年"', logit: 2.9, col: C.green },
        { t: '"2019年"', logit: 3.2, col: C.green },
        { t: '"1887年"(错)', logit: 3.5, col: C.red },
        { t: '"我不确定"', logit: 0.8, col: C.blue }
      ];
      var logits = cands.map(function (cd) { return cd.logit; });
      var probs = softmaxIdx(logits, T);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('问: 「这座桥是哪年建的?」 T = ' + T.toFixed(2), 16, 22);
      cands.forEach(function (cd, i) {
        var y = 42 + i * 40;
        var w2 = probs[i] * (c.w - 300);
        ctx.fillStyle = cd.col + '55';
        ctx.fillRect(160, y, Math.max(4, w2), 28);
        ctx.strokeStyle = cd.col; ctx.strokeRect(160, y, Math.max(4, w2), 28);
        ctx.fillStyle = C.text; ctx.font = 'bold 12px monospace';
        ctx.fillText(cd.t, 16, y + 19);
        ctx.fillStyle = cd.col; ctx.font = MONO;
        ctx.fillText((probs[i] * 100).toFixed(1) + '%', 168 + Math.max(4, w2) + 8, y + 19);
      });
      var top = probs.indexOf(Math.max.apply(null, probs));
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('T→0: 尖峰若是错的, 越低越坚定地错 — 当前 argmax: ', 16, 186);
      ctx.fillStyle = cands[top].col;
      ctx.fillText(cands[top].t + ' (' + (probs[top] * 100).toFixed(0) + '%)', 390, 186);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('温度管「怎么抽」, 不管「抽得对不对」— 事实错误是分布本身的事', 16, c.h - 10);
    }
    var slider = document.getElementById('hTempSlider');
    var lbl = document.getElementById('hTempLabel');
    if (slider) slider.addEventListener('input', function () {
      T = parseFloat(slider.value);
      if (lbl) lbl.textContent = 'T = ' + T.toFixed(2);
      draw();
    });
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 根因: 两种机器 ============ */
  (function () {
    function draw() {
      var c = fit('rootCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('训练目标决定行为 — 像不像 ≠ 真不真', 16, 22);
      /* 左: 数据库 */
      var x1 = 30;
      ctx.fillStyle = 'rgba(126,231,135,.12)';
      ctx.fillRect(x1, 44, c.w / 2 - 60, 110);
      ctx.strokeStyle = C.green; ctx.strokeRect(x1, 44, c.w / 2 - 60, 110);
      ctx.fillStyle = C.green; ctx.font = 'bold 13px monospace';
      ctx.fillText('检索机器 (数据库)', x1 + 14, 66);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('查询 → 精确匹配 → 要么有要么没有', x1 + 14, 92);
      ctx.fillText('不会幻觉 — 也不会创作', x1 + 14, 114);
      ctx.fillStyle = C.dim;
      ctx.fillText('SELECT * FROM facts WHERE ...', x1 + 14, 140);
      /* 右: 语言模型 */
      var x2 = c.w / 2 + 30;
      ctx.fillStyle = 'rgba(248,81,73,.12)';
      ctx.fillRect(x2, 44, c.w / 2 - 60, 110);
      ctx.strokeStyle = C.red; ctx.strokeRect(x2, 44, c.w / 2 - 60, 110);
      ctx.fillStyle = C.red; ctx.font = 'bold 13px monospace';
      ctx.fillText('补全机器 (LLM)', x2 + 14, 66);
      ctx.fillStyle = C.text; ctx.font = FONT;
      ctx.fillText('上下文 → 最像的续写 → 总有答案', x2 + 14, 92);
      ctx.fillText('会创作 — 也会幻觉 (同一枚硬币)', x2 + 14, 114);
      ctx.fillStyle = C.dim;
      ctx.fillText('loss = 下一个词的交叉熵 (没有事实核查项)', x2 + 14, 140);
      ctx.fillStyle = C.pink; ctx.font = FONT;
      ctx.fillText('幻觉不是 bug 是特性的真正含义: 创造力和编造共享同一个机制 — 压制一个就伤另一个', 16, 172);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('RLHF 再加一刀: 奖励偏好「自信流畅」→ 模型学会不确定时也演确定', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · 药柜 ============ */
  (function () {
    function draw() {
      var c = fit('cureCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('缓解药柜 — 各药各治什么', 16, 22);
      var cures = [
        { n: 'RAG', d: '回忆变查询: 先取回真实文档再生成', eff: '最强主力', col: C.green, link: 'rag 页' },
        { n: '工具调用', d: '搜索代替记忆, 引用可溯源', eff: '计算机使用范式', col: C.blue, link: 'gpt6 页' },
        { n: '校准', d: '允许说不知道, 拒答率换准确率', eff: 'trade-off', col: C.purple, link: '评测' },
        { n: '温度调低', d: '减少随机性', eff: '不消除系统性幻觉', col: C.orange, link: '本页 L2' },
        { n: '更强模型', d: '参数里装了更多真事实', eff: '降低但不归零', col: C.pink, link: 'scaling 页' }
      ];
      cures.forEach(function (cu, i) {
        var y = 42 + i * 32;
        ctx.fillStyle = cu.col + '12';
        ctx.fillRect(16, y, c.w - 32, 26);
        ctx.strokeStyle = cu.col; ctx.strokeRect(16, y, c.w - 32, 26);
        ctx.fillStyle = cu.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(cu.n, 26, y + 18);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(cu.d, 150, y + 18);
        ctx.fillStyle = cu.col; ctx.font = '11.5px monospace';
        ctx.fillText(cu.eff, 560, y + 18);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('组合拳是常态: RAG 打底 + 工具核证 + 校准兜底 — 单药都不够', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 共存策略 ============ */
  (function () {
    function draw() {
      var c = fit('coexistCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('幻觉能消除吗? — 不能, 只能管理', 16, 22);
      var rows = [
        { n: '查得着的', who: '交给 RAG/搜索', col: C.green },
        { n: '要准确的数字', who: '交给工具/代码执行', col: C.blue },
        { n: '创作与头脑风暴', who: '放心用模型 — 幻觉在这里叫灵感', col: C.orange },
        { n: '关键决策', who: '人审 — AI 做草稿, 人做终审', col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 44 + i * 36;
        ctx.fillStyle = r.col + '12';
        ctx.fillRect(16, y, c.w - 32, 30);
        ctx.strokeStyle = r.col; ctx.strokeRect(16, y, c.w - 32, 30);
        ctx.fillStyle = r.col; ctx.font = 'bold 12.5px monospace';
        ctx.fillText(r.n, 26, y + 20);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.who, 240, y + 20);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('实测锚点: SimpleQA 长尾事实 — 旗舰模型准确率也常 <60%; FactScore 传记分解平均几处幻觉/篇', 16, 186);
      ctx.fillStyle = C.pink; ctx.font = FONT;
      ctx.fillText('正确姿势不是「别用」而是「知道哪里会塌」— 与 27 页能力叙事互补成完整世界观', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

})();
