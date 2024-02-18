import { config } from "dotenv";

import { VoiceId } from "@aws-sdk/client-polly";

import { Chat } from "./chat/chat";
import { TTS } from "./tts";

config();

const TWITCH_CHANNEL = process.env.TWITCH_CHANNEL;

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_ACCESS_SECRET = process.env.AWS_ACCESS_SECRET;
const AWS_REGION = process.env.AWS_REGION || "eu-west-1";

const SAY_COMMAND = process.env.SAY_COMMAND || "!say";
const SAY_CONCAT_TEXT = process.env.SAY_CONCAT_TEXT || "said";
const SAY_DEFAULT_VOICE: VoiceId = (process.env.SAY_DEFAULT_VOICE as VoiceId) ?? "Brian";
const SAY_COOLDOWN = process.env.SAY_COOLDOWN ? Number.parseInt(process.env.SAY_COOLDOWN) : undefined;
const SAY_MAX_LENGTH = process.env.SAY_MAX_LENGTH ? Number.parseInt(process.env.SAY_MAX_LENGTH) : undefined;

if(!AWS_ACCESS_KEY)
	throw new Error("Missing AWS_ACCESS_KEY");

if(!AWS_ACCESS_SECRET)
	throw new Error("Missing AWS_ACCESS_SECRET");

if(!TWITCH_CHANNEL)
	throw new Error("Missing TWITCH_CHANNEL");

const tts = new TTS({
	region: AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_ACCESS_SECRET
	}
});

const chat = new Chat(TWITCH_CHANNEL);
chat.onCommand(SAY_COMMAND, async (user, message, isModerator) => {
	const msg = `${user} ${SAY_CONCAT_TEXT} ${message}`;
	console.log((isModerator ? "[MOD] " : "") + msg);
	await tts.play(msg, SAY_DEFAULT_VOICE);
}, {
	queue: true,
	maxLength: SAY_MAX_LENGTH,
	cooldown: SAY_COOLDOWN
});