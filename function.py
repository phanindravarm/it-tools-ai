from litellm import completion
import os
import json
# Set environment variable for Gemini API key
os.environ["GEMINI_API_KEY"] = "AIzaSyAh7Sip06bXWXw0XxBCYcDLESt4TEYq0KQ"

# Define the tool for creating a file
tools = [
    {
        "type": "function",
        "function": {
            "name": "create_file",
            "description": "Creates a file at the specified path with the given content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path where the file should be created, including the file name (e.g., /home/user/file.txt)."
                    },
                    "content": {
                        "type": "string",
                        "description": "The content to be written to the file."
                    }
                },
                "required": ["file_path", "content"],
            },
        },
    }
]

# Define the user query (e.g., request to create a file)
messages = [{"role": "user", "content": "Please create a file at  /Users/phani/Desktop/it-ai/frontend/src/pages/Hello.txt with content 'Hello, World!'" }]

# Make the completion request
response = completion(
    model="gemini/gemini-2.0-flash",  # The model you are using
    messages=messages,
    tools=tools,
    response_format={"type": "json_object"}
)

# Print the response to check if the file creation function was called
print(response)
# print("Response : ",response.choices[0].message.tool_calls[0].function.arguments)
# Example: Checking if the file creation was called correctly
content_str = response['choices'][0]['message']['content']
parsed_content = json.loads(content_str)
hey = parsed_content.get('file_path')
print("hey : ",hey)
file_path = hey
content = parsed_content.get('content')

# print(f"File Path: {file_path}")
# print(f"Content: {content}")

# You can use this information to actually create the file
def create_file(file_path: str, content: str) -> dict:
    """Creates a file at the specified path and writes the given content to it."""
    try:
        # Ensure the directory exists before creating the file
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Create the file and write content
        with open(file_path, "w") as file:
            file.write(content)

        # Return a confirmation dictionary
        return {"message": "File created successfully", "filePath": file_path}
    
    except Exception as e:
        # Return an error message if something goes wrong
        return {"message": f"Error occurred: {str(e)}", "filePath": file_path}

# Call the function based on the AI response
file_creation_response = create_file(file_path, content)
print(file_creation_response)
