# MCP 实际集成与验证

## 服务与工具

- 官方服务：`https://mcp.mcd.cn`，Streamable HTTP，Bearer 认证。
- 实际调用：`initialize` → `notifications/initialized` → `tools/list` → `tools/call`，工具名 `list-nutrition-foods`，参数 `{}`。
- 本机客户端白名单还允许 `now-time-info`，本轮并未把它列为已实测业务工具。
- 不调用账号、地址、历史订单或任何交易工具。Token 在环境变量中读取；不进入网页或发布包。未知主机不接收凭据，请求禁止重定向。

官方参考：[M-China/mcd-mcp-server](https://github.com/M-China/mcd-mcp-server)。

## 真实调用结果

北京时间 **2026-10-19 23:26:57**，营养工具返回业务 `success=true`、`code=200`，含 160 行餐品营养记录。实际返回不是 JSON 数组，而是 `structuredContent.data` 中的表格字符串：

```text
[160]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:
  中薯条,null,1210,289,4,12,38,165,18
```

规范化器严格校验表头、行数、字段数量及数值，再按餐品名白名单保留 16 款公开餐品，去重后输出 `examples/official-pack.json`。不复制 traceId、账户信息或原始响应外壳。原始营养字符串的 SHA-256 写入来源记录供本机核验；公开包仅含游戏需要的餐品名、每份能量/蛋白质/钠和获取时间。

每份口径参考麦当劳中国官网[薯条页面及营养计算器说明](https://www.mcdonalds.com.cn/product/french-fries)；官网说明其营养数据以单份餐品计量。`energyKcal` 直接使用官方字段，不把 kJ 当作 kcal；蛋白质为 g，钠为 mg。实际供应和配方可能变化，快照不是实时在售承诺。

## 数据如何决定游戏

1. 官方营养记录提供候选餐品和数值，不读取个人饮食历史。
2. 相同版本的数据包与案件编号产生同样的四款餐品和隐藏归属。
3. 线索从餐品数值生成，例如“两人餐品能量合计578 kcal”或“一人的蛋白质高于另一人”。
4. 确定性求解器枚举全部24种归属，筛出满足线索的解集。
5. 仅当解集大小恰为1，才展示案件；冗余线索会被剔除。
6. 玩家提交后按相同规则验证；解答列出归属，可逐条复核。

这使 MCP 数据影响题目、线索与答案，而不只是页面上附加一段查询结果。更换餐品数据后，同一编号的案件也会变化。

## 业务与体验价值

将低频查表能力转成无需消费的趣味体验：用户从被动看营养表，变成主动比较餐品；案件图和同题挑战让朋友能够继续参与。传播效果是待验证假设，不以测试通过或接口成功代替真实用户成效。

## 复现与失败处理

```bash
# Node.js 20+；本机环境配置 MCD_MCP_TOKEN 后执行
node scripts/mcp.mjs --discover
node scripts/mcp.mjs --tool list-nutrition-foods --args '{}' --output private/nutrition-response.json
node scripts/normalize-nutrition.mjs private/nutrition-response.json examples/official-pack.json
node scripts/build-standalone.mjs
npm test
```

401/429、超时、错误业务码、格式变化、缺失值都明确报错。不会用演示数据冒充真实成功，也不自动重试产生额外调用。本次仅验证营养查询；没有验证下单、支付或其他业务，项目也不提供这些功能。

网页默认读取上述真实历史快照；用户可手动切换到 `demo-pack.json` 的虚构数据，界面与下载卡均标明来源。自定义包的来源由导入者声明，页面不认证其真实性。
