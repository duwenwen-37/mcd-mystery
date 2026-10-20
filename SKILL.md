---
name: mcd-mystery
description: 把麦当劳中国 MCP 餐品营养数据生成有唯一解的小票归属推理案件。用于午休小游戏、给朋友出题、挑战卡和案件解析；不用于点餐、饮食建议或真实人物调查。
---

# 麦麦悬疑局

把真实餐品资料变成可验证的轻推理游戏。四个虚构人物各拿一份不同餐品，玩家根据可靠线索还原归属。数字必须来自工具或明确标注的演示数据；故事可以创作，答案必须由程序求解。

## 开始一局

- 用户想直接体验：打开本技能目录下 `play.html`，或运行 `npm start` 后打开终端地址。不要求购买餐品，不要求提供个人订单。
- 用户想用最新官方数据：通过宿主已连接的麦当劳 MCP 调用 `list-nutrition-foods`；先看实际工具定义，当前已验证参数为 `{}`。也可使用下述本机 CLI。Token 只从本机环境读取。
- 用户只要文字出题：运行 `node scripts/build-case.mjs --input examples/official-pack.json --seed 案件编号 --output examples/case.json`，展示四份餐品的数值和全部线索，先不展示解答。注明快照日期。

## 刷新真实素材

先确认连接的是 `https://mcp.mcd.cn`，本项目只允许 `list-nutrition-foods` 和 `now-time-info`。不要读取账户、地址或订单，不要领券、抽奖、兑换、下单。

```bash
node scripts/mcp.mjs --discover
node scripts/mcp.mjs --tool list-nutrition-foods --args '{}' --output private/nutrition-response.json
node scripts/normalize-nutrition.mjs private/nutrition-response.json examples/official-pack.json
node scripts/build-standalone.mjs
```

`MCD_MCP_TOKEN` 由用户在本机配置，不在聊天或脚本参数中传递。响应保存在忽略跟踪的 `private/`，规范化后只保留白名单公开餐品字段。实际响应格式和已验证口径见 [MCP_INTEGRATION.md](MCP_INTEGRATION.md)。工具错误时明确说明失败，不悄悄换成模拟数据。

## 案件生成约束

`lib/puzzle.mjs` 是唯一的数值与答案依据。`makePuzzle(pack, seed)` 从资料中选四份餐品、生成一一对应的隐藏归属，再挑选真实成立的比较、合计和排除线索。枚举 24 种归属，只有解集大小为 1 才允许发布。不要让模型自己编造营养值、证据数值或答案。

导入包须有 `version: 1`、明确来源/日期和至少四款餐品。每款包含唯一 `id`、`name`、`basis: per-serving`、`kcal`、`protein`，`sodium` 可缺失。缺失不能写零；未知每份/每100g口径时停止。内置虚构包与官方快照有不同标签。

## 提示、验证与解析

先让用户独立推理。提示解释某条线索的推理方法，不直接剧透。提交时要求四人各选一份且不能重复，调用 `checkAnswer`。用户明确要求答案后才使用 `explain` 或 CLI 的 `--answer`。公开案件卡只包含餐品、线索、编号和来源，不含答案。

同数据包 + 同编号 + 同版本生成相同题目。内置资料更新会改变题目，因此旧挑战要保留原数据包。自定义 JSON 只存页面内存，不上传、不伪造认证标签。

## 文案与边界

语气轻松，人物固定为虚构昵称。将案件解释为小票被风吹乱的游戏，不把现实用户当嫌疑人。不要根据饮食推断人的健康、体型、性格或道德。营养信息是参考值，不表示某门店当前在售；不把游戏当营养咨询。

输出分享文案时，可以问“你把四张小票配对了吗”，不能编造通过率、玩家人数、用时或社会评价。项目是独立参赛作品，不冒充官方。
