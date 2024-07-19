import { FileMap } from "./file-map";

export class Pronunciation extends FileMap<string, string> {
	public apply(text: string): string {
		const words = text.split(" ");
		const replacedWords = words.map(word => {
			let lowerCaseWord = word.toLowerCase();
			// Common case of the pronunciation is user nicknames, but if we pronounce ABC as CC we need also pronounce @ABC as @CCC
			lowerCaseWord = lowerCaseWord.startsWith("@") ? lowerCaseWord.slice(1) : lowerCaseWord;
			return this.get(lowerCaseWord) || word;
		});
		
		return replacedWords.join(' ');
	}

	public urlsToDomains(text: string, template: string): string {
		const urlRegex = /https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/g;
		return text.replace(urlRegex, (match, p1) => template.replace("X", p1));
	}

	override get(key: string): string | undefined {
		return super.get(key.toLocaleLowerCase());
	}

	override has(key: string): boolean {
		return super.has(key.toLocaleLowerCase());
	}

	override delete(key: string): boolean {
		return super.delete(key.toLocaleLowerCase());
	}

	override set(key: string, value: string): this {
		return super.set(key.toLocaleLowerCase(), value.toLocaleLowerCase());
	}
}