# AGENTS.md — AI 编码助手协作规范

本仓库是「每日一思」小程序的产品验证与开发区。任何 AI 助手在修改代码前请先读完本文件。

## 项目现状（重要）

- `demo/index.html` 是**单文件高保真 Demo**，模拟 iPhone 容器 + 底部 Tab 的小程序 UI，纯原生 HTML/CSS/JS，**零依赖、零构建**。修改它不需要任何包管理器。
- 正式版（原生微信小程序 + CloudBase）**尚未开始**。接到"开始正式开发"类指令时，以 `每日一思-产品方案.md` 的信息架构和数据模型为准。
- 产品语言：中文为主，界面点缀英文 eyebrow 标签（如 STREAK / MONTHLY）。

## 关键约束（改代码前必读）

1. **视觉风格 = Bento Grid**，必须遵守：
   - CSS Grid 不规则布局，卡片用 `col-span-2` / `row-span-2` 区分大小；禁止所有卡片同尺寸
   - 统一 gap（12px），圆角 16px（rounded-2xl），禁止直角
   - 卡片 hover：`translateY(-2px) scale(1.01)` + 阴影扩散，200ms ease-out；active 按压缩放
   - 中性色 zinc 系（`--ink` 变量族）+ 渐变强调卡（amber/rose/violet/teal），**禁止紫蓝渐变**
   - 字体：`Noto Serif SC` 衬线做标题 / 数字，正文系统无衬线；禁止 Inter/Roboto/Geist
2. **交互红线**：日历大卡（`.calendar-card`）**必须禁用 hover transform**——整卡上浮会导致格子点击落空（v0.4.2 修过的真实 bug，勿回退）。
3. **数据是模拟的**：`CHECKED_DATES`（打卡集合）、`BOOKMARKS`（书签数组）、`TODAY`（固定 2026-10-10）都是 demo 硬编码。新功能请接这些数据源，保持联动（如迷你打卡条、月度圆环都从 `CHECKED_DATES` 实时计算）。
4. **页面清单**：`page-today` / `page-history`（回顾·打卡足迹）/ `page-me` / `page-records`（回顾记录子页）/ `page-album`（集邮册）/ `page-detail`（日期详情）/ KPT 与月复盘浮层。Tab 切换走 `switchTab(tab)`，子页返回走 `goBack()`（依赖 `prevTab`）。

## 修改流程

1. 单文件架构：HTML 结构 → `<style>` → `<script>` 都在 `demo/index.html` 里，按顺序定位。
2. 改完必须自检：`node -e "new Function(require('fs').readFileSync('demo/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1])"` 确认 JS 可解析；新增元素 id 不得与现有重复。
3. 提交信息用中文，格式：`模块：做了什么（版本号）`。
4. 产品方向变更（增删功能、改信息架构）请同步更新 `每日一思-产品方案.md`。

## 已定案、不要推翻的决策

- 游戏化路线：金句书签（日常激励）+ 印记（里程碑）+ 周报（周期回报），**明确放弃**卡牌收集 / 徽章墙（对职场用户过于幼稚）
- 信息架构：Tab1 今日=写，Tab2 回顾=攒，Tab3 我的=管；历史列表是「我的」里的「回顾记录」子页
- 提交逻辑：写作自动保存（失焦/输入防抖即存）
- demo 阶段方法论：先功能后 UI——改 UI 不动功能，加功能先想清楚信息架构
