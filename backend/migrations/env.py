from app import create_app  # 只导入函数，不立即执行
from app.models.picture import Picture
from app.models.shop import Shop
# from app.models.shop_picture import ShopPicture
from app import db
import logging
from logging.config import fileConfig
from flask import current_app
from alembic import context

# target_metadata 必须在函数内获取，或者在这里延迟绑定
# 先注释掉顶部的 app = create_app()

# this is the Alembic Config object...
config = context.config
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

# === 修改开始：删除顶部的 app = create_app() 和 get_engine 相关函数 ===

def run_migrations_offline():
    """
    离线模式保持不变，但通常我们需要在线模式。
    """
    # 如果你必须用离线模式，请确保 sqlalchemy.url 在 alembic.ini 中硬编码或正确传递
    # 但为了修复你的问题，我们重点修改在线模式
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, 
        target_metadata=db.metadata, 
        literal_binds=True 
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """
    在线模式：正确处理应用上下文和迁移扩展
    """
    # 关键修改：直接获取 Engine，而不是 SQLAlchemy 实例
    connectable = current_app.extensions['migrate'].db.engine

    # 现在 connectable 是 Engine，拥有 .connect() 方法
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=current_app.extensions['migrate'].db.metadata,
            # 继承 migrate 的其他参数
            **current_app.extensions['migrate'].configure_args
        )

        # 保持回调函数不变
        def process_revision_directives(context, revision, directives):
            if getattr(config.cmd_opts, 'autogenerate', False):
                script = directives[0]
                if script.upgrade_ops.is_empty():
                    directives[:] = []
                    logger.info('No changes in schema detected.')

        context.configure.process_revision_directives = process_revision_directives

        with context.begin_transaction():
            context.run_migrations()

        # 4. 回调函数（防止空迁移）
        def process_revision_directives(context, revision, directives):
            if getattr(config.cmd_opts, 'autogenerate', False):
                script = directives[0]
                if script.upgrade_ops.is_empty():
                    directives[:] = []
                    logger.info('No changes in schema detected.')

        # 5. 应用回调
        context.configure.process_revision_directives = process_revision_directives

        with context.begin_transaction():
            context.run_migrations()

# === 修改结束 ===

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()