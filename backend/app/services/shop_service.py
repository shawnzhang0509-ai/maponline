from app.repositories.shop_repository import ShopRepository

class ShopService:
    def __init__(self):
        self.repo = ShopRepository()

    def search_shop(self, content):
        shop = self.repo.get_shop(content)
        return shop
    
    def add_shop(self, data, files):
        shop = self.repo.add_shop(data, files)
        return shop
    
    def del_shop(self, id):
        self.repo.del_shop(id)
        return True

    def update_shop(self, shop_id, data, files):
        shop = self.repo.update_shop(shop_id, data, files)
        return shop
