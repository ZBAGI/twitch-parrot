# Twitch-Parrot

Twitch-Parrot is a Node.js application designed to bring live text-to-speech (TTS) functionalities to Twitch chats, using AWS Polly API. It allows streamers and viewers to interact in real-time with customizable voice messages, enhancing the streaming experience.

## Features

- **Customizable Command Trigger:** Set a command prefix that, when used in chat, activates the TTS feature.
- **Voice Customization:** Choose from a [variety of voices available through AWS Polly](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html) to find the one that best suits your stream's personality.
- **Message Length Control:** Limit the length of messages that can be converted to speech, preventing abuse.
- **User Cooldown:** Manage how often a viewer can send a TTS message, preventing spam.

## Pricing
This project is open-source and can be used for free. AWS Polly's free tier includes 5 million characters per month for speech or Speech Marks requests for the first 12 months, starting from your first request for speech.
[All current prices for AWS Polly can be found on the AWS website.](https://aws.amazon.com/polly/pricing/)
You can monitor your character usage on the [AWS Billing and Cost Management, Budgets, and Planning page](https://console.aws.amazon.com/billing/home#/freetier).

## Getting Started

1. Download the latest build from [Twitch-Parrot Releases](https://github.com/ZBAGI/twitch-parrot/releases/download/2.3.0/release.zip).
2. Unzip the downloaded file to your preferred location.
3. Edit the `.env` file using a text editor of your choice.
- `AWS_ACCESS_KEY` - Taken from your AWS account, see below for step-by-step instructions.
- `AWS_ACCESS_SECRET` - Taken from your AWS account, see below for step-by-step instructions.
- `AWS_REGION` - Which AWS region should be used, choose the closest to you. After logging into AWS, you should see a list of available regions by clicking on the top right corner of the page next to your account nickname.
- `TWITCH_CHANNEL` - Name of the Twitch channel.
- `SAY_COMMAND` - Select prefix text that will trigger TTS.
- `SAY_DEFAULT_VOICE` - Default voice of TTS. [A complete list of available voices can be found on the AWS website](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html).
- `SAY_CONCAT_TEXT` - Additional text used to concatenate the username and what the user wrote.
- `SAY_COOLDOWN` - User-based cooldown, i.e., how often a user can use the say command (in seconds), 0 to disable cooldown. Note: Mods ignore cooldown.
- `SAY_MAX_LENGTH` - What is the maximum amount of characters used in the say command, messages longer than this option will be ignored. (0 to disable limit)

## How to get AWS access key and secret

1. [Go to AWS and create a new user (if you don't have one yet).](https://aws.amazon.com/free)
2. [Go to the AWS IAM Dashboard.](https://console.aws.amazon.com/iam/home)
3. Select Users from the menu on the left.
4. Create a new user
  - Name it as you wish.
  - Do not check `rovide user access to the AWS Management Console`.
  - Click `Next`
  - Click `Create Group`
  - Search for `AmazonPollyFullAccess` and check box next to it.
  - Name `User group name` ( as you wish, for example. `Polly administrator` )
  - Click `Create user group`
  - Select group you just created ( check box next to it )
  - Click `Create user`
5. Click on the name of the user you just created.
6. Select `Security credentials` tab.
7. Scroll down to `Access Key` and click `Create access key`.
  - Select `Third-party service` and `I understadn the above recommendation and want to proceed to create an access key.`
  - Click `Next`
  - Select your description you wish (can be empty)
  - Click `Create access key`

You are done, you should be seeing both `Access key` and `Secret` on this page which needs to be added into the `.env` file. Remember to copy the secret because you will not be able to recover it (only create a new one).
**NOTICE:** Do not expose your secret and key on the stream. If you have exposed it, go to the keys section, remove it, and add it again, which will generate a new access key and secret.

### Enjoy !
