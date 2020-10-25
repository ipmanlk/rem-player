export type PlayerErrorCode =
	| "queueFull"
	| "queueEmpty"
	| "trackNotFound"
	| "trackSkipEmpty"
	| "noDispatcher"
	| "keywordEmpty"
	| "invalidPositions"
	| "queueNotPaused"
	| "invalidFilter"
	| "noActiveFilter"
	| "alreadyActiveFilter";

export interface PlayerError {
	code: PlayerErrorCode;
	description?: string;
}

export interface Track {
	name: string;
	type: "spotify" | "themesmoe" | "youtube" | "mp3hunter";
	uri: string;
	getYtUrl?(keywordOrUrl?: string): Promise<string | false>;
	seekedTime?: number;
	duration?: number;
	artist?: string;
	show?: string;
}

export type State = "playing" | "paused" | "stopped";
