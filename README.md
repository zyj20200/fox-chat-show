# 灵狐聊天记录查看器

展示 MySQL 数据库中的聊天历史记录，支持按会话分组、搜索、分页、Markdown 渲染。

## 功能

- 左右分栏：左侧会话列表，右侧聊天详情
- 多轮对话解析与展示
- Markdown 渲染（支持表格、代码块等 GFM 语法）
- 按问题内容或应用名搜索
- 分页浏览
- 页面上可动态配置数据库连接

## 本地开发

```bash
npm install
```

复制并编辑环境变量：

```bash
cp .env.local.example .env.local
```

`.env.local` 配置项：

```
PORT=2000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
```

启动开发服务器：

```bash
npm run dev
```

访问 http://localhost:2000

## Docker 部署

修改 `docker-compose.yml` 中的数据库连接信息，然后：

```bash
docker compose up -d --build
```

## 数据库表结构

需要 `chat_history` 表，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| session_id | varchar | 会话 ID |
| app_name | varchar | 应用名称 |
| query_text | text | 当前轮提问 |
| user_question | text | 完整多轮对话（`------` 分隔） |
| assistant_answer | text | AI 回答 |
| store | varchar | 店铺 |
| region | varchar | 地区 |
| created_at | datetime | 创建时间 |
| response_time | int | 响应耗时(ms) |
