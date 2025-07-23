from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from pydantic import BaseModel
from enum import Enum
from typing import List, Union
from litellm import completion
import json
import os
from database import SessionLocal, engine
import models

load_dotenv()

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputType(str, Enum):
    int = "int"
    string = "string"

class Input(BaseModel):
    type:InputType
    human_readable_title: str

class Repsonse_format(BaseModel):
    human_readable_function_title : str
    function_title: str
    function_description : str
    code : str
    inputs : list[Input]
    output : str|int

@app.post("/send")
async def send_response(request: Request,db: Session = Depends(get_db)):
    body = await request.json()
    query = body.get("query")
    os.environ['GEMINI_API_KEY'] = os.getenv("GEMINI_API_KEY")
    prompt = f"""
        Analyze the query {query}
        Your task is to act as a input output javascript code generator.The user should be able to give inputs based on the {query}.
        `inputs` should be a list of inputs needed for this function. 
        `code`: a complete JavaScript function. The function **name must exactly match** the `function_title`.
        `function_description` : description of function what exactly it does it should be short and well mannered
    """
    
    response = completion(
        model="gemini/gemini-2.0-flash", 
        messages=[{"role": "user", "content": prompt}],
        response_format=Repsonse_format
    )
    content = json.loads(response.choices[0].message.content)
    new_data = models.Tools(
        human_readable_function_title = content.get("human_readable_function_title"),
        function_title= content.get("function_title"),
        code = content.get("code"),
        inputs = content.get("inputs"),
        output = content.get("output")
    )
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return content

@app.get('/tools')
async def show_tools(db: Session = Depends(get_db)):
    return db.query(models.Tools).all()


@app.delete('/tools')
async def delete_tools(request : Request,db: Session = Depends(get_db)):
    body = await request.json()
    delete_id = body.get("id")
    tool = db.query(models.Tools).filter(models.Tools.id == delete_id).first()
    if tool:
        db.delete(tool)
        db.commit()
        return {"message": "Deleted successfully"}
    return {"message": "Tool not found"}
