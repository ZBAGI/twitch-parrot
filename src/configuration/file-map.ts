import { existsSync, readFileSync, writeFileSync } from "fs";
import { EOL } from "os";

export class FileMap<Key, Value> extends Map<Key, Value> {
	private filePath: string;

	constructor(path: string) {
		super();
		this.filePath = path;
		this.load();
	}

	private load(): void {
		if (!existsSync(this.filePath))
			writeFileSync(this.filePath, "{" + EOL + EOL +" }", "utf-8");

		const fileContent = readFileSync(this.filePath, "utf-8");
		const configObject = JSON.parse(fileContent || "{}");
		for (const [key, value] of Object.entries(configObject)) {
			this.set(key as unknown as Key, value as Value);
		}
	}

	private save(): void {
		const configObject = Object.fromEntries(this);
		const fileContent = JSON.stringify(configObject, null, 2);
		writeFileSync(this.filePath, fileContent, "utf-8");
	}

	override set(key: Key, value: Value): this {
		super.set(key, value);
		this.save();
		return this;
	}

	override delete(key: Key): boolean {
		const result = super.delete(key);
		this.save();
		return result;
	}
}