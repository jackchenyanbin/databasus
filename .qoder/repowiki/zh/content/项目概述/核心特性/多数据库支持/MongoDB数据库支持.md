# MongoDB数据库支持

<cite>
**本文档引用的文件**
- [mongodb.go](file://backend/internal/util/tools/mongodb.go)
- [model.go](file://backend/internal/features/databases/databases/mongodb/model.go)
- [create_backup_uc.go](file://backend/internal/features/backups/backups/usecases/mongodb/create_backup_uc.go)
- [restore_backup_uc.go](file://backend/internal/features/restores/usecases/mongodb/restore_backup_uc.go)
- [mongodb.go](file://backend/internal/features/tests/mongodb_backup_restore_test.go)
- [MongodbConnectionStringParser.ts](file://frontend/src/entity/databases/model/mongodb/MongodbConnectionStringParser.ts)
- [MongodbDatabase.ts](file://frontend/src/entity/databases/model/mongodb/MongodbDatabase.ts)
- [MongodbVersion.ts](file://frontend/src/entity/databases/model/mongodb/MongodbVersion.ts)
- [20251221195603_add_mongodb_databases_table.sql](file://backend/migrations/20251221195603_add_mongodb_databases_table.sql)
- [20260209125258_add_mongodb_srv_support.sql](file://backend/migrations/20260209125258_add_mongodb_srv_support.sql)
- [20260221111333_add_mongodb_direct_connection.sql](file://backend/migrations/20260221111333_add_mongodb_direct_connection.sql)
- [controller.go](file://backend/internal/features/databases/controller.go)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介

Databasus为MongoDB数据库提供了完整的支持，覆盖了从版本4到版本8的所有主要MongoDB版本。该系统实现了企业级的备份和恢复功能，支持多种连接模式，包括标准连接、SRV记录连接和直接连接模式。

MongoDB支持的核心特性包括：
- **多版本兼容性**：支持MongoDB 4.x至8.x版本
- **连接配置灵活性**：支持标准URI、SRV记录和键值对格式
- **安全连接**：内置TLS/SSL支持和认证机制
- **高级连接选项**：支持副本集连接、分片集群和直接连接
- **企业级备份**：基于mongodump的完整备份和增量备份
- **智能权限管理**：自动检测用户权限和创建只读用户

## 项目结构

Databasus的MongoDB支持采用模块化架构设计，主要分布在以下目录：

```mermaid
graph TB
subgraph "后端核心"
A[mongodb.go<br/>工具函数]
B[model.go<br/>数据模型]
C[create_backup_uc.go<br/>备份用例]
D[restore_backup_uc.go<br/>恢复用例]
E[controller.go<br/>控制器]
end
subgraph "前端界面"
F[MongodbDatabase.ts<br/>数据库接口]
G[MongodbVersion.ts<br/>版本枚举]
H[MongodbConnectionStringParser.ts<br/>连接串解析器]
end
subgraph "数据库迁移"
I[20251221195603_add_mongodb_databases_table.sql<br/>主表]
J[20260209125258_add_mongodb_srv_support.sql<br/>SRV支持]
K[20260221111333_add_mongodb_direct_connection.sql<br/>直接连接]
end
subgraph "测试框架"
L[mongodb_backup_restore_test.go<br/>集成测试]
end
A --> B
B --> C
B --> D
E --> B
F --> H
G --> F
I --> B
J --> B
K --> B
L --> C
L --> D
```

**图表来源**
- [mongodb.go:1-179](file://backend/internal/util/tools/mongodb.go#L1-L179)
- [model.go:1-717](file://backend/internal/features/databases/databases/mongodb/model.go#L1-L717)
- [create_backup_uc.go:1-422](file://backend/internal/features/backups/backups/usecases/mongodb/create_backup_uc.go#L1-L422)

**章节来源**
- [mongodb.go:1-179](file://backend/internal/util/tools/mongodb.go#L1-L179)
- [model.go:1-717](file://backend/internal/features/databases/databases/mongodb/model.go#L1-L717)

## 核心组件

### 数据模型层

MongoDB数据库配置的核心数据模型定义了完整的连接参数和配置选项：

```mermaid
classDiagram
class MongodbDatabase {
+UUID ID
+UUID DatabaseID
+MongodbVersion Version
+string Host
+int Port
+string Username
+string Password
+string Database
+string AuthDatabase
+bool IsHttps
+bool IsSrv
+bool IsDirectConnection
+int CpuCount
+Validate() error
+TestConnection() error
+BuildMongodumpURI() string
+BuildMongodumpURI() string
+EncryptSensitiveFields() error
+CreateReadOnlyUser() (string, string, error)
+IsUserReadOnly() (bool, []string, error)
}
class MongodbVersion {
<<enumeration>>
MongodbVersion4
MongodbVersion5
MongodbVersion6
MongodbVersion7
MongodbVersion8
}
class MongodbConnectionStringParser {
+parse(string) ParseResult|ParseError
+parseUri(string) ParseResult|ParseError
+parseKeyValue(string) ParseResult|ParseError
+checkTlsMode(string) bool
+checkDirectConnection(string) bool
}
MongodbDatabase --> MongodbVersion
MongodbConnectionStringParser --> MongodbDatabase
```

**图表来源**
- [model.go:22-38](file://backend/internal/features/databases/databases/mongodb/model.go#L22-L38)
- [mongodb.go:14-22](file://backend/internal/util/tools/mongodb.go#L14-L22)
- [MongodbConnectionStringParser.ts:18-211](file://frontend/src/entity/databases/model/mongodb/MongodbConnectionStringParser.ts#L18-L211)

### 连接字符串解析器

连接字符串解析器支持三种格式的MongoDB连接串：

1. **标准URI格式**：`mongodb://user:pass@host:port/db?authSource=admin`
2. **MongoDB Atlas SRV格式**：`mongodb+srv://user:pass@cluster.mongodb.net/db`
3. **键值对格式**：`host=localhost port=27017 database=mydb user=admin password=secret`

**章节来源**
- [MongodbConnectionStringParser.ts:28-48](file://frontend/src/entity/databases/model/mongodb/MongodbConnectionStringParser.ts#L28-L48)
- [MongodbConnectionStringParser.ts:58-100](file://frontend/src/entity/databases/model/mongodb/MongodbConnectionStringParser.ts#L58-L100)

## 架构概览

Databasus的MongoDB支持采用分层架构，确保了功能的模块化和可维护性：

```mermaid
sequenceDiagram
participant Client as 客户端应用
participant API as API控制器
participant Service as 数据库服务
participant Model as 数据模型
participant Tools as 工具函数
participant MongoDump as mongodump进程
Client->>API : 创建备份请求
API->>Service : 验证数据库配置
Service->>Model : 构建连接URI
Model->>Tools : 获取mongodump路径
Tools-->>Model : 返回可执行文件路径
Model->>MongoDump : 启动备份进程
MongoDump-->>Service : 流式输出备份数据
Service->>API : 返回备份元数据
API-->>Client : 备份完成响应
```

**图表来源**
- [create_backup_uc.go:47-90](file://backend/internal/features/backups/backups/usecases/mongodb/create_backup_uc.go#L47-L90)
- [model.go:454-496](file://backend/internal/features/databases/databases/mongodb/model.go#L454-L496)

## 详细组件分析

### 版本支持与兼容性

Databasus支持MongoDB 4.0至8.2版本，通过版本检测机制确保向后兼容：

```mermaid
flowchart TD
A[连接建立] --> B{检测MongoDB版本}
B --> |4.x版本| C[返回MongodbVersion4]
B --> |5.x版本| D[返回MongodbVersion5]
B --> |6.x版本| E[返回MongodbVersion6]
B --> |7.x版本| F[返回MongodbVersion7]
B --> |8.x版本| G[返回MongodbVersion8]
C --> H[验证备份权限]
D --> H
E --> H
F --> H
G --> H
H --> I[执行备份操作]
```

**图表来源**
- [model.go:544-583](file://backend/internal/features/databases/databases/mongodb/model.go#L544-L583)
- [mongodb.go:143-167](file://backend/internal/util/tools/mongodb.go#L143-L167)

### 连接配置与认证

系统支持多种连接配置模式，每种模式都有特定的使用场景：

#### 标准连接模式
适用于传统的MongoDB实例连接，需要指定主机名和端口号。

#### SRV记录连接模式
专为MongoDB Atlas等托管服务设计，使用DNS SRV记录自动发现集群信息。

#### 直接连接模式
绕过主节点发现过程，直接连接到指定的服务器实例。

**章节来源**
- [model.go:498-542](file://backend/internal/features/databases/databases/mongodb/model.go#L498-L542)
- [20260209125258_add_mongodb_srv_support.sql:1-17](file://backend/migrations/20260209125258_add_mongodb_srv_support.sql#L1-L17)

### 备份与恢复流程

备份和恢复功能基于MongoDB官方工具实现，确保数据一致性和完整性：

```mermaid
sequenceDiagram
participant Backup as 备份流程
participant Mongodump as mongodump
participant Storage as 存储服务
participant Encryption as 加密服务
Backup->>Mongodump : 启动备份进程
Mongodump->>Mongodump : 执行数据库备份
Mongodump-->>Backup : 返回压缩的备份数据
Backup->>Encryption : 可选加密处理
Encryption-->>Backup : 返回加密数据
Backup->>Storage : 上传备份文件
Storage-->>Backup : 确认存储成功
Backup-->>Backup : 更新备份元数据
```

**图表来源**
- [create_backup_uc.go:115-239](file://backend/internal/features/backups/backups/usecases/mongodb/create_backup_uc.go#L115-L239)

### 权限管理与安全

系统实现了智能的权限检测和管理机制：

```mermaid
flowchart TD
A[用户连接] --> B{检查用户角色}
B --> |backup角色| C[允许备份]
B --> |read角色| D{检查目标数据库权限}
D --> |有权限| C
D --> |无权限| E[拒绝访问]
B --> |write角色| F[拒绝备份权限]
B --> |自定义角色| G[检查继承权限]
G --> |有写权限| F
G --> |只有读权限| C
```

**图表来源**
- [model.go:585-705](file://backend/internal/features/databases/databases/mongodb/model.go#L585-L705)

**章节来源**
- [model.go:201-386](file://backend/internal/features/databases/databases/mongodb/model.go#L201-L386)

### 数据库迁移支持

MongoDB支持通过数据库迁移脚本进行配置管理：

| 迁移文件 | 功能描述 | 字段变化 |
|---------|----------|----------|
| 20251221195603_add_mongodb_databases_table.sql | 创建MongoDB数据库配置表 | 新增基础字段 |
| 20260209125258_add_mongodb_srv_support.sql | 添加SRV连接支持 | 新增is_srv字段，调整端口约束 |
| 20260221111333_add_mongodb_direct_connection.sql | 添加直接连接支持 | 新增is_direct_connection字段 |

**章节来源**
- [20251221195603_add_mongodb_databases_table.sql:1-29](file://backend/migrations/20251221195603_add_mongodb_databases_table.sql#L1-L29)
- [20260209125258_add_mongodb_srv_support.sql:1-17](file://backend/migrations/20260209125258_add_mongodb_srv_support.sql#L1-L17)
- [20260221111333_add_mongodb_direct_connection.sql:1-9](file://backend/migrations/20260221111333_add_mongodb_direct_connection.sql#L1-L9)

## 依赖关系分析

MongoDB支持模块之间的依赖关系体现了清晰的分层架构：

```mermaid
graph TB
subgraph "外部依赖"
A[mongodb-driver]
B[mongodump/mongorestore]
C[TLS/SSL库]
end
subgraph "内部模块"
D[工具函数层]
E[数据模型层]
F[备份用例层]
G[恢复用例层]
H[连接解析层]
end
subgraph "基础设施"
I[加密服务]
J[存储服务]
K[日志服务]
end
A --> E
B --> F
B --> G
C --> E
D --> E
E --> F
E --> G
F --> J
G --> J
F --> I
G --> I
H --> E
```

**图表来源**
- [mongodb.go:3-12](file://backend/internal/util/tools/mongodb.go#L3-L12)
- [model.go:3-20](file://backend/internal/features/databases/databases/mongodb/model.go#L3-L20)

**章节来源**
- [mongodb.go:1-179](file://backend/internal/util/tools/mongodb.go#L1-L179)
- [model.go:1-717](file://backend/internal/features/databases/databases/mongodb/model.go#L1-L717)

## 性能考虑

### 并行处理优化

系统通过CPU计数参数优化备份和恢复性能：

- **并行集合数量**：根据CPU核心数动态调整，范围1-16个并行集合
- **插入工作线程**：每个集合使用1-16个插入工作线程
- **缓冲区大小**：8MB的复制缓冲区优化I/O性能

### 内存管理

```mermaid
flowchart TD
A[启动备份进程] --> B[设置环境变量]
B --> C[创建管道连接]
C --> D[初始化计数写入器]
D --> E[启动数据流传输]
E --> F{监控内存使用}
F --> |正常| G[继续传输]
F --> |过高| H[调整缓冲区大小]
H --> G
G --> I[完成备份]
I --> J[清理资源]
```

**图表来源**
- [create_backup_uc.go:296-366](file://backend/internal/features/backups/backups/usecases/mongodb/create_backup_uc.go#L296-L366)

## 故障排除指南

### 常见连接问题

| 问题类型 | 错误信息 | 解决方案 |
|---------|----------|----------|
| 认证失败 | "authentication failed" | 检查用户名密码，确认认证数据库配置 |
| 连接超时 | "connection refused" | 验证网络连通性，检查防火墙设置 |
| 权限不足 | "insufficient permissions" | 为用户分配适当的MongoDB角色 |
| 版本不兼容 | "unsupported MongoDB major version" | 升级MongoDB版本或使用兼容客户端 |

### 备份恢复故障

```mermaid
flowchart TD
A[备份失败] --> B{检查错误类型}
B --> |认证错误| C[重新配置凭据]
B --> |权限错误| D[提升用户权限]
B --> |网络错误| E[检查网络连接]
B --> |磁盘空间不足| F[清理存储空间]
B --> |超时错误| G[增加超时设置]
C --> H[重试备份]
D --> H
E --> H
F --> H
G --> H
H --> I[监控进度]
I --> J{备份成功?}
J --> |是| K[完成]
J --> |否| A
```

**图表来源**
- [restore_backup_uc.go:284-323](file://backend/internal/features/restores/usecases/mongodb/restore_backup_uc.go#L284-L323)

**章节来源**
- [restore_backup_uc.go:284-323](file://backend/internal/features/restores/usecases/mongodb/restore_backup_uc.go#L284-L323)

## 结论

Databasus的MongoDB支持提供了企业级的数据库管理解决方案，具有以下优势：

1. **全面的版本支持**：从MongoDB 4.0到8.2的完整支持
2. **灵活的连接配置**：支持多种连接模式满足不同部署需求
3. **强大的备份能力**：基于官方工具的可靠备份和恢复机制
4. **智能权限管理**：自动检测和管理用户权限
5. **企业级安全性**：TLS/SSL支持和加密存储
6. **高性能优化**：并行处理和内存优化确保最佳性能

该系统为MongoDB用户提供了一个功能完整、易于使用的管理平台，适用于从小型部署到大型企业环境的各种场景。

## 附录

### 配置示例

#### 标准连接字符串
```
mongodb://username:password@localhost:27017/mydb?authSource=admin&ssl=true
```

#### SRV连接字符串
```
mongodb+srv://username:password@cluster.mongodb.net/mydb?authSource=admin
```

#### 键值对连接字符串
```
host=localhost database=mydb user=username password=password authSource=admin ssl=true
```

### 支持的MongoDB版本

- **MongoDB 4.x系列**：4.0, 4.2, 4.4
- **MongoDB 5.x系列**：5.0
- **MongoDB 6.x系列**：6.0
- **MongoDB 7.x系列**：7.0
- **MongoDB 8.x系列**：8.0, 8.2

### 最佳实践

1. **连接安全**：始终使用TLS/SSL连接生产环境
2. **权限最小化**：为备份用户分配最小必要权限
3. **监控告警**：设置备份状态监控和异常告警
4. **定期测试**：定期进行备份恢复测试验证数据完整性
5. **版本升级**：及时更新MongoDB版本以获得最新功能和安全补丁