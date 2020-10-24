export type PlayerErrorCode =
	| "queueFull"
	| "queueEmpty"
	| "trackNotFound"
	| "trackSkipEmpty"
	| "noDispatcher"
	| "keywordEmpty"
	| "invalidPositions"
	| "queueNotPaused";

export interface PlayerError {
	code: PlayerErrorCode;
	description?: string;
}

export interface Track {
	name: string;
	type: "spotify" | "themes.moe" | "youtube";
	uri: string;
	getYtUrl?(keywordOrUrl?: string): Promise<string | false>;
	seekedTime?: number;
	duration?: number;
	artist?: string;
	show?: string;
}

export interface DatabaseRecord {
	key: string;
	tracks: Array<Track>;
}

export type State = "playing" | "paused" | "stopped";
