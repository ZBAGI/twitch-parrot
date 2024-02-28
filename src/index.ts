import { config } from "dotenv";
import { promises as fs } from "fs";
import { EOL } from "os";
import path from "path";

import { VoiceId } from "@aws-sdk/client-polly";

import { Audio } from "./audio";
import { Chat } from "./chat/chat";

process.on("uncaughtException", async (e) => {
	const dateString = (new Date()).toISOString().replace(/[:T-]/g, "_").split(".")[0];
	const crashFilename = `crash_${dateString}.txt`;
  
	const folderPath = path.join(process.cwd(), "errors");
	const filePath = path.join(folderPath, crashFilename);
  
	try {
		await fs.mkdir(folderPath, { recursive: true });
		await fs.writeFile(filePath, `${e.name}${EOL}${e.message}${EOL}${EOL}${e.stack}`);
	} catch (error) {
		console.error("Error saving the file:", error);
	}

	console.error(e);
	process.stdin.resume();
});

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

const audio = new Audio({
	region: AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_ACCESS_SECRET
	}
});

const chat = new Chat(TWITCH_CHANNEL);

chat.command({
	command: SAY_COMMAND, 
	cooldown: SAY_COOLDOWN,
	shouldTrigger: (user, message, isModerator) => {
		if(!isModerator && SAY_MAX_LENGTH) {
			if(message.length > SAY_MAX_LENGTH) {
				console.log(`Ignoring '${user}' command '${SAY_COMMAND}' due to message length (${message.length} characters).`);
					return false;
			}
		}
		return true;
	},
	onTrigger: async (user, message, isModerator) => {
		const msg = `${user} ${SAY_CONCAT_TEXT} ${message}`;
		console.log((isModerator ? "[MOD] " : "") + msg);
		await audio.say(msg, SAY_DEFAULT_VOICE);
	}
});
