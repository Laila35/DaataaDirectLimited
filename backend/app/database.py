import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
# Local SQL file by default. Set DATABASE_URL to a MySQL URL for AWS or a local server:
# mysql+pymysql://user:password@localhost:3306/daataa_direct
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./daataa.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
class Base(DeclarativeBase):
    pass
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
