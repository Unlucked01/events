#!/bin/bash
# Script to deploy the Telegram forwarding service to a VPS

# Stop on errors
set -e

echo "=== Deploying Telegram Forwarding Service to VPS ==="

# Check if SSH key is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <ssh-connection-string> [port]"
  echo "Example: $0 user@vps-ip-address 5000"
  exit 1
fi

SSH_CONN=$1
PORT=${2:-5000}
API_KEY=$(openssl rand -hex 16)  # Generate random API key

# Ask if the user wants to use SSH keys
read -p "Do you want to upload your SSH key to avoid password prompts? (y/n): " upload_key
if [ "$upload_key" = "y" ] || [ "$upload_key" = "Y" ]; then
  echo "Uploading SSH key to the server..."
  ssh-copy-id $SSH_CONN
  echo "SSH key uploaded successfully!"
fi

echo "Generating .env file for VPS..."
cat > vps_env << EOF
TELEGRAM_BOT_TOKEN=7437467328:AAGlqukicy-p6d7bu-ilyvGS_KCJYp4NYpw
API_KEY=$API_KEY
PORT=$PORT
EOF

echo "Generating .env update for local environment..."
cat > local_env_update << EOF

# VPS Telegram API settings
VPS_API_URL=http://<your-vps-ip>:$PORT
VPS_API_KEY=$API_KEY
EOF

echo "Creating Python virtual environment on VPS..."
ssh $SSH_CONN "mkdir -p ~/telegram_forwarder && python3 -m venv ~/telegram_forwarder/venv"

echo "Copying files to VPS..."
scp vps_telegram_forwarder.py vps_env $SSH_CONN:~/telegram_forwarder/
ssh $SSH_CONN "mv ~/telegram_forwarder/vps_env ~/telegram_forwarder/.env"

echo "Installing dependencies in the virtual environment..."
ssh $SSH_CONN "~/telegram_forwarder/venv/bin/pip install -U aiogram quart python-dotenv"

echo "Setting up systemd service..."
cat > telegram_forwarder.service << EOF
[Unit]
Description=Telegram Forwarding Service
After=network.target

[Service]
User=root
WorkingDirectory=/root/telegram_forwarder
ExecStart=/root/telegram_forwarder/venv/bin/python /root/telegram_forwarder/vps_telegram_forwarder.py
Restart=always
RestartSec=10
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

scp telegram_forwarder.service $SSH_CONN:~/
ssh $SSH_CONN "sudo mv ~/telegram_forwarder.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable telegram_forwarder && sudo systemctl start telegram_forwarder"

echo "Cleaning up temporary files..."
rm -f vps_env telegram_forwarder.service

echo "=== Deployment Complete ==="
echo ""
echo "VPS API URL: http://<your-vps-ip>:$PORT"
echo "VPS API Key: $API_KEY"
echo ""
echo "Add these to your .env file:"
cat local_env_update
echo ""
echo "Don't forget to update <your-vps-ip> with your actual VPS IP address!"
echo ""
echo "To test the service, run:"
echo "python test_vps_api.py <your-chat-id>"
echo ""
echo "To check service status:"
echo "ssh $SSH_CONN 'sudo systemctl status telegram_forwarder'" 