# Telegram-Bots-Lunar-Date
Convert date between Gregorian calendar and Lunar

## Constants Description
Replace these field with your information.

### `TOKEN`
- Description: Your telegram Bot API token.
- Usage: This token is used to authenticate requests to the Telegram Bot API.

### `BASE_URL`
- Description: Base URL for Telegram Bot API requests.
- Usage: This URL is used to construct API endpoints for sending requests to the Telegram Bot API.
  
### `chat_ID`
- Description: Default chat ID of the user or group where the bot sends messages when it can not get the chat id of the message sender (ornot).

### `DEPLOYED_URL`
- Description: URL of the deployed Google Apps Script web app.
- Usage: This URL is used as an endpoint for receiving incoming messages and processing bot commands.

## Usage
To use this Telegram Lunar Date Bot:

1. Set up a Google Sheets spreadsheet to store expense data. Sample sheet as the image in sheet-preview.png.
2. Replace the constants in the code with your own values.
3. Deploy the Google Apps Script web app using the provided code.
   - Replace TOKEN with your bot token.
   - Replace `chat_ID` with your desired default chat ID. You can get the chat ID where messages are sent by using `getChatId()` function. Remember to `deleteWebhook()` first.
   - Deploy.
   - Get the deploy url in the popup. Replace `DEPLOYED_URL` with your received url.
   - Run `setWebhook()`.
4. Or simply try my bot [here](https://t.me/lunar_date_bot).

## Setup Google Sheets

### `Users` sheet
Your file must contain a sheet named "Users", where data of users are saved.

* 1st column is for indexing.
* 2nd column stores user id.
* 3rd column stores user name.
* 4th column saves the first time user interacts with the bot (UTC time).
* 5th column saves the latest time user interacts with the bot (UTC time).

### `NotificationLock` sheet
This sheet is IMPORTANT if you want to automatically send notification to users (Check `Server -> Client only` part in `main.gs` for more detail).
The sheet contains only 1 number presenting the LOCK, this value should be increased each time you send a notification.
To successfully send a notification, this value must be equal to a KEY in script, which is a const named `notificationKey`. This value is static meanwhile you need to change it manually to match the LOCK each time you want to send something.
