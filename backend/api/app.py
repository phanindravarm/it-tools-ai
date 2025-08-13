from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from pydantic import BaseModel,Field
from litellm import completion
from enum import Enum
from typing import List, Union, Dict, Optional
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models import Tools, Base
from database import engine, SessionLocal

load_dotenv()

app = FastAPI()

origins = [
    "https://it-backend-xi.vercel.app",      
    "http://localhost:3000",       
    "https://it-frontend-beryl.vercel.app",  
]

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
    select = "select"

class OptionItem(BaseModel):
    label: str = Field(..., description="Display text for the option")
    value: str = Field(..., description="Value sent back when selected")

class Input(BaseModel):
    type: InputType
    human_readable_title: str
    options: Optional[List[OptionItem]] = Field(
        default=None,
        description="Only for select/multi-choice inputs."
    )

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
Write a complete browser-safe JavaScript function based on the user's query. The function must follow these rules:

1.  Dynamically Load External Libraries from CDN
	•	Identify the exact JavaScript library needed for the task.
	•	Load from a correct working CDN URL (never return an incorrect or non-existent file path).
	•	Load dynamically only if not already present (`if (!window.LibraryName)`).
	•	Preferred URL format:
	•	`https://cdn.jsdelivr.net/npm/<package-name>@<version>/<path-to-file>` or fallback to `https://cdn.jsdelivr.net/gh/<user>/<repo>/<path>`
	•	Fall back to a proven alternative CDN if unavailable (check package files first; avoid MIME type errors).
	•	Always check `window.<ExpectedGlobal>` to confirm availability.

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

6.For each input in the `inputs` list:
    - If the input type is "select" (or other multi-choice type like "radio"):
        - Include a non-empty `options` array.
        - Each option must be an object with both "label" and "value" fields.
        - `value` must be lowercase and exactly one of the allowed keys.
    - For all other input types, omit the `options` field entirely.

Always write clean, readable JavaScript with useful return values. The function must not create, modify, or inject any HTML input elements (<input>, <form>, <textarea>, <button>, etc.).

“The generated function must not create or inject any input fields, forms, buttons, or textareas. All user inputs will come from the host application and be passed into the function as arguments


Required return format:
- `inputs`: list of inputs required by the function
- `code`: complete and functional JavaScript function
- `function_title`: the exact name of the function
- `output`: expected result (example: "QR code generated!" or image URL)

IMPORTANT: Your output must be a single valid JSON object matching the required format, without any extra text or code fences. The JSON must be complete and parsable.

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
