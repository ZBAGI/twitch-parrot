import * as crypto from "crypto";
import Speaker from "speaker";
import { PassThrough, Readable } from "stream";

import {
	PollyClient, PollyClientConfig, SynthesizeSpeechCommand, VoiceId
} from "@aws-sdk/client-polly";

import { VolumeTransformer } from "./volume-transformer";

export class Audio {
	private polly: PollyClient;
	private cache: Map<string, Buffer[]> = new Map();

	constructor(
		awsConfig: PollyClientConfig,
	) {
		this.polly = new PollyClient(awsConfig);
	}

	private getCacheKey(text: string, voiceId: VoiceId): string {
		const hash = crypto.createHash('sha256');
		hash.update(text + voiceId);
		return hash.digest('hex');
	}

	private cloneReadable(original: Readable): [Readable, Readable] {
		const clone1 = new PassThrough();
		const clone2 = new PassThrough();
	
		original.on("data", chunk => {
			clone1.write(chunk);
			clone2.write(chunk);
		});
		original.on("end", () => {
			clone1.end();
			clone2.end();
		});
		original.on("error", err => {
			clone1.emit("error", err);
			clone2.emit("error", err);
		});
	
		return [clone1, clone2];
	}

	private async addCache(text: string, voiceId: VoiceId, stream: Readable): Promise<Readable> {
		const key = this.getCacheKey(text, voiceId);
		const data: Buffer[] = [];
		const streams = this.cloneReadable(stream);

		for await (const chunk of streams[0]) {
			data.push(chunk as Buffer);
		}
		this.cache.set(key, data);

		return streams[1];
	}

	private getStreamFromCache(text: string, voiceId: VoiceId): Readable | undefined {
		const key = this.getCacheKey(text, voiceId);
		const data = this.cache.get(key);
		if (!data)
			return undefined;

		return Readable.from(data);
	}

	private sanitizeMessage(text: string): string {
		return text.replace(/([!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])\1+/g, "$1");
	}

	public async getStream(text: string, voiceId: VoiceId, useCache: boolean = false): Promise<Readable> { 
		let stream: Readable | undefined;

		if(useCache)
			stream = this.getStreamFromCache(text, voiceId);

		if(!stream) {
			stream = await this.getStreamFromRequest(text, voiceId);

			if(useCache)
				return this.addCache(text, voiceId, stream);
		}

		return stream;
	}

	private async getStreamFromRequest(text: string, voiceId: VoiceId): Promise<Readable> {
		const command = new SynthesizeSpeechCommand({
			Text: this.sanitizeMessage(text),
			TextType: "text",
			VoiceId: voiceId,
			SampleRate: "16000",
			OutputFormat: "pcm"
		});
		const response = await this.polly.send(command);

		return response.AudioStream as Readable;
	}

	public play(stream: Readable, volume: number = 1.0): Promise<void> {
		return new Promise((resolve, reject) => {
			const speaker = new Speaker({
				channels: 1,
				sampleRate: 16000
			});
			const volumeTransformer = new VolumeTransformer(volume);
	
			stream.pipe(volumeTransformer).pipe(speaker);

			speaker.on("close", resolve);
			speaker.on("error", reject);
		});
	}
}