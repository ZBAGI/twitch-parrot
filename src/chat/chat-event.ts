export interface ChatEvent {
	userMessage: (user: string, message: string, isModerator: boolean) => Promise<void>;
	ping: () => Promise<void>
}