# AxiomAPI 本地开发

这个仓库已经包含完整的 AxiomAPI 项目。团队成员只需要 clone 这一个仓库，然后在仓库根目录运行两个命令即可启动本地开发环境。

## 环境要求

- Docker Desktop
- Bun（推荐）。如果机器上只有 Node/npm，脚本会自动通过 `npm exec bun` 兜底运行。

## 第一次启动

```bash
git clone <repo-url>
cd api
./scripts/dev-up.sh
./scripts/dev-web.sh
```

打开浏览器访问：

```text
http://127.0.0.1:4177
```

`dev-up.sh` 会通过 Docker Compose 启动后端、MySQL 和 Redis。

`dev-web.sh` 会在需要时安装前端依赖，并启动 AxiomAPI 前端开发服务。

## 日常命令

启动后端服务：

```bash
./scripts/dev-up.sh
```

后端 Go 代码有变化、需要重新构建镜像时：

```bash
REBUILD=1 ./scripts/dev-up.sh
```

启动前端开发服务：

```bash
./scripts/dev-web.sh
```

停止本地服务：

```bash
./scripts/dev-down.sh
```

重置本地数据库和应用数据：

```bash
./scripts/dev-reset.sh
```

运行前端检查：

```bash
./scripts/dev-check.sh
```

## 端口

- 前端：`http://127.0.0.1:4177`
- 后端 API：`http://127.0.0.1:3000`
- MySQL 和 Redis 运行在 Docker 内部，日常开发不需要手动连接。

## 目录说明

- `new-api-src/`：AxiomAPI 后端和前端源码。
- `new-api-src/web/default/`：当前前端 UI。
- `deploy/`：部署相关的 Docker Compose 和服务器文件。
- `scripts/`：本地开发、停止、重置和检查脚本。

不要再单独 clone `new-api-src`。它现在已经作为这个仓库的一部分统一管理。
