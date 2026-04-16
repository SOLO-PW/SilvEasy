# 银龄通小程序

## 项目介绍

银龄通是一款专为老年人及其子女设计的微信小程序，旨在通过数字化手段提升老年人的生活质量和便利性。该项目基于微信云开发平台，充分利用了云开发的三大基础能力：

- **数据库**：存储用户信息、老年人信息、社区服务等数据
- **文件存储**：存储用户头像、服务图片等文件
- **云函数**：处理后端逻辑，如数据验证、业务处理等

## 功能特性

### 核心功能

1. **角色切换**：支持子女和老年人两种角色登录
2. **老年人管理**：子女可以绑定、管理老年人信息
3. **社区服务**：提供社区服务发布、编辑和查看功能
4. **联系人管理**：管理紧急联系人信息
5. **天气查询**：查看当前天气信息
6. **公交查询**：查询公交线路信息

### 技术特性

- 基于微信小程序框架开发
- 使用微信云开发作为后端服务
- 响应式设计，适配不同屏幕尺寸
- 模块化架构，代码结构清晰

## 项目结构

```
├── cloudfunctions/          # 云函数目录
│   ├── quickstartFunctions/  # 快速启动示例云函数
│   └── silveasyFunctions/    # 银龄通业务云函数
├── miniprogram/             # 小程序前端目录
│   ├── components/           # 组件目录
│   │   └── cloudTipModal/    # 云提示弹窗组件
│   ├── images/               # 图片资源目录
│   │   └── icons/            # 图标资源
│   ├── pages/                # 页面目录
│   │   ├── bind-elder/       # 绑定老年人页面
│   │   ├── bus/              # 公交查询页面
│   │   ├── child-home/       # 子女首页
│   │   ├── community/        # 社区服务页面
│   │   ├── community-service-edit/  # 社区服务编辑页面
│   │   ├── contact-edit/     # 联系人编辑页面
│   │   ├── contacts/         # 联系人列表页面
│   │   ├── elder-home/       # 老年人首页
│   │   ├── elder-manage/     # 老年人管理页面
│   │   ├── elder-settings/   # 老年人设置页面
│   │   ├── example/          # 示例页面
│   │   ├── index/            # 首页
│   │   ├── role-select/      # 角色选择页面
│   │   └── weather/          # 天气查询页面
│   ├── app.js                # 小程序入口文件
│   ├── app.json              # 小程序配置文件
│   ├── app.wxss              # 小程序全局样式文件
│   ├── envList.js            # 云开发环境配置
│   └── sitemap.json          # 站点地图
├── .gitignore                # Git忽略文件
├── LICENSE                   # 许可证文件
├── README.md                 # 项目说明文档
├── project.config.json       # 项目配置文件
└── uploadCloudFunction.sh    # 云函数上传脚本
```

## 数据库设计

本项目使用微信云开发数据库，包含以下数据集合：

### users（用户表）
存储用户信息，包括：
- `_id`: 文档ID
- `openid`: 微信用户唯一标识
- `nickname`: 用户昵称
- `avatarUrl`: 头像URL
- `phone`: 手机号码
- `role`: 用户角色（'elder'为老年人，'child'为子女）
- `createTime`: 创建时间
- `updateTime`: 更新时间

### bindings（绑定关系表）
存储子女与老年人的绑定关系，包括：
- `_id`: 文档ID
- `childId`: 子女用户ID
- `elderId`: 老年人用户ID
- `relation`: 关系说明
- `status`: 绑定状态（'confirmed'为已确认）
- `createTime`: 创建时间
- `updateTime`: 更新时间

### binding_codes（绑定码表）
存储绑定码信息，用于子女绑定老年人，包括：
- `_id`: 文档ID
- `code`: 绑定码（6位数字）
- `elderUserId`: 老年人用户ID
- `expireTime`: 过期时间（24小时）
- `used`: 是否已使用
- `createTime`: 创建时间
- `updateTime`: 更新时间

### contacts（联系人表）
存储紧急联系人信息，包括：
- `_id`: 文档ID
- `userId`: 所属用户ID
- `name`: 联系人姓名
- `phone`: 联系电话
- `tag`: 标签
- `relation`: 关系说明
- `isEmergency`: 是否为紧急联系人
- `createTime`: 创建时间
- `updateTime`: 更新时间

## 云函数功能

silveasyFunctions 云函数提供以下功能接口：

### 用户相关
- `getOpenId`: 获取用户的 openid
- `getOrCreateUser`: 获取或创建用户信息

### 绑定相关
- `generateBindCode`: 生成绑定码（老年人端）
- `bindElder`: 绑定老年人（子女端）
- `unbindElder`: 解绑老年人
- `verifyBinding`: 验证绑定关系

### 天气相关
- `getWeather`: 获取天气信息（支持和风天气API或模拟数据）

### 联系人相关
- `getElderContacts`: 获取老年人的联系人列表
- `addElderContact`: 添加联系人
- `updateElderContact`: 更新联系人信息
- `deleteElderContact`: 删除联系人

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 微信小程序账号（注册：[微信公众平台](https://mp.weixin.qq.com/)）
- 云开发环境

### 配置说明

#### 1. 云开发环境配置

项目支持两种配置方式：

**方式一：通过 app.js 配置（推荐）**

打开 [miniprogram/app.js](file:///workspace/miniprogram/app.js)，将第 8 行的 `env` 变量设置为你的云开发环境 ID：

```javascript
this.globalData = {
  env: "your-env-id", // 替换为你的云开发环境 ID
  cloudInitialized: false
};
```

**方式二：通过 envList.js 配置**

打开 [miniprogram/envList.js](file:///workspace/miniprogram/envList.js)，在 `envList` 数组中添加环境配置。

#### 2. 云数据库初始化

在云开发控制台中，创建以下数据库集合：
- `users`
- `bindings`
- `binding_codes`
- `contacts`

并为这些集合设置适当的权限规则。

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   ```

2. **打开项目**
   - 使用微信开发者工具打开项目目录
   - 选择「导入项目」，填写小程序 AppID（或使用测试号）

3. **配置云开发环境**
   - 在微信开发者工具中，点击「云开发」按钮
   - 按照提示创建云开发环境（如果还没有）
   - 记录环境 ID，按照「配置说明」部分配置项目

4. **初始化数据库**
   - 在云开发控制台 -> 数据库 -> 新建集合
   - 创建上述所需的四个集合
   - 设置集合权限为「仅创建者可读写」或根据需要调整

5. **部署云函数**
   - 在微信开发者工具中，右键点击 `cloudfunctions/silveasyFunctions` 目录
   - 选择「上传并部署：云端安装依赖」
   - 等待部署完成
   - 或运行脚本（如果有）：
     ```bash
     bash uploadCloudFunction.sh
     ```

6. **运行项目**
   - 在微信开发者工具中点击「编译」按钮
   - 或点击「预览」按钮生成二维码，使用微信扫码查看

## 开发指南

### 云函数开发

云函数位于 `cloudfunctions/` 目录下，每个云函数包含以下文件：
- `index.js`：云函数入口文件
- `package.json`：云函数依赖配置
- `config.json`：云函数配置文件

### 小程序页面开发

小程序页面位于 `miniprogram/pages/` 目录下，每个页面包含以下文件：
- `index.js`：页面逻辑文件
- `index.json`：页面配置文件
- `index.wxml`：页面结构文件
- `index.wxss`：页面样式文件

### 组件开发

组件位于 `miniprogram/components/` 目录下，每个组件包含以下文件：
- `index.js`：组件逻辑文件
- `index.json`：组件配置文件
- `index.wxml`：组件结构文件
- `index.wxss`：组件样式文件

## 功能模块说明

### 1. 角色选择与登录
- 首次进入小程序时，用户需要选择角色（子女/老年人）
- 子女角色可以绑定多个老年人
- 老年人角色直接进入老年人首页
- 用户信息会自动创建并存储到云端数据库

### 2. 绑定流程
**老年人端操作：**
- 进入「设置」页面
- 点击「生成绑定码」
- 系统生成 6 位数字绑定码，有效期 24 小时

**子女端操作：**
- 进入「绑定老年人」页面
- 输入老年人提供的 6 位绑定码
- 填写与老年人的关系
- 点击「绑定」完成绑定

### 3. 老年人管理
- 子女可以查看已绑定的老年人列表
- 可以为绑定的老年人管理紧急联系人
- 支持解绑老年人

### 4. 联系人管理
- 支持为老年人添加、编辑、删除联系人
- 可以设置紧急联系人标识
- 支持一键拨打电话功能
- 联系人数据存储在云端，安全可靠

### 5. 天气查询
- 显示当前城市的实时天气信息
- 包含温度、天气状况、风向风力、湿度、空气质量等
- 提供未来几天的天气预报
- 支持和风天气API接入（需要配置 API Key）
- 内置模拟数据，便于开发测试

### 6. 社区服务
- 查看社区服务列表
- 发布新的社区服务信息
- 编辑已发布的服务信息

### 7. 公交查询
- 查询公交线路信息
- 显示公交站点信息

## 使用示例

### 绑定老年人流程示例

1. **老年人生成绑定码**
   - 老年人打开小程序，选择「老年人」角色
   - 进入「我的」页面
   - 点击「生成绑定码」
   - 复制或记住生成的 6 位数字

2. **子女绑定老年人**
   - 子女打开小程序，选择「子女」角色
   - 进入「绑定老年人」页面
   - 输入老年人提供的绑定码
   - 填写关系（如「父亲」、「母亲」等）
   - 点击「绑定」

3. **验证绑定**
   - 绑定成功后，子女可以在「老年人管理」页面看到已绑定的老年人
   - 可以为老年人添加紧急联系人

## 注意事项

### 开发相关

1. **云开发环境配置**：确保已正确配置云开发环境 ID，在 [miniprogram/app.js](file:///workspace/miniprogram/app.js) 中设置
2. **云函数部署**：修改云函数后需要重新部署，右键点击云函数目录选择「上传并部署：云端安装依赖」
3. **数据库集合**：首次使用前需要在云开发控制台创建所需的数据库集合
4. **权限管理**：注意云数据库的权限设置，建议设置为「仅创建者可读写」或根据业务需求调整
5. **测试账号**：如果使用测试号，部分功能可能无法正常使用，建议使用正式 AppID

### 天气API配置

如需使用真实天气数据，请按以下步骤配置：

1. 注册和风天气开发者账号：[和风天气开发平台](https://dev.qweather.com/)
2. 创建应用并获取 API Key
3. 打开 [cloudfunctions/silveasyFunctions/index.js](file:///workspace/cloudfunctions/silveasyFunctions/index.js)
4. 将第 267 行的 `useMockData` 设置为 `false`
5. 将第 292 行的 `YOUR_API_KEY_HERE` 替换为你的和风天气 API Key
6. 重新部署云函数

### 安全建议

1. 不要将 API Key、环境 ID 等敏感信息提交到代码仓库
2. 建议使用云开发的环境变量功能存储敏感配置
3. 定期 review 云数据库权限设置
4. 云函数中注意验证用户身份，避免越权操作

### 常见问题

**Q: 云函数部署失败怎么办？**
A: 检查网络连接，确保已登录微信开发者工具，且云开发环境已创建。

**Q: 绑定码无效？**
A: 确认绑定码未过期（24小时有效期），且未被使用过。

**Q: 数据库操作失败？**
A: 检查数据库集合是否已创建，权限设置是否正确。

## 参考文档

- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [微信小程序云开发能力](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/)

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 联系方式

如果您有任何问题或建议，欢迎联系我们：
- 邮箱：[your-email@example.com]
- 微信：[your-wechat-id]

---

**银龄通，让老年人的生活更美好！**

