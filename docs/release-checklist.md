# Atlas Release Checklist

本清单适用于功能分支、Pull Request、Vercel Preview 和后续经批准的 Production 发布。功能分支不得直接部署 Production。

## 1. 变更范围

- 确认变更位于功能分支，不在 `main` 直接开发。
- 记录 UI、路由、数据库、环境变量和第三方服务变化。
- 确认没有提交 `.env*`、API Key、Supabase Secret 或真实用户数据。
- 确认 Migration 向后兼容并有独立回滚步骤。

## 2. 本地与 CI 验证

- `npm ci`
- `npm run lint`
- `npm run test:planning`
- `npm run test:recommendation`
- `npm run build`
- 启动 production build 后运行 `npm run test:smoke`
- 确认 GitHub Actions 的必需检查全部通过。

## 3. Vercel Preview

- 确认部署目标为 Preview，而不是 Production。
- 检查 `/`、`/planner`、`/dashboard`、`/result` 和 `/applications/recommendations`。
- 分别检查桌面端和手机端关键流程。
- 检查浏览器 Console 无明显错误。
- 检查 Network 无意外 4xx/5xx；预期的权限响应需记录原因。
- 确认 `/admin` 未向未授权访问者暴露真实学生信息。
- 确认 Preview 没有使用 Production 专属密钥或真实用户数据。
- 将 Preview URL 和检查结果填写到 PR。

## 4. Production 前置审批

- PR 已完成 Review，必需状态检查通过且分支为最新状态。
- 明确批准数据库 Migration 和 Production 环境变量变化。
- 明确发布负责人、观察窗口和回滚负责人。
- 确认监控、日志脱敏和告警可用。
- 确认法律页面、运营主体和第三方处理信息满足本次发布范围。
- 未经明确批准，不执行 `vercel --prod`，不直接修改 Production 环境变量。

## 5. 回滚准备

- 记录本次发布前的 Production Deployment ID 和 Commit SHA。
- 确认代码可回滚到上一 READY Deployment。
- 数据库变更使用经过 Staging 验证的回滚 Migration，不使用破坏性临时命令。
- 环境变量回滚只在 Vercel 控制台由授权人员执行。
- 回滚后重新运行 Smoke Test，并检查运行时错误和关键 API。

