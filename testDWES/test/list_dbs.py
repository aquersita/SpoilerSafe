from sqlalchemy import create_engine, text

# Connect without selecting a database
engine = create_engine("mysql+pymysql://testUser:123@localhost:3306/")

try:
    with engine.connect() as connection:
        result = connection.execute(text("SHOW DATABASES"))
        print("Available databases:")
        for row in result:
            print(row[0])
except Exception as e:
    print(f"Failed to list databases: {e}")
