# Telegram Bot Integration Setup

This guide explains how to set up and configure the Telegram bot integration for sending event notifications to users.

## Prerequisites

- A Telegram account
- Access to the internet
- Your application backend running

## Step 1: Create a Telegram Bot

1. Open Telegram and search for the user "BotFather"
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to create a new bot:
   - Provide a name for your bot (e.g., "Events Notification Bot")
   - Provide a username for your bot (must end with "bot", e.g., "events_notification_bot")
4. After successful creation, BotFather will provide you with a **token** - save this token as you'll need it later
5. Optionally, you can use commands like `/setdescription`, `/setabouttext`, and `/setuserpic` to customize your bot

## Step 2: Configure Your Application

1. In the backend directory, create or edit the `.env` file
2. Add the following configuration:

```
# Telegram Bot Settings
TELEGRAM_BOT_TOKEN=your_bot_token_here
ENABLE_TELEGRAM=True
BASE_URL=http://your-frontend-url.com
```

3. Replace `your_bot_token_here` with the token provided by BotFather
4. Replace `http://your-frontend-url.com` with the URL of your frontend application

## Step 3: User Connection

For users to receive notifications, they need to:

1. Set their Telegram username in their profile
2. OR connect directly to the bot and authenticate

### Option 1: Setting Telegram Username

Users can set their Telegram username in their profile settings:

1. Open their profile page
2. Click "Edit" 
3. Enter their Telegram username in the designated field
4. Save changes

### Option 2: Direct Bot Connection (Future Enhancement)

We plan to implement a direct connection method where users can:

1. Open the bot in Telegram
2. Send a command like `/connect`
3. Receive a unique code
4. Enter this code in the application to link their Telegram account

## Troubleshooting

- **No notifications are being sent**: Check that the `TELEGRAM_BOT_TOKEN` is correct and the bot is running
- **Missing token error**: Ensure you've added the token to your `.env` file
- **Users not receiving messages**: Verify that they have set their Telegram username correctly or have connected to the bot

## Security Considerations

- Keep your bot token secure and never share it publicly
- The bot token in the `.env` file grants access to send messages through your bot
- Consider setting up rate limiting to prevent abuse

For more information, refer to the [Telegram Bot API documentation](https://core.telegram.org/bots/api). 