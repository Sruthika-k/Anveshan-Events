from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid

from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    skills = Column(ARRAY(String), nullable=False, server_default="{}")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
