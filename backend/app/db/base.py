from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

from ..core.config import settings

engine = create_engine(settings.database_url)
Base = declarative_base()
