import { EventEmitter } from "events";
import {
	VoiceConnection,
	TextChannel,
	StreamDispatcher,
	VoiceChannel,
} from "discord.js";
import ytdl from "ytdl-core-discord";
import * as youtube from "./sites/youtube";
import * as themesMoe from "./sites/themes.moe";
import { moveIndex } from "./utils/utils";
import { Track, State, PlayerError } from "./types/types";

export class RemPlayer extends EventEmitter {
	private queue: Array<Track> = [];
	private voiceConnection: VoiceConnection;
	private textChannel: TextChannel;
	private dispatcher: StreamDispatcher | null = null;
	private currentTrack: Track | null = null;
	private state: State = "stopped";
	private loopQueue: boolean = false;

	constructor(voiceConnection: VoiceConnection, textChannel: TextChannel) {
		super();
		this.voiceConnection = voiceConnection;
		this.textChannel = textChannel;
	}

	getQueue(): Array<Track> {
		return this.queue;
	}

	setQueue(queue: Array<Track>) {
		this.queue = queue;
	}

	getState(): State {
		return this.state;
	}

	getCurrentTrack(): Track | null {
		return this.currentTrack;
	}

	getTextChannel(): TextChannel {
		return this.textChannel;
	}

	getVoiceChannel(): VoiceChannel {
		return this.voiceConnection.channel;
	}

	playYoutubeTracks(keywordOrUrl: string): void | PlayerError {
		// if state is not paused and keywordOrUrl is not provided
		if (!keywordOrUrl || keywordOrUrl.trim() == "") {
			return { code: "keywordEmpty" };
		}

		youtube
			.getTracks(keywordOrUrl)
			.then((track) => {
				// push to global tracks
				this.addTracksToQueue(track);
				// start playing first track if state is stopped
				if (this.state === "stopped") this.playTrack();
			})
			.catch((e) => {
				this.emit("youtubeFailed");
				this.emit("error", e);
			});
	}

	playAnimeTracks(animeName: string): void | PlayerError {
		// if anime name is not provided
		if (!animeName || animeName.trim() == "") {
			return { code: "keywordEmpty" };
		}

		themesMoe
			.getTracks(animeName)
			.then((tracks) => {
				this.addTracksToQueue(tracks);
				if (!this.state) this.playTrack();
			})
			.catch((e) => {
				this.emit("themesMoeFailed");
				this.emit("error", e);
			});
	}

	playThemesMoeTracks(): void {}

	addTracksToQueue(tracks: Array<Track>): Track | number | PlayerError {
		if (this.queue.length <= 100) {
			this.queue = [...this.queue, ...tracks];
			if (tracks.length == 1) {
				this.emit("trackAdded", tracks[0]);
				return tracks[0];
			} else {
				this.emit("tracksAdded", tracks.length);
				return tracks.length;
			}
		} else {
			this.emit("queueFull");
			return { code: "queueFull" };
		}
	}

	play(): void | PlayerError {
		if (this.state === "stopped" && this.queue.length > 0) {
			this.playTrack();
		} else {
			if (this.dispatcher) {
				if (this.state === "paused") {
					this.resume();
					this.state = "playing";
				} else {
					return { code: "queueNotPaused" };
				}
			} else {
				return { code: "noDispatcher" };
			}
		}
	}

	pause(): void | PlayerError {
		if (this.dispatcher) {
			this.dispatcher.pause();
			this.state = "paused";
		} else {
			return { code: "noDispatcher" };
		}
	}

	stop(): void | PlayerError {
		if (this.dispatcher) {
			this.dispatcher.destroy();
			this.queue = [];
			this.state = "stopped";
			this.currentTrack = null;
		} else {
			return { code: "noDispatcher" };
		}
	}

	removeTrack(position: number): void | PlayerError {
		if (this.queue[position]) {
			const trackIndex = position - 1;
			this.queue = this.queue.filter((t, index) => index !== trackIndex);
			this.emit("trackRemoved");
		} else {
			return { code: "trackNotFound" };
		}
	}

	moveTrack(currentPosition: number, newPosition: number): void | PlayerError {
		const currentIndex = currentPosition - 1;
		const newIndex = newPosition - 1;

		// if given positions are invalid
		if (!this.queue[currentIndex] || !this.queue[newIndex]) {
			return { code: "invalidPositions" };
		}

		// move positions
		this.queue = moveIndex(this.queue, currentIndex, newIndex) as Array<Track>;
	}

	skip(position: number | false): void | PlayerError {
		if (this.dispatcher) {
			if (this.queue.length > 0) {
				if (position) {
					this.playTrack(position);
				} else {
					this.playTrack();
					this.emit("trackSkipped");
				}
			} else {
				return { code: "trackSkipEmpty" };
			}
		} else {
			return { code: "noDispatcher" };
		}
	}

	toggleLoopQueue(): boolean {
		// if queue looping is disabled, push current track back to the
		// end of the queue before enabling it.
		if (!this.loopQueue && this.currentTrack) {
			this.queue = [...this.queue, this.currentTrack];
		}
		this.loopQueue = !this.loopQueue;
		return this.loopQueue;
	}

	private async playTrack(position: number | false = false): Promise<void> {
		let track: Track;

		if (!position) {
			// when position is not given, get the first track in the queue
			const firstItem = this.queue.shift();

			// when track is undefined for some reason, jump to next one
			if (!firstItem) {
				this.emit("error", "First track doesn't exist in the queue!.");
				this.playTrack();
				return;
			}

			track = firstItem;
		} else {
			// when position is given
			const trackIndex = position - 1;
			track = this.queue[trackIndex];
			this.queue = this.queue.filter((t, index) => index !== trackIndex);
		}

		// push track back to the end when loopQueue=true
		if (this.loopQueue) this.queue.push(track);

		// set current track
		this.currentTrack = track;

		// remove existing dispatcher if there is one
		if (this.dispatcher) this.dispatcher.destroy();

		if (track.type === "Youtube") {
			// use ytdl to play youtube tracks. Jump to next track if error happens
			try {
				this.dispatcher = this.voiceConnection.play(await ytdl(track.url), {
					type: "opus",
					bitrate: 320,
					volume: false,
				});
			} catch (e) {
				this.playTrack();
			}
		} else {
			// use webm link to play tracks from themes.moe
			this.dispatcher = this.voiceConnection.play(track.url, {
				bitrate: 320,
				volume: false,
			});
		}

		this.state = "playing";

		// emit a new event each time track start playing
		this.emit("nowPlaying", this.currentTrack);

		// when dispatcher is not initialized, stop the player
		if (!this.dispatcher) {
			this.emit("error", { code: "Dispatcher is not initialized" });
			this.stop();
			return;
		}

		// register event listener for the dispatcher
		this.dispatcher.on("finish", () => {
			// if there are tracks to play call playTrack() again
			if (this.queue.length > 0) {
				this.playTrack();
			} else {
				// emit an event and disconnect from voice channel when queue is over
				this.emit("queueFinished");
				this.voiceConnection.disconnect();
			}
		});

		// on dispatcher errors, emit an event
		this.dispatcher.on("error", (e) => this.emit("error", e));
	}

	private resume(): void {
		this.dispatcher?.resume();
	}
}
