#!/bin/bash
# Simple deployment script for Telegram forwarding service
# Uses screen instead of systemd for simpler setup

# Stop on errors
set -e

echo "=== Deploying Simple Telegram Forwarding Service to VPS ==="

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

echo "Creating project directory on VPS..."
ssh $SSH_CONN "mkdir -p ~/telegram_forwarder"

echo "Copying files to VPS..."
scp vps_telegram_forwarder.py vps_env $SSH_CONN:~/telegram_forwarder/
ssh $SSH_CONN "mv ~/telegram_forwarder/vps_env ~/telegram_forwarder/.env"

echo "Installing Python and dependencies on VPS..."
ssh $SSH_CONN "apt-get update && apt-get install -y python3-venv python3-pip screen"
ssh $SSH_CONN "cd ~/telegram_forwarder && python3 -m venv venv && ./venv/bin/pip install aiogram quart python-dotenv"

# Create a startup script
echo "Creating startup script..."
cat > start_telegram_service.sh << EOF
#!/bin/bash
cd ~/telegram_forwarder
source venv/bin/activate
python vps_telegram_forwarder.py
EOF

scp start_telegram_service.sh $SSH_CONN:~/telegram_forwarder/
ssh $SSH_CONN "chmod +x ~/telegram_forwarder/start_telegram_service.sh"

# Create a restart script
echo "Creating restart script..."
cat > restart_telegram_service.sh << EOF
#!/bin/bash
# Kill existing screen session if it exists
screen -S telegram_forwarder -X quit >/dev/null 2>&1 || true
# Start a new screen session
screen -dmS telegram_forwarder ~/telegram_forwarder/start_telegram_service.sh
echo "Telegram forwarder service started in screen session"
echo "To attach to the session: screen -r telegram_forwarder"
EOF

scp restart_telegram_service.sh $SSH_CONN:~/
ssh $SSH_CONN "chmod +x ~/restart_telegram_service.sh"

# Start the service
echo "Starting the service..."
ssh $SSH_CONN "~/restart_telegram_service.sh"

echo "Cleaning up temporary files..."
rm -f vps_env start_telegram_service.sh restart_telegram_service.sh

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
echo "To check if the service is running:"
echo "ssh $SSH_CONN 'screen -ls'"
echo ""
echo "To view the service logs:"
echo "ssh $SSH_CONN 'screen -r telegram_forwarder'"
echo "(Press Ctrl+A, then D to detach from the screen)"
echo ""
echo "To restart the service:"
echo "ssh $SSH_CONN '~/restart_telegram_service.sh'" 