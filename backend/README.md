pip install flask-migrate
set FLASK_APP=app:create_app
flask run

GRANT USAGE, CREATE ON SCHEMA public TO your_db_user;

flask db init
flask db migrate -m "init user"
flask db upgrade
rm migrations/versions/eafc1cd22a9a_init_tables.py

env.py 中加入所有数据库模型
__init__.py加入数据库模型


git
REM 1️⃣ 进入项目根目录
cd /d C:\work\myapp

REM 2️⃣ 初始化 Git 仓库
git init

REM 3️⃣ 创建 .gitignore 文件
notepad .gitignore
REM --- 在打开的记事本中添加以下内容，然后保存 ---
#__pycache__/
#*.py[cod]
#venv/
#.env
#instance/
#*.log
#app/uploads/*
#app/files/*
#!.gitkeep
#.idea/
#.vscode/

REM 4️⃣ 配置 Git 用户信息（解决 commit 报错）
git config --global user.name "Zhaonan Xu"
git config --global user.email "你的邮箱@example.com"

REM 5️⃣ 添加项目文件到暂存区
git add .

REM 6️⃣ 提交初次 commit
git commit -m "Initial commit"
REM ⚠️ 如果出现 LF → CRLF warning，可以忽略

REM 7️⃣ 在 GitHub 上创建远程仓库（空仓库，不选 README/.gitignore/License）

REM 8️⃣ 生成 SSH key（如果没有）
ssh-keygen -t ed25519 -C "xuzhaonan001@gmail.com"
REM 一路回车即可，默认路径生成 id_ed25519 和 id_ed25519.pub

REM 9️⃣ 将公钥添加到 GitHub
REM 打开 GitHub → Settings → SSH and GPG keys → New SSH key
REM Title 随意，Key 填入 id_ed25519.pub 内容

REM 10️⃣ 测试 SSH 连接
ssh -T git@github.com

REM 11️⃣ 添加远程仓库（SSH 地址）
git remote add origin git@github.com:xuzhaonan001/MyApp.git

REM 12️⃣ 修改本地分支名为 master（如果需要）
git branch -M master

REM 13️⃣ 推送到 GitHub
git push -u origin master

REM 14️⃣ 验证远程仓库是否上传成功
REM 打开 https://github.com/xuzhaonan001/MyApp.git 查看

REM 15️⃣ 日常提交流程
REM 以后修改 app/ 或其他文件时：
git status app
git add app
git commit -m "描述改动"
git push

