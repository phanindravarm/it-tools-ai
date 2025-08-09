from sqlalchemy import Column, Integer, String, Text, JSON, Boolean
from database import Base

class Tools(Base):
    __tablename__ = "tools"
    id = Column(Integer, primary_key=True, index=True)
    human_readable_function_title = Column(String, nullable=False)
    function_title = Column(String, nullable=False)
    code = Column(Text, nullable=False)
    inputs = Column(JSON, nullable=False)  
    output = Column(String, nullable=False)