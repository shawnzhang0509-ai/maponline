from app.db_extensions import db

class BaseRepository:
    model = None

    def __init__(self, session=None):
        self.session = session or db.session

    def get_by_id(self, id):
        return self.session.get(self.model, id)

    def add(self, entity):
        self.session.add(entity)
        self.session.flush()

    def delete(self, entity):
        self.session.delete(entity)

    def list(self):
        return self.session.query(self.model).all()
