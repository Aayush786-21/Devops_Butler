# database.py
from sqlmodel import SQLModel, create_engine
from login import User, Deployment  # Import models to ensure they're registered

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
    # Lightweight migrations for existing installations
    try:
        import sqlalchemy as sa
        with engine.begin() as conn:
            # Introspect existing columns on deployment table
            cols = conn.execute(sa.text("PRAGMA table_info('deployment')")).fetchall()
            existing_cols = {row[1] for row in cols}  # row[1] is column name
            # Add missing 'app_name' column if not present
            if 'app_name' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN app_name TEXT"))
            # Add missing 'updated_at' column if database is very old
            if 'updated_at' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN updated_at TIMESTAMP NULL"))
            # Ensure 'user_id' column exists for ownership
            if 'user_id' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN user_id INTEGER NULL"))
            # Add parent_project_id for split repositories
            if 'parent_project_id' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN parent_project_id INTEGER NULL"))
            # Add component_type to identify frontend/backend components
            if 'component_type' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN component_type TEXT NULL"))
            if 'custom_domain' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN custom_domain TEXT NULL"))
            if 'domain_status' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN domain_status TEXT NULL"))
            if 'last_domain_sync' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN last_domain_sync TIMESTAMP NULL"))
            # Add process-based deployment fields
            if 'build_command' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN build_command TEXT NULL"))
            if 'start_command' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN start_command TEXT NULL"))
            if 'port' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN port INTEGER NULL"))
            if 'process_pid' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN process_pid INTEGER NULL"))
            if 'project_dir' not in existing_cols:
                conn.execute(sa.text("ALTER TABLE deployment ADD COLUMN project_dir TEXT NULL"))
    except Exception:
        # Never block startup on a migration error; logs will capture details elsewhere
        pass

def get_session():
    from sqlmodel import Session
    with Session(engine) as session:
        yield session