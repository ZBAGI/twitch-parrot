import { Mutex } from "async-mutex";
import { EventEmitter } from "stream";
import WebSocket from "ws";

import { ChatEvent } from "./chat-event";

export class Chat {
	public ws: WebSocket;
	private event: EventEmitter;
	private commandLock: Mutex;

	constructor(twitchChannelName: string) {
		this.event = new EventEmitter();
		this.ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
		this.ws.on("open", ()=> {
			this.ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
			this.ws.send(`NICK justinfan${(Math.floor(Math.random() * 10000) + 1)}`);
			this.ws.send(`JOIN #${twitchChannelName}`);
			console.log(`Connected to '${twitchChannelName}'.`);
		});

		this.ws.on("message", async (data) => {
			if(!data)
				return;
		
			const str = data.toString();
			if (str.startsWith("PING")) {
				this.emit("ping");
				return;
			}
		
			if (str.includes("PRIVMSG")) {
				const displayNameMatch = str.match(/display-name=([^;]*);/);
				const username = displayNameMatch ? displayNameMatch[1] : "unknown";
			
				const messageMatch = str.match(/PRIVMSG #[^\s]+ :(.+)/);
				const message = messageMatch ? messageMatch[1] : "";
				
				const badgesMatch = str.match(/badges=([^;]*);/);
				const isBroadcaster = badgesMatch ? badgesMatch[1].includes("broadcaster/1") : false;

				const modMatch = str.match(/mod=(\d);/);
				const isModerator = modMatch ? modMatch[1] === "1" : false;

				this.emit("userMessage", username, message, isModerator || isBroadcaster);
			}
		});

		this.on("ping", async () => {
			this.ws.send("PONG :tmi.twitch.tv");
		});

		this.commandLock = new Mutex();
	}

	public command(opt: {
		command?: string,
		shouldTrigger?: (username: string, message: string, isModerator: boolean) => boolean,
		onTrigger: (username: string, message: string, isModerator: boolean, args: string[] | undefined) => Promise<void>,
		cooldown?: number
	}): this {
		const lastMessage: { [username: string]: Date } = {};
			
		this.on("userMessage", async (username, message, isModerator) => {
			if(opt.command && !message.startsWith(opt.command))
				return;

			const sanitizedMessage = message.substring(opt.command?.length ?? 0).replace(/ +/g, " ").trim();
			
			if(opt.shouldTrigger && !opt.shouldTrigger(username, sanitizedMessage, isModerator))
				return;

			if(!isModerator && opt.cooldown) {
				const thisUsrLastMsg = lastMessage[username];
				if(thisUsrLastMsg) {
					const secAgo = ((new Date).getTime() - thisUsrLastMsg.getTime()) / 1000;
					const leftSec = opt.cooldown - secAgo;
					if(leftSec > 0) {
						console.log(`Ignoring '${username}' command '${opt.command ?? "NONE"}' due to cool-down period (${leftSec.toFixed(2)} sec left).`);
						return;
					}
				}
			}

			const release = await this.commandLock.acquire();
			try {
				lastMessage[username] = new Date();
				const args = sanitizedMessage.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(arg => arg.replace(/"/g, ''));
				await opt.onTrigger(username, sanitizedMessage, isModerator, args);
			} finally {
				if(release)
					release();
			}
		});
		return this;
	}

	public on<EventName extends keyof ChatEvent>(eventName: EventName, callback: ChatEvent[EventName]): this {
		this.event.on(eventName, callback);
		
		return this;
	}

	private emit<EventName extends keyof ChatEvent>(eventName: EventName, ...args: Parameters<ChatEvent[EventName]>): void {
		this.event.emit(eventName, ...args);
	}
}