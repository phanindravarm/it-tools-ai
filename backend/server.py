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
    button = "button"
    checkbox = "checkbox"
    color = "color"
    date = "date"
    datetime_local = "datetime-local"
    email = "email"
    file = "file"
    hidden = "hidden"
    image = "image"
    month = "month"
    number = "number"
    password = "password"
    radio = "radio"
    range = "range"
    reset = "reset"
    search = "search"
    submit = "submit"
    tel = "tel"
    text = "text"
    time = "time"
    url = "url"
    week = "week"

class ToolType(str, Enum):
    crypto = "Crypto"
    converter = "Converter"
    web = "Web"
    images_videos = "Images & Videos"
    development = "Development"
    network = "Network"
    math = "Math"
    measurement = "Measurement"
    text = "Text"
    data = "Data"

class Input(BaseModel):
    type:InputType
    human_readable_title: str

class Repsonse_format(BaseModel):
    human_readable_function_title : str
    function_title: str
    function_description : str
    code : str
    inputs : list[Input]
    output: int | str
    tool_type : ToolType
    requires_manual_run : bool

@app.post("/send")
async def send_response(request: Request,db: Session = Depends(get_db)):
    body = await request.json()
    query = body.get("query")
    os.environ['GEMINI_API_KEY'] = os.getenv("GEMINI_API_KEY")
    prompt = f"""
        Analyze the query: {query}

Write a complete browser-safe JavaScript function based on the user's query. The function must follow these rules:

1.  Dynamically Load External Libraries from CDN
	•	Identify the appropriate JavaScript library needed for the user’s query.
	•	Load the library dynamically by injecting a `<script>` tag only if it’s not already loaded.
	•	Check for the presence of the expected global variable (e.g., `window.QRCode`, `window.Chart`).
	•	Construct the CDN URL programmatically using a trusted CDN:
	•	Default to:`https://cdn.jsdelivr.net/npm/package-name@version/file-path `or` https://cdn.jsdelivr.net/gh/user/repo/path` if needed.
	•	If no version is specified, default to the latest.
	•	If unpkg/jsDelivr cannot serve a working file, use a GitHub-based jsDelivr fallback.

2. Do **not** use or require an `Element ID` input.
   - The function should not depend on or modify the DOM unless absolutely necessary.
   - If a visual result (e.g. image, chart) must be created, use a temporary off-screen element or canvas internally.

3. The function should **return meaningful output**:
   - For visual elements like QR codes or charts: return the image or canvas content as a `data:image/png;base64,...` string using `.toDataURL()`.
   - For calculations or text generation: return the result as a string, number, or array.
   - If an error occurs, return a string like `"Error: ..."`, not an exception.

4. Only use browser-safe JavaScript.
   - Do **not** use `require()`, `import`, `fs`, or any Node.js-specific features.
   - Your code must run in a browser context.

5. Ensure all async operations (e.g., loading scripts, rendering canvases) are handled properly using `await` or `Promise`.

Always write clean, readable JavaScript with useful return values. Do not inject content into the page unless explicitly instructed.

“The generated function must not create or inject any input fields, forms, buttons, or textareas. All user inputs will come from the host application and be passed into the function as arguments

Required return format:
- `inputs`: list of inputs required by the function
- `code`: complete and functional JavaScript function
- `function_title`: the exact name of the function
- `output`: expected result (example: "QR code generated!" or image URL)
- `tool_type`: one of the defined enums
- `function_description`: short explanation of the function
- `requires_manual_run`: analyze the query , decide true or false
    """
    
    response = completion(
        model="gemini/gemini-2.0-flash", 
        messages=[{"role": "user", "content": prompt}],
        response_format=Repsonse_format
    )
    print(response.choices[0].message.content)
    content = json.loads(response.choices[0].message.content)
    new_data = models.Tools(
        human_readable_function_title = content.get("human_readable_function_title"),
        function_title= content.get("function_title"),
        code = content.get("code"),
        inputs = content.get("inputs"),
        output = content.get("output"),
        tool_type = content.get("tool_type"),
        function_description = content.get("function_description"),
        requires_manual_run = content.get("requires_manual_run")
    )
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return content

@app.get('/tools')
async def show_tools(db: Session = Depends(get_db)):
    tools = db.query(models.Tools).all()
    return tools


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
