#!/usr/bin/env python3
"""
Telegram message forwarding service for VPS.
This script creates a simple API endpoint that forwards messages to Telegram.
Run this on your VPS where Telegram connectivity works.
"""

import os
import json
import logging
from quart import Quart, request, jsonify
from aiogram import Bot
import asyncio
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_KEY = os.getenv("API_KEY", "your-secret-api-key")  # Use this to secure your API

# Validate token
if not BOT_TOKEN:
    logger.error("TELEGRAM_BOT_TOKEN not set in environment variables!")
    exit(1)

app = Quart(__name__)

# Initialize bot
bot = Bot(token=BOT_TOKEN)

@app.route('/send_message', methods=['POST'])
async def send_message():
    """API endpoint to send messages to Telegram"""
    # Check authorization
    if request.headers.get('Authorization') != f"Bearer {API_KEY}":
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = await request.get_json()
    
    # Validate request data
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
    
    required_fields = ["chat_id", "text"]
    for field in required_fields:
        if field not in data:
            return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
    
    # Extract parameters
    chat_id = data.get("chat_id")
    text = data.get("text")
    parse_mode = data.get("parse_mode")
    
    # Handle inline keyboard if provided
    reply_markup = None
    if "inline_keyboard" in data:
        from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
        keyboard_data = data.get("inline_keyboard", [])
        buttons = []
        
        for row in keyboard_data:
            button_row = []
            for btn in row:
                button_row.append(InlineKeyboardButton(
                    text=btn.get("text", "Button"),
                    url=btn.get("url", "")
                ))
            buttons.append(button_row)
            
        if buttons:
            reply_markup = InlineKeyboardMarkup(inline_keyboard=buttons)
    
    # Send message
    try:
        message = await bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode=parse_mode,
            reply_markup=reply_markup
        )
        
        # Return success response
        return jsonify({
            "status": "success", 
            "message_id": message.message_id,
            "chat_id": message.chat.id
        })
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Simple health check endpoint
@app.route('/health', methods=['GET'])
async def health_check():
    return jsonify({"status": "ok"})

# Add diagnostic endpoint
@app.route('/bot_info', methods=['GET'])
async def bot_info():
    # Check authorization
    if request.headers.get('Authorization') != f"Bearer {API_KEY}":
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
    try:
        info = await bot.get_me()
        return jsonify({
            "status": "success",
            "bot_id": info.id,
            "bot_name": info.first_name,
            "bot_username": info.username,
            "token_valid": True
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "token_valid": False
        }), 500

# Run the app
if __name__ == "__main__":
    # Set port
    port = int(os.getenv("PORT", 5000))
    
    # Log startup info
    logger.info(f"Starting Telegram forwarding service on port {port}")
    logger.info(f"Using bot token: {BOT_TOKEN[:5]}...{BOT_TOKEN[-5:]}")
    
    # Start the app
    app.run(host="0.0.0.0", port=port) 