# 轻衡 · Expo 原生版

轻衡是一个以 iPhone 为主的个人热量、身体数据与趋势记录 App。数据默认保存在 App 本机空间，不依赖服务器。

## 本地启动

```bash
npm install
npm run start:go
```

Expo Go 可用于检查大部分页面；Apple 健康需要包含原生 HealthKit 模块的 EAS Development Build。

## iPhone Development Build

前提：Expo 账号已登录，并拥有有效的 Apple Developer Program 会员资格。

```bash
eas device:create
npm run build:ios
```

构建完成后，在 iPhone 上打开 EAS 提供的安装链接。首次安装开发版时，需要在 iPhone 的“设置 → 隐私与安全性 → 开发者模式”中启用开发者模式。

## 从原 Web 版迁移记录

1. 在旧 Web/PWA 的“设置”中导出 JSON。
2. 在原生版“设置 → 从 JSON 恢复”中选择该文件。
3. 先选择“合并”；确认记录完整后再决定是否清理旧 PWA。

Web 的 IndexedDB 与 iOS App 沙盒彼此隔离，不能自动直接读取；JSON 是安全、可核对的迁移通道。

## Apple 健康

“设置 → 从 Apple 健康同步”会在用户主动点击后申请并读取：

- 最新体重
- 当天活动能量
- 最近一晚睡眠

HealthKit 不支持 Expo Go。EAS 构建会通过配置插件自动写入 HealthKit entitlement 和隐私说明。

## 验证

```bash
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform ios
```
