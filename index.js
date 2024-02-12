const onError = (e) => {
	console.error(e);
	console.error("PARROT DIED :(");
	process.stdin.setRawMode(true);
    process.stdin.resume();
};
process.on("uncaughtException", onError);

require("dotenv").config();
const elevenLabs = require("elevenlabs-node");
const sound = require("sound-play");
const WebSocket = require("ws");
const { Mutex } = require("async-mutex");

const twitchChannel = process.env.TWITCH_CHANNEL;
const apiKey = process.env.ELEVENLABS_APIKEY;
const cooldown = process.env.COOLDOWN ?? 60;
const msgVoiceId = process.env.MSG_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB";
const usrVoiceId = process.env.USR_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB";
const command = process.env.COMMAND ?? "!say";
const volume = !process.env.VOLUME ? 1 : Number.parseFloat(process.env.VOLUME);
const maxLength = !process.env.MAX_LENGTH ? 200 : Number.parseInt(process.env.MAX_LENGTH);

if(!twitchChannel || !apiKey)
	throw new Error("Missing configuration file '.env'");

const voice = new elevenLabs({
	apiKey
});

const lastMsg = {};
const lock = new Mutex();

const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
ws.on("open", function open() {
	console.log("Parrot is listening...");
	ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
	ws.send(`NICK justinfan${(Math.floor(Math.random() * 10000) + 1)}`);
	ws.send(`JOIN #${twitchChannel}`);
});

ws.on("message", async (data) => {
	if (data.startsWith("PING")) {
		ws.send("PONG :tmi.twitch.tv");
		console.log("Parrot is still listening");
		return;
	}

	if (!data.includes("PRIVMSG"))
		return;

	const displayNameMatch = data.match(/display-name=([^;]*);/);
	const username = displayNameMatch ? displayNameMatch[1] : "unknown";

	const messageMatch = data.match(/PRIVMSG #[^\s]+ :(.+)/);
	const message = messageMatch ? messageMatch[1] : "";

	if(!message.startsWith(command))
		return;

	const msg = message.substring(command.length).trim();

	if(maxLength && msg.length > maxLength) {
		console.log("ignoring " + username + " due to message length.");
		return;
	}

	const thisUsrLastMsg = lastMsg[username];
	if(thisUsrLastMsg) {
		const secAgo = ((new Date).getTime() - thisUsrLastMsg.getTime()) / 1000;
		if(secAgo <= cooldown) {
			console.log("ignoring " + username + " due to cool-down period.");
			return;
		}
	}

	const release = await lock.acquire();
	try {
		console.log(username + " said " + msg);
		lastMsg[username] = new Date();
		await Promise.all([
			voice.textToSpeech({
				fileName: process.cwd() + "/usr.mp3",
				textInput: username + " said",
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

ws.on("error", onError);
ws.on("close", onError);