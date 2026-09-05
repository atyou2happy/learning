# 新知识点页面写作模板

## 命名

`topics/<slug>.html`，slug 用英文小写连字符（如 `fourier-transform.html`）。

## 五层结构（不可跳层、不可乱序）

1. **LAYER 1 直觉** — 全程无公式。一个生活场景 + 核心直觉 blockquote + 至少 1 个"为什么是它"的论证。
2. **LAYER 2 可视化** — 至少 1 个交互 demo（Canvas + 滑块/按钮），层末认知检查。
3. **LAYER 3 数学** — 把 L2 的每个几何操作逐项翻译成符号（用表格对照），推导不超过 3 步一停。深究内容放 `<details>`。
4. **LAYER 4 抽象** — 换视角（线性代数/对偶/几何），给 1-2 个"一句话解释一切"的升华点。
5. **LAYER 5 应用** — 4-6 张卡片，全部标注"同一模式"的哪个变体 + 带走的 3-5 句话 + 术语表。

## 固定件

- 页眉 `topic-header`：crumbs / kicker / 标题 / 一句话副题 / tags
- 左侧 `level-nav`：五层 + 返回目录
- 层末 `.quiz[data-answer]`：3 选项 + 解释（解释要能反哺直觉）
- 页脚 `topic-footer`：返回目录 + GitHub 链接
- `</body>` 前引入 `../assets/app.js`

## Canvas demo 规范

- HiDPI：`fit(id)` 模式（devicePixelRatio 缩放），resize 时重绘
- 每个值必须即时可视反馈（滑块 → 数值 + 画面同步变）
- 数值逻辑先用 node 脚本验证再嵌入页面
- JS 字符串内避免中文引号嵌套 —— 用「」或单引号

## 认知检查出题原则

- 干扰项 = 常见误解（要能从解释里指出误解在哪）
- 解释必须回扣前文的 demo 现象

## 推送

```bash
git add -A && git commit -m "topic: <slug>" && git push
```
