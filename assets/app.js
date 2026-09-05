/* ============================================================
   learning — 页面骨架脚本
   进度条 · 层级导航高亮 · 认知检查交互 · 平滑滚动
   每个知识点页在 </body> 前引入即可，无依赖
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 顶部阅读进度条 ---------- */
  var bar = document.createElement("div");
  bar.className = "progress-track";
  bar.innerHTML = '<div class="progress-bar"></div>';
  document.body.appendChild(bar);
  var fill = bar.querySelector(".progress-bar");

  function onScroll() {
    var doc = document.documentElement;
    var total = doc.scrollHeight - window.innerHeight;
    var pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    fill.style.width = pct + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 左侧层级导航高亮 ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("section.level"));
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".level-nav a")
  );

  function highlightNav() {
    var pos = window.scrollY + window.innerHeight * 0.35;
    var activeId = null;
    sections.forEach(function (s) {
      if (s.offsetTop <= pos) activeId = s.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + activeId);
    });
  }
  window.addEventListener("scroll", highlightNav, { passive: true });
  highlightNav();

  /* ---------- 认知检查 ---------- */
  document.querySelectorAll(".quiz").forEach(function (q) {
    var answer = parseInt(q.getAttribute("data-answer"), 10);
    q.querySelectorAll("button.opt").forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        if (q.classList.contains("done")) return;
        q.classList.add("done");
        q.querySelectorAll("button.opt").forEach(function (b2, j) {
          if (j === answer) b2.classList.add("right");
        });
        if (i !== answer) btn.classList.add("wrong");
      });
    });
  });

  /* ---------- 折叠区默认展开第一层 ---------- */
  /* 无需 JS，details 原生支持 */

  /* ---------- 数字滚动动画（用于统计卡） ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 900;
        var t0 = null;
        function step(t) {
          if (!t0) t0 = t;
          var k = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = (target * eased).toFixed(0) + suffix;
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  }
})();
