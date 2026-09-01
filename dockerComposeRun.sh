#!/bin/bash

# 停止並移除已存在的容器
docker compose down

# 建立容器
docker compose up -d