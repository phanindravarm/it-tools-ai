from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from pydantic import BaseModel
from litellm import completion
from enum import Enum
from typing import List, Union
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import Tools, Base
from database import engine, SessionLocal

load_dotenv()

app = FastAPI()

origins = ["https://it-frontend-beryl.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class InputType(str, Enum):
    int = "int"
    string = "string"

class Input(BaseModel):
    type: InputType
    human_readable_title: str

class RepsonseFormat(BaseModel):
    human_readable_function_title: str
    function_title: str
    function_description: str
    code: str
    inputs: List[Input]
    output: Union[str, int]

@app.get("/")
def root():
    return {"message": "FastAPI on Vercel is working!"}

@app.post("/send")
async def send_response(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    query = body.get("query")
    
    os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY")

    prompt = f"""
    Analyze the query: {query}
    Your task is to act as a JavaScript code generator with defined inputs and outputs.
    Format:
    - inputs: List of input fields
    - code: Complete JavaScript function
    - function_description: A short description of the function
    """

    response = completion(
        model="gemini/gemini-2.0-flash",
        messages=[{"role": "user", "content": prompt}],
        response_format=RepsonseFormat
    )

    content = json.loads(response.choices[0].message.content)

    new_tool = Tools(
        human_readable_function_title=content["human_readable_function_title"],
        function_title=content["function_title"],
        code=content["code"],
        inputs=content["inputs"],
        output=str(content["output"])
    )

    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)

    content["id"] = new_tool.id 
    return content

@app.get("/tools")
def show_tools(db: Session = Depends(get_db)):
    tools = db.query(Tools).all()
    return [
        {
            "id": tool.id,
            "human_readable_function_title": tool.human_readable_function_title,
            "function_title": tool.function_title,
            "code": tool.code,
            "inputs": tool.inputs,
            "output": tool.output
        }
        for tool in tools
    ]

@app.delete("/tools")
async def delete_tool(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    tool_id = body.get("id")
    tool = db.query(Tools).filter(Tools.id == tool_id).first()
    if tool:
        db.delete(tool)
        db.commit()
        return {"message": "Deleted successfully"}
    return {"message": "Tool not found"}
