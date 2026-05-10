# MariaDB数据库支持

<cite>
**本文档引用的文件**
- [mariadb.go](file://backend/internal/util/tools/mariadb.go)
- [README.md](file://assets/tools/README.md)
- [20251221100000_add_mariadb_databases_table.sql](file://backend/migrations/20251221100000_add_mariadb_databases_table.sql)
- [20260104190532_add_is_exclude_events_to_mariadb.sql](file://backend/migrations/20260104190532_add_is_exclude_events_to_mariadb.sql)
- [20260105165527_add_privileges_to_mysql_mariadb.sql](file://backend/migrations/20260105165527_add_privileges_to_mysql_mariadb.sql)
- [20260213131117_add_mariadb_event_exclusion.sql](file://backend/migrations/20260213131117_add_mariadb_event_exclusion.sql)
- [create_backup_uc.go](file://backend/internal/features/backups/backups/usecases/mariadb/create_backup_uc.go)
- [restore_backup_uc.go](file://backend/internal/features/restores/usecases/mariadb/restore_backup_uc.go)
- [restorer.go](file://backend/internal/features/restores/restoring/restorer.go)
- [MariadbConnectionStringParser.ts](file://frontend/src/entity/databases/model/mariadb/MariadbConnectionStringParser.ts)
- [MariadbDatabase.ts](file://frontend/src/entity/databases/model/mariadb/MariadbDatabase.ts)
- [EditMariaDbSpecificDataComponent.tsx](file://frontend/src/features/databases/ui/edit/EditMariaDbSpecificDataComponent.tsx)
- [mariadb_backup_restore_test.go](file://backend/internal/feature/tests/mariadb_backup_restore_test.go)
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

Databasus为MariaDB数据库提供了全面的支持，覆盖了从版本10.1到12.0的完整支持范围。该系统不仅支持标准的MariaDB安装，还特别针对Galera集群环境进行了优化，包括写集合大小限制的处理和集群状态监控。

MariaDB支持的核心特性包括：
- 多版本兼容性（10.1-12.0）
- Galera集群原生支持
- 完整的备份和恢复功能
- SSL/TLS连接支持
- 事件排除功能
- 企业级备份工具集成

## 项目结构

Databasus的MariaDB支持功能分布在以下关键目录中：

```mermaid
graph TB
subgraph "后端核心"
A[mariadb.go<br/>版本管理]
B[create_backup_uc.go<br/>备份用例]
C[restore_backup_uc.go<br/>恢复用例]
D[restorer.go<br/>恢复节点]
end
subgraph "数据库迁移"
E[20251221100000_add_mariadb_databases_table.sql]
F[20260104190532_add_is_exclude_events_to_mariadb.sql]
G[20260105165527_add_privileges_to_mysql_mariadb.sql]
H[20260213131117_add_mariadb_event_exclusion.sql]
end
subgraph "前端支持"
I[MariadbConnectionStringParser.ts]
J[MariadbDatabase.ts]
K[EditMariaDbSpecificDataComponent.tsx]
end
subgraph "测试"
L[mariadb_backup_restore_test.go]
end
A --> B
A --> C
B --> E
C --> E
I --> J
J --> K
```

**图表来源**
- [mariadb.go:1-251](file://backend/internal/util/tools/mariadb.go#L1-L251)
- [create_backup_uc.go:1-605](file://backend/internal/features/backups/backups/usecases/mariadb/create_backup_uc.go#L1-L605)
- [restore_backup_uc.go:1-402](file://backend/internal/features/restores/usecases/mariadb/restore_backup_uc.go#L1-L402)

**章节来源**
- [mariadb.go:1-251](file://backend/internal/util/tools/mariadb.go#L1-L251)
- [README.md:1-17](file://assets/tools/README.md#L1-L17)

## 核心组件

### 版本管理系统

Databasus实现了智能的MariaDB版本管理机制，根据服务器版本自动选择合适的客户端工具：

```mermaid
flowchart TD
A[服务器版本检测] --> B{版本类型判断}
B --> |5.5/10.1| C[使用10.6客户端]
B --> |10.2+| D[使用12.1客户端]
C --> E[生成可执行路径]
D --> E
E --> F[验证客户端可用性]
```

**图表来源**
- [mariadb.go:48-80](file://backend/internal/util/tools/mariadb.go#L48-L80)

### 连接字符串解析器

前端提供了强大的连接字符串解析功能，支持多种格式：

- **URI格式**: `mariadb://user:pass@host:port/db`
- **JDBC格式**: `jdbc:mariadb://host:port/db?user=x&password=y`
- **键值对格式**: `host=x port=3306 database=db user=u password=p`
- **Azure格式**: 支持用户名包含@的特殊格式

**章节来源**
- [MariadbConnectionStringParser.ts:1-279](file://frontend/src/entity/databases/model/mariadb/MariadbConnectionStringParser.ts#L1-L279)
- [MariadbDatabase.ts:1-13](file://frontend/src/entity/databases/model/mariadb/MariadbDatabase.ts#L1-L13)

## 架构概览

Databasus采用分布式架构处理MariaDB备份和恢复任务：

```mermaid
graph TB
subgraph "用户界面层"
UI[前端应用]
end
subgraph "业务逻辑层"
BU[备份用例]
RU[恢复用例]
RC[恢复节点]
end
subgraph "数据访问层"
DB[(MariaDB实例)]
ST[(存储服务)]
end
subgraph "工具层"
MD[mariadb-dump]
M[mariadb]
CNF[临时配置文件]
end
UI --> BU
UI --> RU
BU --> MD
RU --> M
BU --> CNF
RU --> CNF
MD --> DB
M --> DB
BU --> ST
RU --> ST
```

**图表来源**
- [create_backup_uc.go:144-278](file://backend/internal/features/backups/backups/usecases/mariadb/create_backup_uc.go#L144-L278)
- [restore_backup_uc.go:113-192](file://backend/internal/features/restores/usecases/mariadb/restore_backup_uc.go#L113-L192)

## 详细组件分析

### 备份组件分析

备份组件实现了完整的流式备份流程，支持加密和进度监控：

```mermaid
sequenceDiagram
participant U as 用户
participant BU as 备份用例
participant MD as mariadb-dump
participant CNF as 配置文件
participant ST as 存储服务
U->>BU : 触发备份
BU->>CNF : 创建临时配置
BU->>MD : 执行备份命令
MD->>CNF : 读取凭据
MD-->>BU : 流式输出
BU->>ST : 保存到存储
BU-->>U : 返回备份元数据
```

**图表来源**
- [create_backup_uc.go:144-278](file://backend/internal/features/backups/backups/usecases/mariadb/create_backup_uc.go#L144-L278)

#### 关键特性

1. **智能客户端选择**: 根据MariaDB版本自动选择合适的客户端工具
2. **流式传输**: 使用管道实现实时数据传输，减少内存占用
3. **进度监控**: 提供精确的备份进度报告
4. **错误处理**: 针对不同错误类型提供详细的诊断信息

**章节来源**
- [create_backup_uc.go:101-142](file://backend/internal/features/backups/backups/usecases/mariadb/create_backup_uc.go#L101-L142)
- [create_backup_uc.go:280-318](file://backend/internal/features/backups/backups/usecases/mariadb/create_backup_uc.go#L280-L318)

### 恢复组件分析

恢复组件专门针对Galera集群进行了优化，处理写集合大小限制问题：

```mermaid
flowchart TD
A[开始恢复] --> B{检查MariaDB版本}
B --> |10.1以下| C[禁用wsrep_on]
B --> |10.2及以上| D[禁用wsrep_on]
C --> E[创建配置文件]
D --> E
E --> F[建立SSL连接]
F --> G[执行恢复]
G --> H[启用wsrep_on]
H --> I[完成恢复]
```

**图表来源**
- [restore_backup_uc.go:73-80](file://backend/internal/features/restores/usecases/mariadb/restore_backup_uc.go#L73-L80)

#### Galera集群支持

恢复过程中自动处理Galera集群的写集合大小限制：

- **wsrep_on变量**: 在恢复会话中禁用Galera复制
- **版本兼容性**: 适用于所有支持Galera的MariaDB版本
- **自动恢复**: 恢复完成后自动重新启用复制

**章节来源**
- [restore_backup_uc.go:73-79](file://backend/internal/features/restores/usecases/mariadb/restore_backup_uc.go#L73-L79)

### 数据库模型设计

MariaDB数据库配置采用了灵活的数据模型设计：

```mermaid
erDiagram
MARIADB_DATABASES {
uuid id PK
uuid database_id FK
text version
text host
int port
text username
text password
text database
boolean is_https
text privileges
boolean is_exclude_events
}
DATABASES {
uuid id PK
text name
text type
}
MARIADB_DATABASES ||--|| DATABASES : references
```

**图表来源**
- [20251221100000_add_mariadb_databases_table.sql:3-13](file://backend/migrations/20251221100000_add_mariadb_databases_table.sql#L3-L13)

**章节来源**
- [20251221100000_add_mariadb_databases_table.sql:1-29](file://backend/migrations/20251221100000_add_mariadb_databases_table.sql#L1-L29)

## 依赖关系分析

### 版本兼容性矩阵

Databasus支持的MariaDB版本及其特性支持：

| 版本 | 客户端工具 | Galera支持 | 事件支持 | 触发器支持 |
|------|------------|------------|----------|------------|
| 5.5 | 10.6 | 基础 | 有限 | 基础 |
| 10.1 | 10.6 | 基础 | 有限 | 基础 |
| 10.2 | 12.1 | 完整 | 完整 | 完整 |
| 10.3 | 12.1 | 完整 | 完整 | 完整 |
| 10.4 | 12.1 | 完整 | 完整 | 完整 |
| 10.5 | 12.1 | 完整 | 完整 | 完整 |
| 10.6 | 12.1 | 完整 | 完整 | 完整 |
| 10.11 | 12.1 | 完整 | 完整 | 完整 |
| 11.4 | 12.1 | 完整 | 完整 | 完整 |
| 11.8 | 12.1 | 完整 | 完整 | 完整 |
| 12.0 | 12.1 | 完整 | 完整 | 完整 |

### 外部依赖

系统依赖以下外部工具和库：

```mermaid
graph LR
subgraph "MariaDB客户端"
A[mariadb-dump 10.6]
B[mariadb 10.6]
C[mariadb-dump 12.1]
D[mariadb 12.1]
end
subgraph "系统要求"
E[Linux/Windows/macOS]
F[至少1GB内存]
G[网络连接]
end
A --> E
B --> E
C --> E
D --> E
```

**图表来源**
- [README.md:4-6](file://assets/tools/README.md#L4-L6)

**章节来源**
- [mariadb.go:82-179](file://backend/internal/util/tools/mariadb.go#L82-L179)

## 性能考虑

### 备份性能优化

1. **压缩级别**: 使用zstd压缩，压缩级别为5
2. **缓冲区大小**: 8MB的读写缓冲区
3. **超时设置**: 23小时的备份超时时间
4. **内存管理**: 流式处理减少内存占用

### 恢复性能优化

1. **写集合禁用**: 恢复期间禁用Galera写集合限制
2. **大包支持**: 1GB的最大允许包大小
3. **并发处理**: 支持多节点并行恢复

## 故障排除指南

### 常见错误及解决方案

#### 连接问题
- **Access Denied**: 检查用户名和密码是否正确
- **Connection Refused**: 确认MariaDB服务正在运行且端口可达
- **Unknown Database**: 验证目标数据库是否存在

#### SSL问题
- **SSL Connection Failed**: 检查SSL证书和配置
- **SSL Verification Error**: 调整SSL验证模式

#### Galera集群问题
- **Writeset Size Exceeded**: 系统已自动处理，无需手动干预
- **Cluster State Error**: 检查集群节点状态

**章节来源**
- [create_backup_uc.go:535-600](file://backend/internal/features/backups/backups/usecases/mariadb/create_backup_uc.go#L535-L600)
- [restore_backup_uc.go:378-398](file://backend/internal/features/restores/usecases/mariadb/restore_backup_uc.go#L378-L398)

### 测试验证

系统提供了全面的测试套件，覆盖所有支持的MariaDB版本：

- **版本兼容性测试**: 验证11个主要版本的功能
- **备份恢复测试**: 端到端备份恢复验证
- **只读用户测试**: 验证权限控制功能
- **事件排除测试**: 验证事件过滤功能

**章节来源**
- [mariadb_backup_restore_test.go:109-189](file://backend/internal/features/tests/mariadb_backup_restore_test.go#L109-L189)

## 结论

Databasus为MariaDB提供了企业级的支持，具有以下优势：

1. **全面的版本支持**: 覆盖从10.1到12.0的所有主要版本
2. **Galera集群优化**: 原生支持Galera集群的特殊需求
3. **安全可靠**: 完整的SSL支持和权限控制
4. **易于使用**: 直观的连接字符串解析和配置界面
5. **高性能**: 流式处理和智能缓存机制

该系统适合各种规模的企业环境，从小型开发团队到大型生产环境都能提供稳定可靠的服务。

## 附录

### 配置文件示例

#### MariaDB配置文件 (.my.cnf)
```ini
[client]
user=username
password="encrypted_password"
host=localhost
port=3306
ssl=true
```

#### 连接字符串示例

**标准URI格式**
```
mariadb://user:password@localhost:3306/database?ssl=true
```

**JDBC格式**
```
jdbc:mariadb://localhost:3306/database?user=username&password=password&ssl=true
```

**键值对格式**
```
host=localhost port=3306 database=database user=username password=password ssl=true
```

### 集群部署指南

1. **安装MariaDB Galera集群**
2. **配置wsrep参数**
3. **设置SSL证书**
4. **验证集群状态**
5. **配置Databasus连接**

### 代理模式vs直接连接模式

**代理模式**
- 适用于需要中间层控制的场景
- 支持负载均衡和故障转移
- 增加了一层网络延迟

**直接连接模式**
- 适用于简单的单点连接
- 最小化网络开销
- 需要直接访问MariaDB实例

### 与MariaDB Enterprise Backup集成

系统支持与MariaDB Enterprise Backup工具的集成，提供企业级备份解决方案。通过配置相应的备份策略，可以实现更高级的备份功能和监控能力。