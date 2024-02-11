const onError = (e) => {
	console.error("There was an uncaught error", e);
	console.error("PARROT DIED :(");
	process.stdin.setRawMode(true);
    process.stdin.resume();
};
process.on("uncaughtException", onError);

require("dotenv").config();
const elevenLabs = require("elevenlabs-node");
const sound = require("sound-play");
const twitch = require("twitch-js");
const { Mutex } = require("async-mutex");

const username = process.env.USERNAME;
const token = process.env.TWITCH_TOKEN;
const apiKey = process.env.ELEVENLABS_APIKEY;
const cooldown = process.env.COOLDOWN ?? 60;
const msgVoiceId = process.env.MSG_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB";
const usrVoiceId = process.env.USR_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB";
const command = process.env.COMMAND ?? "!say";
const volume = !process.env.VOLUME ? 1 : Number.parseFloat(process.env.VOLUME);
const maxLength = !process.env.MAX_LENGTH ? 200 : Number.parseInt(process.env.MAX_LENGTH);

if(!username || !apiKey || !token)
	throw new Error("Missing configuration file '.env'");

const voice = new elevenLabs({
	apiKey
});
const chat = new twitch.Chat({
	username,
	token,
	log: {
		level: "warn"
	}
});

const lastMsg = {};
const lock = new Mutex();

(async () => {
	await chat.connect();
	await chat.join(username);
	console.log("Parrot is now listening...");
	chat.on("PRIVMSG", async (event) => {
		if(!event.message.startsWith(command))
			return;

		const msg = event.message.substring(command.length).trim();

		if(maxLength && msg.length > maxLength) {
			console.log("ignoring " + event.username + " due to message length.");
			return;
		}

		const thisUsrLastMsg = lastMsg[event.username];
		if(thisUsrLastMsg) {
			const secAgo = ((new Date).getTime() - thisUsrLastMsg.getTime()) / 1000;
			if(secAgo <= cooldown) {
				console.log("ignoring " + event.username + " due to cool-down period.");
				return;
			}
		}

		const release = await lock.acquire();
		try {
			console.log(event.username + " said " + msg);
			lastMsg[event.username] = new Date();
			await Promise.all([
				voice.textToSpeech({
					fileName: process.cwd() + "/usr.mp3",
					textInput: event.username + " said",
					voiceId: usrVoiceId
					
				}),
				voice.textToSpeech({
					fileName: process.cwd() + "/msg.mp3",
					textInput: msg,
					voiceId: msgVoiceId
				})
			]);

			await sound.play(process.cwd() + "/usr.mp3", volume);
			await sound.play(process.cwd() + "/msg.mp3", volume);
		} finally {
			release();
		}
	});
})().catch(onError);
