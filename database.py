# database.py
from sqlmodel import SQLModel, create_engine

# 1. Define the database file
sqlite_file_name = "deployments.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# 2. Create the database engine
# The 'connect_args' is needed for SQLite to work well with FastAPI's async nature.
engine = create_engine(sqlite_url, echo=True, connect_args={"check_same_thread": False})

# 3. A function to create the database and tables
def create_db_and_tables():
    # This will look at all the classes that inherit from SQLModel and create
    # tables for them in the database if they don't already exist.
    SQLModel.metadata.create_all(engine)

def get_session():
    from sqlmodel import Session
    with Session(engine) as session:
        yield session