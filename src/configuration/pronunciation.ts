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
}