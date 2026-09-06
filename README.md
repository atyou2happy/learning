# learning — 知识解构实验室

> 由浅入深、由直观到抽象，一次完成对一个知识点的深度认知。

每个知识点一个自包含的交互式页面。**风格：图先于文** —— 公式、图解、流程图、真实数值案例开路，文字只做注解。

## 目录

- [KV Cache](topics/kv-cache.html) — LLM 推理 · 显存账本 · 交互计算器
- [PagedAttention](topics/pagedattention.html) — LLM 推理 · 显存管理 · 三策略模拟器（前置：KV Cache）
- [FlashAttention](topics/flash-attention.html) — LLM 训练/推理 · IO-aware kernel · tiling 动画（前置：KV Cache）
- [Mostik](topics/mostik.html) — 模型协作 · 隐空间桥接 · 2026.09 新技术
- [Continuous Batching](topics/continuous-batching.html) — LLM 推理服务 · 迭代级调度 · 回填甘特图动画（前置：PagedAttention）
- [Speculative Decoding](topics/speculative-decoding.html) — LLM 推理加速 · 投机解码 · 验证游戏（前置：KV Cache）
- [采样策略](topics/sampling.html) — LLM 推理 · Temperature/Top-k/Top-p · 温度滑块（前置：Speculative Decoding）
- [MoE](topics/moe.html) — 模型架构 · 混合专家 · Router 动画 + 参数账本（671B/37B/5.5%）
- [Quantization](topics/quantization.html) — LLM 部署 · 量化 · 网格滑块 + 显存计算器（前置：KV Cache）
- [Tokenizer / BPE](topics/tokenizer.html) — LLM 基础 · 分词 · BPE 合并动画 + 上下文换算器（全站第 0 层）
- [Reasoning](topics/reasoning.html) — LLM 推理 · 推理模型 · 思考预算滑块 + R1 配方（前置：采样策略）
- [RLHF / DPO](topics/rlhf.html) — LLM 训练 · 对齐 · 三步流水线动画 + Goodhart 曲线（前置：Reasoning）
- [RAG / Embedding](topics/rag.html) — LLM 应用 · 检索增强 · 向量空间拖拽 + 检索流水线（前置：Tokenizer）
- [Agent / Function Calling](topics/agent.html) — LLM 应用 · 智能体 · ReAct 循环动画 + MCP 一座桥（前置：RAG）
- [Pretraining / Scaling Laws](topics/pretraining.html) — LLM 训练 · 第一部曲 · 幂律曲线 + Chinchilla 审计（前置：Tokenizer）
- [GPT-6 Astra](topics/gpt6.html) — 前沿模型 · 2026-09-03 发布 · 计算机使用范式 + 八项基准 + 成本悖论（前置：Agent）
- [ViT / CLIP](topics/vit-clip.html) — 多模态 · 视觉基础 · patch 滑块 + CLIP 矩阵 + 视觉 token 账单（前置：Tokenizer）
- [Diffusion](topics/diffusion.html) — 生成模型 · 扩散 · 加噪滑块 + CFG 引导 + 两范式对照（前置：ViT/CLIP）
- [LoRA / PEFT](topics/lora.html) — LLM 微调 · 低秩适配 · rank 滑块 + QLoRA 1.1TB→48GB（前置：Quantization）
- [Self-Attention / QKV](topics/attention.html) — LLM 基础 · 枢纽概念 · 指代热力图 + √d 开关（前置：Tokenizer）
- [AirLLM](topics/airllm.html) — LLM 部署 · 逐层流式加载 · 4GB 跑 70B（前置：Quantization）
- [Mamba / SSM](topics/mamba.html) — 模型架构 · 状态空间模型 · 恒定状态 8000 倍差距 + hybrid 现状（前置：KV Cache）
- [Roofline](topics/roofline.html) — 系统底层 · 性能物理学 · 全站技巧一条曲线收拢（前置：FlashAttention）
- [Scaling Laws](topics/scaling.html) — 训练理论 · 缩放定律 · Kaplan→Chinchilla→Llama3 三幕剧 + 算力计算器（前置：Pretraining）

## 页面结构（五层）

| 层 | 名称 | 形式 |
|---|------|------|
| ① | 问题 Problem | 一张图 + 三个数字 |
| ② | 机制 Mechanism | 图解 + 公式 |
| ③ | 对比 Contrast | 交互模拟器（真实数值） |
| ④ | 方案 Solution | 结构图 + 流程图 |
| ⑤ | 实测 Evidence | 论文数据 + 参数速查 |

## 特性

- 零依赖、纯静态，离线可用
- 原生 Canvas 图解 / DOM 模拟器（无框架）
- 层间认知检查（干扰项 = 常见误解）
- 深色数学可视化风格，响应式

## 开发

```
topics/<slug>.html   知识点页面（结构 + 文案）
topics/<slug>.js     该页全部演示逻辑（node --check 可校验）
assets/style.css     共享设计系统
assets/app.js        共享骨架（进度条/导航/quiz）
index.html           知识地图
TEMPLATE.md          写作规范
```

本地预览：直接双击 HTML，或 `python -m http.server`。

在线浏览：https://atyou2happy.github.io/learning/
