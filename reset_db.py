from database import engine
from models import Anime, Chapter
from sqlalchemy import text

def reset_tables():
    print("Dropping Anime and Chapter tables...")
    try:
        # Disable foreign key checks momentarily to avoid ordering issues
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            
            try:
                # Drop dependent tables first
                from models import Reaction
                Reaction.__table__.drop(conn)
                print("Dropped reactions")
            except Exception as e:
                print(f"Error dropping reactions: {e}")

            try:
                Chapter.__table__.drop(conn)
                print("Dropped chapters")
            except Exception as e:
                print(f"Error dropping chapters: {e}")
                
            try:
                Anime.__table__.drop(conn)
                print("Dropped animes")
            except Exception as e:
                print(f"Error dropping animes: {e}")

            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            conn.commit()
            
        print("Done. Please restart the backend to recreate tables.")
    except Exception as e:
        print(f"Critical Error: {e}")

if __name__ == "__main__":
    reset_tables()
