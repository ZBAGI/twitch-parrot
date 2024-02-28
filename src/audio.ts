import Speaker from "speaker";

import {
	PollyClient, PollyClientConfig, SynthesizeSpeechCommand, VoiceId
} from "@aws-sdk/client-polly";

export class Audio {
	private polly: PollyClient;

	constructor(
		awsConfig: PollyClientConfig
	) {
		this.polly = new PollyClient(awsConfig);
	}

	public async say(text: string, voiceId: VoiceId): Promise<void> {
		const command = new SynthesizeSpeechCommand({
			Text: text,
			TextType: "text",
			VoiceId: voiceId,
			SampleRate: "16000",
			OutputFormat: "pcm"
		});

		const data = await this.polly.send(command);
		(data.AudioStream as any).pipe(new Speaker({
			channels: 1,
			sampleRate: 16000
		}));
	}
}