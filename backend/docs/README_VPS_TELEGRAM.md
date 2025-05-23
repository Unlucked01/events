# VPS Telegram Forwarding Solution

This solution solves the problem of Telegram API connectivity issues from your local machine or Docker container by using a VPS (Virtual Private Server) as a relay for sending messages to Telegram.

## Background

Some network environments block access to the Telegram API, which prevents the application from sending messages directly to Telegram. This solution uses a VPS with unrestricted access to the Telegram API to relay messages between your application and Telegram.

## Components

1. **VPS API Server** (`vps_telegram_forwarder.py`) - A simple API server that runs on your VPS and forwards messages to Telegram
2. **Modified Telegram Controller** (`telegram_controller.py`) - Modified to send messages through the VPS API first, with direct Telegram API as fallback
3. **Deployment Script** (`deploy_vps_service.sh`) - Helps automate the setup of the VPS API server
4. **Test Scripts** - To verify connectivity and diagnose issues

## Setup Instructions

### 1. Deploy the VPS API Server

1. Make sure you have a VPS with Python 3.6+ installed
2. Make `deploy_vps_service.sh` executable:
   ```bash
   chmod +x deploy_vps_service.sh
   ```
3. Run the deployment script:
   ```bash
   ./deploy_vps_service.sh user@your-vps-ip-address [port]
   ```
   Replace `user@your-vps-ip-address` with your SSH connection string and optionally specify a port (default is 5000).

4. The script will:
   - Generate a random API key for security
   - Set up a systemd service for auto-start on reboot
   - Display settings to add to your application's `.env` file

### 2. Update Your Application

1. Add the generated settings to your `.env` file:
   ```
   VPS_API_URL=http://your-vps-ip:5000
   VPS_API_KEY=your-generated-api-key
   ```

2. Make sure the modified `telegram_controller.py` is in place in your application.

### 3. Test the Integration

1. Test basic connectivity:
   ```bash
   python test_vps_api.py --health-check
   ```

2. Check the bot information:
   ```bash
   python test_vps_api.py --bot-info
   ```

3. Send a test message:
   ```bash
   python test_vps_api.py your-chat-id
   ```

## Troubleshooting

If you encounter issues, check the following:

1. **VPS API Server not running**:
   ```bash
   ssh user@your-vps-ip-address
   sudo systemctl status telegram_forwarder
   sudo journalctl -u telegram_forwarder
   ```

2. **Firewall issues**: Make sure port 5000 (or your custom port) is open on your VPS.
   ```bash
   sudo ufw status
   ```
   If it's not open, allow it:
   ```bash
   sudo ufw allow 5000/tcp
   ```

3. **Invalid Bot Token**: Verify your bot token is correct in the `.env` file on your VPS.

4. **API Key mismatch**: Make sure the API key in your local `.env` file matches the one on the VPS.

## Security Considerations

- The VPS API server uses API key authentication to protect access
- Consider adding rate limiting and IP whitelisting for production
- Keep your API keys secure
- Consider setting up HTTPS for the VPS API server for production use

## Architecture Diagram

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  Your App     │       │  VPS Server   │       │  Telegram API │
│               │       │               │       │               │
│ TelegramCtrl  │─HTTP─▶│ Forwarder API │─HTTP─▶│  Bot API      │
│               │       │               │       │               │
└───────────────┘       └───────────────┘       └───────────────┘
```

## Files

- `vps_telegram_forwarder.py` - The API server for VPS
- `test_vps_api.py` - Tool to test the VPS API
- `deploy_vps_service.sh` - Deployment script
- Backend TelegramController - Modified to use VPS API 