import { Transform } from "stream";

export class VolumeTransformer extends Transform {
	private leftoverBuffer = Buffer.alloc(0);

	public constructor(
		private volume: number = 1.0
	) {
		super();
	}

	public _transform(chunk: Buffer, encoding: string, callback: Function) {
		const out = Buffer.concat([this.leftoverBuffer, chunk]);
		this.leftoverBuffer = Buffer.alloc(0);
	
		let i = 0;
		for (; i <= out.length - 2; i += 2) {
			let sample = out.readInt16LE(i);
			let adjustedSample = sample * this.volume;
			adjustedSample = Math.floor(adjustedSample);
			adjustedSample = Math.max(-32768, Math.min(32767, adjustedSample));
			out.writeInt16LE(adjustedSample, i);
		}
	
		if (i < out.length) {
			this.leftoverBuffer = out.slice(i);
		}
	
		this.push(out.slice(0, i));
		callback();
	}
}