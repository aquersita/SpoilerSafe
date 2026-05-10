from models import db, app
from sqlalchemy import text

try:
    with app.app_context():
        db.session.execute(text('SELECT 1'))
    print("Database connection successful!")
except Exception as e:
    print(f"Database connection failed: {e}")
