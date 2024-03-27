import * as crypto from "crypto";
import Speaker from "speaker";
import { Readable } from "stream";

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

	private async addCache(text: string, voiceId: VoiceId, stream: Readable): Promise<void> {
		const key = this.getCacheKey(text, voiceId);
		const data: Buffer[] = [];
		for await (const chunk of stream) {
			data.push(chunk as Buffer);
		}
		this.cache.set(key, data);
	}

	private getStreamFromCache(text: string, voiceId: VoiceId): Readable | undefined {
		const key = this.getCacheKey(text, voiceId);
		const data = this.cache.get(key);
		if (!data) {
			return undefined;
		}
		return Readable.from(data);
	}

	private sanitizeMessage(text: string): string {
		return text.replace(/([!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])\1+/g, "$1");
	}

	public async say(text: string, voiceId: VoiceId, volume: number = 1.0, useCache: boolean = false): Promise<void> {
		let stream: Readable | undefined;

		if(useCache)
			stream = this.getStreamFromCache(text, voiceId);

		if(!stream) {
			stream = await this.getStreamFromRequest(text, voiceId);
			if(useCache)
				this.addCache(text, voiceId, stream);
		}

		this.play(stream, volume);
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

	public play(stream: Readable, volume: number = 1.0): void {
		stream.pipe(new VolumeTransformer(volume)).pipe(new Speaker({
			channels: 1,
			sampleRate: 16000
		}));
	}
}