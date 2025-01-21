#!/bin/bash

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# 停止並移除已存在的容器
docker compose down
docker compose rm

# 建立容器
docker compose up -d