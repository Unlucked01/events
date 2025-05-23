#!/usr/bin/env python3
"""
Script to test connectivity with the VPS API forwarding service.
"""

import os
import requests
import logging
import argparse
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
VPS_API_URL = os.getenv("VPS_API_URL")
VPS_API_KEY = os.getenv("VPS_API_KEY")

def check_api_health():
    """Check if the VPS API is running"""
    if not VPS_API_URL:
        logger.error("VPS_API_URL not set in .env file")
        return False
    
    try:
        logger.info(f"Checking health of VPS API at {VPS_API_URL}")
        response = requests.get(f"{VPS_API_URL}/health", timeout=5)
        
        if response.status_code == 200:
            logger.info("VPS API is healthy")
            return True
        else:
            logger.error(f"VPS API is not healthy. Status code: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Error connecting to VPS API: {e}")
        return False

def check_bot_info():
    """Check the bot info from the VPS API"""
    if not VPS_API_URL:
        logger.error("VPS_API_URL not set in .env file")
        return False
    
    if not VPS_API_KEY:
        logger.error("VPS_API_KEY not set in .env file")
        return False
    
    headers = {
        "Authorization": f"Bearer {VPS_API_KEY}"
    }
    
    try:
        logger.info(f"Checking bot info from VPS API at {VPS_API_URL}")
        response = requests.get(
            f"{VPS_API_URL}/bot_info",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Bot info: @{result.get('bot_username')} (ID: {result.get('bot_id')})")
            logger.info(f"Bot name: {result.get('bot_name')}")
            logger.info(f"Token valid: {result.get('token_valid')}")
            return True
        else:
            logger.error(f"API error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error connecting to VPS API: {e}")
        return False

def test_vps_api(chat_id, message):
    """Test sending a message through the VPS API"""
    if not VPS_API_URL:
        logger.error("VPS_API_URL not set in .env file")
        return False
    
    if not VPS_API_KEY:
        logger.error("VPS_API_KEY not set in .env file")
        return False
    
    # Prepare payload
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {VPS_API_KEY}"
    }
    
    try:
        logger.info(f"Sending test message to {chat_id} via VPS API at {VPS_API_URL}")
        response = requests.post(
            f"{VPS_API_URL}/send_message",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Message successfully sent! Message ID: {result.get('message_id')}")
            return True
        else:
            logger.error(f"API error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error connecting to VPS API: {e}")
        return False

def main():
    """Main function for testing VPS API"""
    parser = argparse.ArgumentParser(description="Test the VPS Telegram forwarding API")
    parser.add_argument("chat_id", help="Telegram chat ID to send message to", nargs="?")
    parser.add_argument("--message", default="🔍 Test message from VPS API forwarding service", 
                        help="Message to send (default: test message)")
    parser.add_argument("--health-check", action="store_true",
                        help="Check if the API is running")
    parser.add_argument("--bot-info", action="store_true",
                        help="Get information about the bot")
    
    args = parser.parse_args()
    
    logger.info("Testing VPS API for Telegram message forwarding")
    
    # First check API health
    if args.health_check or not args.chat_id:
        health_status = check_api_health()
        if not health_status:
            logger.error("Health check failed - API is not running or not reachable")
            return
    
    # Then check bot info if requested
    if args.bot_info or not args.chat_id:
        bot_info_status = check_bot_info()
        if not bot_info_status:
            logger.error("Bot info check failed - API key may be wrong or bot token may be invalid")
            return
    
    # Finally, send a test message if chat_id is provided
    if args.chat_id:
        if test_vps_api(args.chat_id, args.message):
            logger.info("VPS API test successful!")
        else:
            logger.error("VPS API test failed!")
    elif not args.health_check and not args.bot_info:
        logger.error("No chat_id provided and no checks specified. Use --help for usage information.")

if __name__ == "__main__":
    main() 