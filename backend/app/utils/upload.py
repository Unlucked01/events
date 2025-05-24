import os
import uuid
from fastapi import UploadFile
from PIL import Image
import shutil
import logging

# Настройка логирования
logger = logging.getLogger(__name__)

# Base upload path - используем абсолютный путь для соответствия volume mapping
UPLOAD_DIR = "/app/static/uploads"

# Ensure directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
logger.info(f"Upload directory initialized: {os.path.abspath(UPLOAD_DIR)}")

async def save_upload_file(upload_file: UploadFile, folder: str = ""):
    """
    Save an uploaded file to the specified directory.
    Returns the path to the saved file.
    """
    try:
        logger.info(f"Starting file upload. Original filename: {upload_file.filename}, folder: {folder}")
        logger.info(f"Current working directory: {os.getcwd()}")
        
        # Create folder if it doesn't exist
        upload_folder = os.path.join(UPLOAD_DIR, folder)
        os.makedirs(upload_folder, exist_ok=True)
        logger.info(f"Upload folder created/verified: {os.path.abspath(upload_folder)}")
        
        # Create a unique filename
        original_filename = upload_file.filename or "uploaded_file"
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_folder, unique_filename)
        
        logger.info(f"Generated unique filename: {unique_filename}")
        logger.info(f"Full file path: {os.path.abspath(file_path)}")
        
        # Manually read and write the file
        with open(file_path, "wb") as buffer:
            # Read smaller chunks to avoid memory issues
            content = upload_file.file.read()
            buffer.write(content)
            logger.info(f"File written successfully. Size: {len(content)} bytes")
        
        # Verify file was created
        if os.path.exists(file_path):
            actual_size = os.path.getsize(file_path)
            logger.info(f"File verified on disk. Size: {actual_size} bytes")
        else:
            logger.error(f"File was not created on disk: {file_path}")
        
        # Reset file position for further reading if needed
        await upload_file.seek(0)
        
        # Return the relative path
        relative_path = os.path.join("uploads", folder, unique_filename)
        logger.info(f"Returning relative path: {relative_path}")
        return relative_path
    except Exception as e:
        # Log the error
        logger.error(f"Error saving uploaded file: {str(e)}", exc_info=True)
        raise ValueError(f"Failed to save file: {str(e)}")

async def save_image(image_file: UploadFile, folder: str = "images", max_size: int = 1024):
    """
    Save an image, resize if necessary, and return the path.
    """
    try:
        logger.info(f"Starting image save. Folder: {folder}, max_size: {max_size}")
        
        # Check if file is an image
        content_type = image_file.content_type
        logger.info(f"Image content type: {content_type}")
        if not content_type or not content_type.startswith("image/"):
            raise ValueError("Файл не является изображением")
        
        # Save the original image
        image_path = await save_upload_file(image_file, folder)
        full_path = os.path.join("/app/static", image_path)  # Используем абсолютный путь
        
        logger.info(f"Image saved to: {image_path}")
        logger.info(f"Full path for processing: {os.path.abspath(full_path)}")
        
        # Validate the image can be opened
        try:
            with Image.open(full_path) as img:
                # Basic validation that it's a proper image
                width, height = img.size
                logger.info(f"Image dimensions: {width}x{height}")
                
                # Resize image if needed
                if width > max_size or height > max_size:
                    logger.info(f"Resizing image from {width}x{height}")
                    # Calculate aspect ratio
                    if width > height:
                        new_width = max_size
                        new_height = int(height * (max_size / width))
                    else:
                        new_height = max_size
                        new_width = int(width * (max_size / height))
                    
                    logger.info(f"New dimensions: {new_width}x{new_height}")
                    
                    # Resize and save
                    img = img.resize((new_width, new_height), Image.LANCZOS)
                    img.save(full_path)
                    logger.info("Image resized and saved successfully")
                else:
                    logger.info("Image size is acceptable, no resizing needed")
        except Exception as e:
            # If something goes wrong, delete the file and raise the error
            logger.error(f"Error processing image: {str(e)}")
            await delete_file(image_path)
            raise ValueError(f"Invalid image format: {str(e)}")
        
        logger.info(f"Image processing completed successfully. Final path: {image_path}")
        return image_path
    except Exception as e:
        # Log the error
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        raise ValueError(f"Failed to process image: {str(e)}")

async def delete_file(file_path: str):
    """
    Delete a file from the filesystem.
    """
    full_path = os.path.join("/app/static", file_path)  # Используем абсолютный путь
    logger.info(f"Attempting to delete file: {full_path}")
    if os.path.exists(full_path):
        os.remove(full_path)
        logger.info(f"File deleted successfully: {full_path}")
        return True
    else:
        logger.warning(f"File not found for deletion: {full_path}")
    return False 