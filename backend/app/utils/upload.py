import os
import uuid
from fastapi import UploadFile
from PIL import Image
import shutil

# Base upload path - изменяем с "app/static" на просто "static"
UPLOAD_DIR = "static/uploads"

# Ensure directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile, folder: str = ""):
    """
    Save an uploaded file to the specified directory.
    Returns the path to the saved file.
    """
    try:
        # Create folder if it doesn't exist
        upload_folder = os.path.join(UPLOAD_DIR, folder)
        os.makedirs(upload_folder, exist_ok=True)
        
        # Create a unique filename
        original_filename = upload_file.filename or "uploaded_file"
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_folder, unique_filename)
        
        # Manually read and write the file
        with open(file_path, "wb") as buffer:
            # Read smaller chunks to avoid memory issues
            content = upload_file.file.read()
            buffer.write(content)
        
        # Reset file position for further reading if needed
        await upload_file.seek(0)
        
        # Return the relative path
        relative_path = os.path.join("uploads", folder, unique_filename)
        return relative_path
    except Exception as e:
        # Log the error
        print(f"Error saving uploaded file: {str(e)}")
        raise ValueError(f"Failed to save file: {str(e)}")

async def save_image(image_file: UploadFile, folder: str = "images", max_size: int = 1024):
    """
    Save an image, resize if necessary, and return the path.
    """
    try:
        # Check if file is an image
        content_type = image_file.content_type
        if not content_type or not content_type.startswith("image/"):
            raise ValueError("Файл не является изображением")
        
        # Save the original image
        image_path = await save_upload_file(image_file, folder)
        full_path = os.path.join("static", image_path)
        
        # Validate the image can be opened
        try:
            with Image.open(full_path) as img:
                # Basic validation that it's a proper image
                width, height = img.size
                
                # Resize image if needed
                if width > max_size or height > max_size:
                    # Calculate aspect ratio
                    if width > height:
                        new_width = max_size
                        new_height = int(height * (max_size / width))
                    else:
                        new_height = max_size
                        new_width = int(width * (max_size / height))
                    
                    # Resize and save
                    img = img.resize((new_width, new_height), Image.LANCZOS)
                    img.save(full_path)
        except Exception as e:
            # If something goes wrong, delete the file and raise the error
            await delete_file(image_path)
            raise ValueError(f"Invalid image format: {str(e)}")
        
        return image_path
    except Exception as e:
        # Log the error
        print(f"Error processing image: {str(e)}")
        raise ValueError(f"Failed to process image: {str(e)}")

async def delete_file(file_path: str):
    """
    Delete a file from the filesystem.
    """
    full_path = os.path.join("static", file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        return True
    return False 