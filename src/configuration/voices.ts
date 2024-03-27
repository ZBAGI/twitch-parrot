import { VoiceId } from "@aws-sdk/client-polly";

import { FileMap } from "./file-map";

export class Voices extends FileMap<string, VoiceId> {
	public apply(text: string): string {
		const words = text.split(" ");
		const replacedWords = words.map(word => {
			const lowerCaseWord = word.toLowerCase();
			if (this.has(lowerCaseWord))
				return this.get(lowerCaseWord) || word;
			return word;
		});
		
		return replacedWords.join(' ');
	}
}