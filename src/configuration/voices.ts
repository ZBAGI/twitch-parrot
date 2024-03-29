import { VoiceId } from "@aws-sdk/client-polly";

import { FileMap } from "./file-map";

export class Voices extends FileMap<string, VoiceId> {
}