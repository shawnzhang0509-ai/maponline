import os
import uuid
from flask import current_app
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app import db
from app.models.shop import Shop
from app.models.picture import Picture
from app.models.shop_picture import ShopPicture
from app.services.upload_service import save_uploaded_file


class ShopRepository:
    def __init__(self):
        # 显式持有 db 实例（虽然 Flask-SQLAlchemy 是全局的，但这样更清晰）
        self.db = db

    def get_shops(self, content=None):
        """根据关键词搜索店铺（支持名称或地址）"""
        query = self.db.session.query(Shop)
        query = query.options(joinedload(Shop.pictures))

        if content and content.strip():
            query = query.filter(
                or_(
                    Shop.name.ilike(f"%{content}%"),
                    Shop.address.ilike(f"%{content}%")
                )
            )

        return query.all()

    def get_by_id(self, shop_id):
        """根据 ID 获取店铺"""
        return self.db.session.query(Shop).get(shop_id)

    def add_shop(self, data=None, files=None):
        """添加新店铺及关联图片"""
        data = data or {}
        files = files or []

        # 处理布尔字段
        new_girls = data.get("new_girls_last_15_days", False)
        if isinstance(new_girls, str):
            new_girls = new_girls.lower() == "true"

        # 创建店铺
        shop = Shop(
            name=data.get('name'),
            address=data.get('address'),
            phone=data.get('phone'),
            lat=data.get('lat'),
            lng=data.get('lng'),
            badge_text=data.get('badge_text'),
            new_girls_last_15_days=new_girls
        )

        self.db.session.add(shop)
        self.db.session.flush()  # 获取 shop.id

        # 保存图片
        for f in files:
            file_name, _ = save_uploaded_file(f)
            picture = Picture(url=file_name)
            self.db.session.add(picture)
            self.db.session.flush()

            shop_picture = ShopPicture(shop_id=shop.id, picture_id=picture.id)
            self.db.session.add(shop_picture)

        self.db.session.commit()
        return shop

    def update_shop(self, shop_id, data=None, files=None):
        """更新店铺信息及图片（支持删除和新增）"""
        data = data or {}
        files = files or []

        shop = self.get_by_id(shop_id)
        if not shop:
            raise ValueError("Shop not found")

        # 更新基础字段
        fields = ["name", "address", "phone", "lat", "lng", "badge_text"]
        for field in fields:
            if field in data:
                setattr(shop, field, data[field])

        # 更新布尔字段
        new_girls = data.get("new_girls_last_15_days")
        if new_girls is not None:
            if isinstance(new_girls, str):
                new_girls = new_girls.lower() == "true"
            shop.new_girls_last_15_days = new_girls

        # 删除指定图片
        remove_ids_str = data.get("remove_picture_ids", "")
        if remove_ids_str:
            try:
                remove_ids = [int(i) for i in remove_ids_str.split(",") if i.strip()]
                if remove_ids:
                    # 查询要删除的中间记录
                    shop_pictures = (
                        self.db.session.query(ShopPicture)
                        .filter(
                            ShopPicture.shop_id == shop.id,
                            ShopPicture.picture_id.in_(remove_ids)
                        )
                        .all()
                    )
                    picture_ids = [sp.picture_id for sp in shop_pictures]

                    # 删除文件和数据库记录
                    files_folder = current_app.config['FILES_FOLDER']
                    for pic in self.db.session.query(Picture).filter(Picture.id.in_(picture_ids)):
                        file_path = os.path.join(files_folder, pic.url)
                        if os.path.exists(file_path):
                            os.remove(file_path)
                        self.db.session.delete(pic)

                    for sp in shop_pictures:
                        self.db.session.delete(sp)
            except (ValueError, TypeError):
                pass  # 忽略无效 ID

        # 新增图片
        for f in files:
            file_name, _ = save_uploaded_file(f)
            picture = Picture(url=file_name)
            self.db.session.add(picture)
            self.db.session.flush()

            shop_picture = ShopPicture(shop_id=shop.id, picture_id=picture.id)
            self.db.session.add(shop_picture)

        self.db.session.commit()
        return shop

    def del_shop(self, shop_id: int):
        """删除店铺及其所有关联图片（物理删除文件）"""
        shop = self.get_by_id(shop_id)
        if not shop:
            return False, "Shop not found"

        try:
            # 获取所有关联图片
            shop_pictures = (
                self.db.session.query(ShopPicture)
                .filter(ShopPicture.shop_id == shop_id)
                .all()
            )
            picture_ids = [sp.picture_id for sp in shop_pictures]

            # 删除文件和图片记录
            files_folder = current_app.config['FILES_FOLDER']
            for pic in self.db.session.query(Picture).filter(Picture.id.in_(picture_ids)):
                file_path = os.path.join(files_folder, pic.url)
                if os.path.exists(file_path):
                    os.remove(file_path)
                self.db.session.delete(pic)

            # 删除中间表记录
            for sp in shop_pictures:
                self.db.session.delete(sp)

            # 删除店铺
            self.db.session.delete(shop)
            self.db.session.commit()

            return True, "Shop deleted successfully"

        except Exception as e:
            self.db.session.rollback()
            return False, str(e)