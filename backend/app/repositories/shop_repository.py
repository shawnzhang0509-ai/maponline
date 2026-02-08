import os
import base64
import uuid
from app.db_extensions import db
from flask import current_app
from app.repositories.base_repository import BaseRepository
from app.models.shop import Shop
from app.models.picture import Picture
from app.models.shop_picture import ShopPicture
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload
from app.services.upload_service import save_uploaded_file

class ShopRepository(BaseRepository):
    model = Shop
    def get_shop(self, content=None):
        query = self.session.query(Shop)

        query = query.options(
            joinedload(Shop.pictures)
        )
        if content != '':
            query = query.filter(
                or_(
                    Shop.name.ilike(f'%{content}%'),
                    Shop.address.ilike(f'%{content}%')
                )
            )
        query = query.all()
        return query
    
    def add_shop(self, data=None, files=None):
        new_girls = data.get("new_girls_last_15_days", False)
        if isinstance(new_girls, str):
            new_girls = new_girls.lower() == "true"
        shop = Shop(
            name=data.get('name'),
            address=data.get('address'),
            phone=data.get('phone'),
            lat=data.get('lat'),
            lng=data.get('lng'),
            badge_text = data.get('badge_text'),
            new_girls_last_15_days=new_girls
        )
        self.add(shop)
        
        files = files or []
        for f in files:
            file_name, _ = save_uploaded_file(f)

            picture = Picture(url=file_name)
            self.add(picture)

            shop_picture = ShopPicture(shop_id=shop.id, picture_id=picture.id)
            self.add(shop_picture)

        # 3. 提交事务
        self.session.commit()

        return shop
        
    def del_shop(self, shop_id: int):
        try:
            # 1. 查出 shop
            shop = self.get_by_id(shop_id)
            if not shop:
                return False, "Shop not found"

            # 2. 查出所有关联的中间表记录和图片记录
            shop_pictures = db.session.query(ShopPicture).filter(ShopPicture.shop_id == shop_id).all()
            picture_ids = [sp.picture_id for sp in shop_pictures]

            pictures = db.session.query(Picture).filter(Picture.id.in_(picture_ids)).all()

            # 3. 删除中间表
            for sp in shop_pictures:
                db.session.delete(sp)

            # 4. 删除图片文件和图片记录
            files_folder = current_app.config['FILES_FOLDER']
            for pic in pictures:
                file_path = os.path.join(files_folder, pic.url)
                if os.path.exists(file_path):
                    os.remove(file_path)
                db.session.delete(pic)

            # 5. 删除 shop
            db.session.delete(shop)

            # 6. 提交事务
            db.session.commit()
            return True, "Shop deleted successfully"

        except Exception as e:
            db.session.rollback()
            return False, str(e)

    def update_shop(self, shop_id, data=None, files=None):
        shop = self.session.query(Shop).get(shop_id)
        if not shop:
            raise ValueError("Shop not found")

        # 1. 处理 boolean
        new_girls = data.get("new_girls_last_15_days")
        if isinstance(new_girls, str):
            new_girls = new_girls.lower() == "true"

        # 2. 更新字段（有值才改）
        for field in [
            "name", "address", "phone",
            "lat", "lng", "badge_text"
        ]:
            if field in data:
                setattr(shop, field, data.get(field))

        if new_girls is not None:
            shop.new_girls_last_15_days = new_girls

        # ===== 3. 删除图片 =====
        remove_ids = [int(i) for i in data.get("remove_picture_ids", "").split(",") if i]
        if remove_ids:
            remove_ids = [int(i) for i in remove_ids]

            shop_pictures = (
                self.session.query(ShopPicture)
                .filter(
                    ShopPicture.shop_id == shop.id,
                    ShopPicture.picture_id.in_(remove_ids)
                )
                .all()
            )

            picture_ids = [sp.picture_id for sp in shop_pictures]

            pictures = (
                self.session.query(Picture)
                .filter(Picture.id.in_(picture_ids))
                .all()
            )

            for sp in shop_pictures:
                self.session.delete(sp)

            files_folder = current_app.config['FILES_FOLDER']
            for pic in pictures:
                file_path = os.path.join(files_folder, pic.url)
                if os.path.exists(file_path):
                    os.remove(file_path)
                self.session.delete(pic)

        # 4. 新增图片（不影响旧图）
        files = files or []
        for f in files:
            file_name, _ = save_uploaded_file(f)

            picture = Picture(url=file_name)
            self.session.add(picture)
            self.session.flush()  # 立刻拿到 picture.id

            shop_picture = ShopPicture(
                shop_id=shop.id,
                picture_id=picture.id
            )
            self.session.add(shop_picture)

        self.session.commit()
        return shop

