import { config } from "dotenv";
import { promises as fs } from "fs";
import { EOL } from "os";
import path from "path";

import { VoiceId } from "@aws-sdk/client-polly";

import { Audio } from "./audio";
import { Chat } from "./chat/chat";
import { Pronunciation } from "./pronunciation";

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
const basePath = (<any>process).pkg ? path.dirname(process.execPath) : path.join(__dirname, "../");
const pronunciation = new Pronunciation(path.join(basePath, "pronunciation.json"));

const TWITCH_CHANNEL = process.env.TWITCH_CHANNEL;

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_ACCESS_SECRET = process.env.AWS_ACCESS_SECRET;
const AWS_REGION = process.env.AWS_REGION || "eu-west-1";

const SAY_COMMAND = process.env.SAY_COMMAND || undefined;
const SAY_COMMAND_PRONOUNCE = process.env.SAY_COMMAND_PRONOUNCE || undefined;
const SAY_VOLUME = process.env.SAY_VOLUME ? Number.parseInt(process.env.SAY_VOLUME)/100 : 1.0;
const SAY_CONCAT_TEXT = process.env.SAY_CONCAT_TEXT || "said";
const SAY_DEFAULT_VOICE: VoiceId = (process.env.SAY_DEFAULT_VOICE as VoiceId) ?? "Brian";
const SAY_COOLDOWN = process.env.SAY_COOLDOWN ? Number.parseInt(process.env.SAY_COOLDOWN) : undefined;
const SAY_MAX_LENGTH = process.env.SAY_MAX_LENGTH ? Number.parseInt(process.env.SAY_MAX_LENGTH) : undefined;

if(SAY_VOLUME > 2 || SAY_VOLUME < 0)
	throw new Error("SAY_VOLUME must be number between 200 and 0");

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
				console.log(`Ignoring TTS of '${user}' due to message length (${message.length} characters).`);
					return false;
			}
		}
		return !message.startsWith("!") && !message.startsWith("/");
	},
	onTrigger: async (user, message, isModerator) => {
		const userSaid = `${user} ${SAY_CONCAT_TEXT}`;
		console.log((isModerator ? "[MOD] " : "") + userSaid + " " + message);

		const customUserSaidPronunciation = pronunciation.apply(userSaid);
		const shouldCache = userSaid == customUserSaidPronunciation;
		await audio.say(customUserSaidPronunciation, SAY_DEFAULT_VOICE, SAY_VOLUME, shouldCache);
		
		message = pronunciation.apply(message);
		await audio.say(message, SAY_DEFAULT_VOICE, SAY_VOLUME);
	}
});

if(SAY_COMMAND_PRONOUNCE) {
	chat.command({
		command: SAY_COMMAND_PRONOUNCE, 
		shouldTrigger: (user, message, isModerator) => {
			return isModerator;
		},
		onTrigger: async (user, message, isModerator, args) => {
			if(args?.length != 2) {
				console.log("Moderator "+user+" failed to change pronunciation due to wrong amount of arguments provided.");
				return;
			}

			const msg = "Moderator "+user+" changed pronunciation of; " + pronunciation.apply(args[0]) + "; to; " + args[1];
			console.log(msg);
			await audio.say(msg, SAY_DEFAULT_VOICE, SAY_VOLUME);
			if(args[0] == args[1])
				pronunciation.remove(args[0]);
			else
				pronunciation.set(args[0], args[1])
		}
	});
}