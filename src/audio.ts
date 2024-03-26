import pcmVolume from "pcm-volume";
import Speaker from "speaker";

import {
	PollyClient, PollyClientConfig, SynthesizeSpeechCommand, VoiceId
} from "@aws-sdk/client-polly";

export class Audio {
	private polly: PollyClient;
	private volume: pcmVolume;

	constructor(
		awsConfig: PollyClientConfig,
		volume: number = 1.0
	) {
		this.polly = new PollyClient(awsConfig);
		this.volume = new pcmVolume();
		this.volume.setVolume(volume);
		console.log(volume);
	}

	public async say(text: string, voiceId: VoiceId, volume: number = 1.0): Promise<void> {
		const command = new SynthesizeSpeechCommand({
			Text: text,
			TextType: "text",
			VoiceId: voiceId,
			SampleRate: "16000",
			OutputFormat: "pcm"
		});

		const data = await this.polly.send(command);
		(data.AudioStream as any).pipe(this.volume).pipe(new Speaker({
			channels: 1,
			sampleRate: 16000
		}));
	}
}