# Twitch-Parrot

Twitch-Parrot is a Node.js application designed to bring live text-to-speech (TTS) functionalities to Twitch chats, using ElevenLabs' advanced voice generation API. It allows streamers and viewers to interact in real-time with customizable voice messages, enhancing the streaming experience.

## Features

- **Customizable Command Trigger:** Set a command prefix that, when used in chat, activates the TTS feature.
- **Voice Customization:** Choose from a variety of voices available through ElevenLabs to find the one that best suits your stream's personality.
- **Message Length Control:** Limit the length of messages that can be converted to speech, preventing abuse.
- **Volume Control:** Adjust the TTS volume to match your stream's audio levels.
- **User Cooldown:** Manage how often a viewer can send a TTS message, preventing spam.

## Getting Started

1. Download the latest build from [Twitch-Parrot Releases](https://github.com/ZBAGI/twitch-parrot/releases/download/1.0.1/dist.zip).
2. Unzip the downloaded file to your preferred location.
3. Edit the `.env` file using a text editor of your choice and configure the following settings:

```env
TWITCH_CHANNEL=twitch_channel_you_want_to_listening_to
ELEVENLABS_APIKEY=elevenlabs_api_key_here
COMMAND=!say
VOLUME=1
MAX_LENGTH=0
COOLDOWN=60
MSG_VOICE_ID=pNInz6obpgDQGcFmaJgB
USR_VOICE_ID=pNInz6obpgDQGcFmaJgB
```
- **TWITCH_CHANNEL:** Twitch username.
- **ELEVENLABS_APIKEY:** Your ElevenLabs API key, required for voice generation. To obtain your API key, follow these steps:
    1. Visit [ElevenLabs](https://elevenlabs.io/) and log in to your account.
    2. Click on your profile picture in the left bottom corner of the page.
    3. Select "Profile" from the menu.
    4. Find the section labeled "API Key" on your profile page.
    5. Copy the API key provided and paste it into the `.env` file.
- **COMMAND:** The command prefix for activating TTS in chat.
- **VOLUME:** TTS volume (1 represents 100% volume).
- **MAX_LENGTH:** Maximum length of messages to be read. Set to 0 for no limit.
- **COOLDOWN:** How often a user can send a TTS message, in seconds.
- **MSG_VOICE_ID & USR_VOICE_ID:** Voice ID from ElevenLabs for TTS.


### Enjoy !
