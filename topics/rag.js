/* rag.js — 全部交互演示（node --check 可直接校验） */
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

  function cos(a, b) {
    var d = a[0] * b[0] + a[1] * b[1];
    var na = Math.hypot(a[0], a[1]), nb = Math.hypot(b[0], b[1]);
    return d / (na * nb);
  }

  var redraws = [];
  window.addEventListener('resize', function () {
    redraws.forEach(function (fn) { fn(); });
  });

  /* ============ 图1 · 参数化知识的死穴 ============ */
  (function () {
    function draw() {
      var c = fit('problemCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { q: '昨天的财报数据', base: '训练截止前没有 → 编一个', col: C.red },
        { q: '公司内部 wiki', base: '从没见过 → 幻觉', col: C.red },
        { q: '产品价格', base: '背的是旧价格 → 过期', col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 24 + i * 42;
        ctx.fillStyle = 'rgba(248,81,73,.12)';
        ctx.fillRect(16, y, c.w - 32, 34);
        ctx.strokeStyle = C.red; ctx.strokeRect(16, y, c.w - 32, 34);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText('问: ' + r.q, 26, y + 22);
        ctx.fillStyle = r.col; ctx.font = FONT;
        ctx.fillText(r.base, c.w / 2 + 30, y + 22);
      });
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('参数化知识 = 「背下来的」 — 冻结在训练截止日', 16, c.h - 46);
      ctx.fillStyle = C.green;
      ctx.fillText('RAG = 「查得到的」 — 检索最新文档拼进上下文再生成', 16, c.h - 22);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图2 · 向量空间 (核心交互: 拖拽) ============ */
  (function () {
    var PTS = [
      { n: '猫', v: [-0.8, -0.5], col: C.blue },
      { n: '狗', v: [-0.7, -0.6], col: C.blue },
      { n: '老虎', v: [-0.9, -0.3], col: C.blue },
      { n: '汽车', v: [0.9, 0.3], col: C.orange },
      { n: '卡车', v: [0.8, 0.5], col: C.orange },
      { n: '披萨', v: [0.2, 0.9], col: C.green }
    ];
    var q = [-0.75, -0.55];

    function toXY(c, v) {
      return [c.w / 2 + v[0] * (c.w / 2 - 50), c.h / 2 - v[1] * (c.h / 2 - 40)];
    }
    function toV(c, x, y) {
      return [(x - c.w / 2) / (c.w / 2 - 50), (c.h / 2 - y) / (c.h / 2 - 40)];
    }

    function draw() {
      var c = fit('vecCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 坐标轴 */
      ctx.strokeStyle = 'rgba(139,148,158,.2)';
      ctx.beginPath(); ctx.moveTo(c.w / 2, 10); ctx.lineTo(c.w / 2, c.h - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, c.h / 2); ctx.lineTo(c.w - 10, c.h / 2); ctx.stroke();
      /* 点 */
      PTS.forEach(function (p) {
        var xy = toXY(c, p.v);
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 7, 0, 7); ctx.fill();
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(p.n, xy[0] + 10, xy[1] + 4);
      });
      /* 排序最近邻 */
      var sorted = PTS.slice().sort(function (a, b) {
        return cos(q, b.v) - cos(q, a.v);
      });
      /* 查询点连线 top3 */
      var qxy = toXY(c, q);
      sorted.slice(0, 3).forEach(function (p, i) {
        var xy = toXY(c, p.v);
        ctx.strokeStyle = i === 0 ? C.green : 'rgba(126,231,135,.35)';
        ctx.lineWidth = i === 0 ? 2.5 : 1;
        ctx.setLineDash(i === 0 ? [] : [4, 3]);
        ctx.beginPath(); ctx.moveTo(qxy[0], qxy[1]); ctx.lineTo(xy[0], xy[1]); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 1;
        /* cos 标注 */
        var s = cos(q, p.v).toFixed(3);
        ctx.fillStyle = i === 0 ? C.green : C.dim; ctx.font = MONO;
        ctx.fillText(s, (qxy[0] + xy[0]) / 2 - 18, (qxy[1] + xy[1]) / 2 - 6);
      });
      /* 查询点 */
      ctx.fillStyle = C.pink;
      ctx.beginPath(); ctx.arc(qxy[0], qxy[1], 9, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = C.pink; ctx.font = MONO;
      ctx.fillText('查询', qxy[0] + 12, qxy[1] - 8);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('拖动粉色查询点 — cos 相似度与 top-3 最近邻实时变化', 16, c.h - 8);
    }

    var cv = document.getElementById('vecCanvas');
    if (cv) {
      var drag = false;
      cv.addEventListener('mousedown', function (e) { drag = true; move(e); });
      window.addEventListener('mouseup', function () { drag = false; });
      cv.addEventListener('mousemove', function (e) { if (drag) move(e); });
      cv.addEventListener('touchstart', function (e) { drag = true; move(e.touches[0]); });
      cv.addEventListener('touchmove', function (e) { if (drag) move(e.touches[0]); });
      cv.addEventListener('touchend', function () { drag = false; });
    }
    function move(e) {
      var cvEl = document.getElementById('vecCanvas');
      var rect = cvEl.getBoundingClientRect();
      var w = cvEl.clientWidth, h = cvEl.clientHeight;
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var v = [(x - w / 2) / (w / 2 - 50), (h / 2 - y) / (h / 2 - 40)];
      q[0] = Math.max(-0.95, Math.min(0.95, v[0]));
      q[1] = Math.max(-0.95, Math.min(0.95, v[1]));
      draw();
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图3 · 向量算术 ============ */
  (function () {
    function draw() {
      var c = fit('arithCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var K = [-0.6, -0.7], M = [-0.9, -0.1], W = [0.9, -0.1], Q = [0.55, -0.75];
      var R = [K[0] - M[0] + W[0], K[1] - M[1] + W[1]];
      function toXY(v) {
        return [c.w / 2 + v[0] * (c.w / 2 - 60), c.h / 2 - v[1] * (c.h / 2 - 40)];
      }
      /* 轴 */
      ctx.strokeStyle = 'rgba(139,148,158,.2)';
      ctx.beginPath(); ctx.moveTo(c.w / 2, 8); ctx.lineTo(c.w / 2, c.h - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, c.h / 2); ctx.lineTo(c.w - 8, c.h / 2); ctx.stroke();
      /* 步骤箭头: 国王 -> (减男人) -> (加女人) */
      var kxy = toXY(K), mxy = toXY(M), wxy = toXY(W), qxy = toXY(Q), rxy = toXY(R);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(kxy[0], kxy[1]);
      ctx.lineTo(kxy[0] - (mxy[0] + 60 - kxy[0]) * 0 + (R[0] - K[0]) * (c.w / 2 - 60) * 0.5, kxy[1] - (R[1] - K[1]) * (c.h / 2 - 40) * 0.5);
      ctx.stroke(); ctx.lineWidth = 1;
      /* 画箭头到 R */
      ctx.strokeStyle = C.pink; ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(kxy[0], kxy[1]); ctx.lineTo(rxy[0], rxy[1]); ctx.stroke();
      ctx.setLineDash([]); ctx.lineWidth = 1;
      /* 四个词 */
      function pt(xy, n, col, r) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(xy[0], xy[1], r, 0, 7); ctx.fill();
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(n, xy[0] + 10, xy[1] + 4);
      }
      pt(kxy, '国王', C.blue, 7);
      pt(mxy, '男人', C.dim, 5);
      pt(wxy, '女人', C.dim, 5);
      pt(qxy, '女王', C.green, 7);
      pt(rxy, '计算结果', C.pink, 8);
      ctx.strokeStyle = '#fff'; ctx.stroke();
      /* 公式 */
      ctx.fillStyle = C.text; ctx.font = MONO;
      ctx.fillText('国王 − 男人 + 女人 = [1.20, −0.70] · cos(结果, 女王) = 0.917', 16, 22);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('方向携带语义: 「性别」维度被减掉再加回 — 嵌入空间的线性结构', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图4 · RAG 流水线 ============ */
  (function () {
    function draw() {
      var c = fit('pipeCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      /* 上行: 离线索引 */
      var steps1 = [
        { n: '文档', d: '100MB wiki' },
        { n: '切分 chunk', d: '512 tok +64 重叠' },
        { n: 'Embedding', d: '每 chunk -> 向量' },
        { n: '向量库', d: 'ANN 索引' }
      ];
      var bw = (c.w / 2 - 40) / 4 - 10;
      steps1.forEach(function (s, i) {
        var x = 16 + i * (bw + 12);
        ctx.fillStyle = 'rgba(88,166,255,.12)';
        ctx.fillRect(x, 26, bw, 52);
        ctx.strokeStyle = C.blue; ctx.strokeRect(x, 26, bw, 52);
        ctx.fillStyle = C.text; ctx.font = 'bold 12.5px sans-serif';
        ctx.fillText(s.n, x + 8, 46);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(s.d, x + 8, 64);
        if (i < 3) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + bw + 1, 52); ctx.lineTo(x + bw + 10, 52); ctx.stroke();
        }
      });
      ctx.fillStyle = C.blue; ctx.font = FONT;
      ctx.fillText('离线 · 建一次', 16, 96);
      /* 下行: 在线查询 */
      var steps2 = [
        { n: '查询', d: '用户问题' },
        { n: '向量化', d: '同 embedding 模型' },
        { n: 'ANN 检索', d: 'top-k=5 chunks' },
        { n: '重排+拼prompt', d: 'rerank -> 上下文' },
        { n: '生成', d: 'LLM 基于证据答' }
      ];
      var bw2 = (c.w / 2 - 40) / 5 + 26;
      steps2.forEach(function (s, i) {
        var x = 16 + i * (bw2 - 18);
        ctx.fillStyle = 'rgba(126,231,135,.12)';
        ctx.fillRect(x, 112, bw2 - 22, 52);
        ctx.strokeStyle = C.green; ctx.strokeRect(x, 112, bw2 - 22, 52);
        ctx.fillStyle = C.text; ctx.font = 'bold 12.5px sans-serif';
        ctx.fillText(s.n, x + 6, 132);
        ctx.fillStyle = C.dim; ctx.font = '11.5px sans-serif';
        ctx.fillText(s.d, x + 6, 150);
        if (i < 4) {
          ctx.strokeStyle = C.dim;
          ctx.beginPath(); ctx.moveTo(x + bw2 - 21, 138); ctx.lineTo(x + bw2 - 12, 138); ctx.stroke();
        }
      });
      ctx.fillStyle = C.green; ctx.font = FONT;
      ctx.fillText('在线 · 每次查询 ~百毫秒', 16, 182);
      /* 底注 */
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('关键: 查询和文档必须用同一个 embedding 模型 — 两套坐标系无法比较', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图5 · 检索的账单 + 方案对比 ============ */
  (function () {
    function draw() {
      var c = fit('billCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      var rows = [
        { n: '检索 5 页 (2.5k tok)', gb: 1.9, col: C.green },
        { n: '检索 10 页 (5k tok)', gb: 3.8, col: C.orange },
        { n: '检索 30 页 (15k tok)', gb: 11.4, col: C.red }
      ];
      rows.forEach(function (r, i) {
        var y = 24 + i * 40;
        var w = r.gb / 12 * (c.w / 2 - 60);
        ctx.fillStyle = r.col + '55';
        ctx.fillRect(190, y, w, 26);
        ctx.strokeStyle = r.col; ctx.strokeRect(190, y, w, 26);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(r.n, 16, y + 18);
        ctx.font = MONO;
        ctx.fillText(r.gb + ' GB', 196 + w + 8, y + 18);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('KV/token 0.78MB (13B fp16) — 检索内容也要付 KV 账单 (一次性 prefill, 不留 Cache 更省)', 16, 136);
      /* 右: 三方案 */
      var rx = c.w / 2 + 20;
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('知识注入三方案', rx, 24);
      var plans = [
        { n: 'RAG', d: '索引几小时 · 检索百ms · 更新即插即拔', col: C.green },
        { n: '微调', d: '数千 GPU 时 · 更新要重跑 · 改风格最好', col: C.purple },
        { n: '长上下文', d: '每次全塞 25M tok 不可行 · 100k 检索过可行', col: C.orange }
      ];
      plans.forEach(function (p, i) {
        var y = 36 + i * 44;
        ctx.fillStyle = p.col + '18';
        ctx.fillRect(rx, y, c.w - rx - 16, 36);
        ctx.strokeStyle = p.col; ctx.strokeRect(rx, y, c.w - rx - 16, 36);
        ctx.fillStyle = p.col; ctx.font = MONO;
        ctx.fillText(p.n, rx + 10, y + 16);
        ctx.fillStyle = C.dim; ctx.font = '12px sans-serif';
        ctx.fillText(p.d, rx + 10, y + 30);
      });
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('现实中三者混用: RAG 管事实, 微调管风格, 长上下文管单文档深读', 16, c.h - 10);
    }
    draw(); redraws.push(draw);
  })();

  /* ============ 图6 · chunk 重叠示意 ============ */
  (function () {
    function draw() {
      var c = fit('chunkCanvas'); if (!c) return;
      var ctx = c.ctx;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, c.w, c.h);
      ctx.fillStyle = C.text; ctx.font = 'bold 13.5px monospace';
      ctx.fillText('一篇 10k token 文档 -> 23 个 chunks (512 tok + 64 重叠)', 16, 20);
      /* 长条 = 文档 */
      var y0 = 44, totalW = c.w - 32;
      ctx.fillStyle = 'rgba(139,148,158,.15)';
      ctx.fillRect(16, y0, totalW, 14);
      /* chunk 视图: 3 段示意, 重叠高亮 */
      var chunks = [
        { x: 16, w: totalW * 0.32, n: 'chunk 1', col: C.blue },
        { x: 16 + totalW * 0.32 - totalW * 0.04, w: totalW * 0.32, n: 'chunk 2', col: C.green },
        { x: 16 + totalW * 0.64 - totalW * 0.08, w: totalW * 0.32, n: 'chunk 3', col: C.orange }
      ];
      chunks.forEach(function (ch, i) {
        var y = 72 + i * 34;
        ctx.fillStyle = ch.col + '44';
        ctx.fillRect(ch.x, y, ch.w, 22);
        ctx.strokeStyle = ch.col; ctx.strokeRect(ch.x, y, ch.w, 22);
        ctx.fillStyle = C.text; ctx.font = FONT;
        ctx.fillText(ch.n + '  (512 tok)', ch.x + 8, y + 15);
      });
      /* 重叠标注 */
      var ov1 = chunks[1].x, ov2 = chunks[2].x;
      ctx.fillStyle = C.pink;
      ctx.fillRect(ov1, 72, 3, 62);
      ctx.fillRect(ov2, 106, 3, 28);
      ctx.fillStyle = C.pink; ctx.font = FONT;
      ctx.fillText('64 tok 重叠: 关键句跨 chunk 边界时, 至少有一个 chunk 含完整语义', 16 + totalW * 0.36, c.h - 24);
      ctx.fillStyle = C.dim; ctx.font = FONT;
      ctx.fillText('检索 top-k=5 -> 约 2.5k token 进 prompt — 证据要少而准, 不是多而全', 16, c.h - 6);
    }
    draw(); redraws.push(draw);
  })();

})();
