import { existsSync, readFileSync, writeFileSync } from "fs";

export class Pronunciation {
	private map: Map<string, string>;
	private filePath: string;

	public constructor(path: string) {
		this.filePath = path;
		this.map = new Map<string, string>();
		this.load();
	}

	private load(): void {
		if (!existsSync(this.filePath))
			writeFileSync(this.filePath, "{}", "utf-8");

		const fileContent = readFileSync(this.filePath, "utf-8");
		const configObject = JSON.parse(fileContent || "{}"); // Default to an empty object if file is empty
		for (const [key, value] of Object.entries(configObject)) {
			if(typeof value != "string")
				throw new Error("Failed to load value " + value + " is not a valid string.");

			this.map.set(key.toLowerCase(), value.toLowerCase());
		}
	}

	private save(): void {
		const configObject = Object.fromEntries(this.map);
		const fileContent = JSON.stringify(configObject, null, 2);
		writeFileSync(this.filePath, fileContent, "utf-8");
	}

	public apply(text: string): string {
		const words = text.split(" ");
		const replacedWords = words.map(word => {
			const lowerCaseWord = word.toLowerCase();
			if (this.map.has(lowerCaseWord))
				return this.map.get(lowerCaseWord) || word;
			return word;
		});
		
		return replacedWords.join(' ');
	}

	public set(key: string, value: string): void {
		this.map.set(key.toLowerCase(), value.toLowerCase());
		this.save();
	}

	public remove(key: string): boolean {
		if (this.map.has(key)) {
			this.map.delete(key);
			this.save();
			return true;
		}

		return false;
	}
}