# learning — 知识解构实验室

> 由浅入深、由直观到抽象，一次完成对一个知识点的深度认知。

每个知识点一个自包含的交互式 HTML 页面，遵循**五层认知结构**：

| 层 | 名称 | 目的 |
|---|------|------|
| ① | 直觉 Intuition | 无公式建立核心图景 |
| ② | 可视化 Visualization | 交互演示，亲眼看见 |
| ③ | 数学 Mathematics | 符号与几何逐项对应 |
| ④ | 抽象 Abstraction | 线性代数/范畴视角，认知升维 |
| ⑤ | 应用 Applications | 落地到真实工程与科学 |

## 目录

- [傅里叶变换](topics/fourier-transform.html) — 信号 · 数学 · 3 个交互演示

## 特性

- 零依赖、纯静态，离线可用
- 原生 Canvas 交互可视化（无框架）
- 层间认知检查（答对再往下走）
- 深色数学可视化风格，响应式

## 开发

```
topics/           知识点页面（一页一知识）
assets/style.css  共享设计系统
assets/app.js     共享骨架脚本（进度条/导航/quiz）
index.html        知识地图首页
TEMPLATE.md       新页面写作模板
```

本地预览：直接双击任意 HTML，或 `python -m http.server`。

在线浏览：GitHub Pages → https://atyou2happy.github.io/learning/
