import { getInfo } from "@ipmanlk/spotify-grab";
import { Track } from "../types/types";

export const getTracks = async (
	spotifyUrl: string
): Promise<Array<Track> | undefined> => {
	const data = await getInfo(spotifyUrl).catch((error) => {
		throw error;
	});

	if (!data || !data.type) {
		throw "Unable to retrieve spotify tracks!.";
	}

	const dataType = data.type;

	switch (dataType) {
		case "track":
			if (data.track) {
				return [
					{
						name: data.track.name,
						duration: data.track.duration ? data.track.duration : false,
						url: data.track.uri ? data.track.uri : "",
						type: "Spotify",
					},
				];
			}
		case "artist":
			if (data.artist) {
				return data.artist.tracks.map((track) => {
					return {
						name: track.name,
						duration: track.duration,
						url: track.uri ? track.uri : "",
						type: "Spotify",
					} as Track;
				});
			}
			break;
		case "album":
			if (data.album && data.album.tracks) {
				return data.album.tracks.map((track) => {
					return {
						name: track.name,
						duration: track.duration,
						url: track.uri ? track.uri : "",
						type: "Spotify",
					} as Track;
				});
			}
			break;
		case "playlist":
			if (data.playlist && data.playlist.tracks) {
				return data.playlist.tracks.map((track) => {
					return {
						name: track.name,
						duration: track.duration,
						url: track.uri ? track.uri : "",
						type: "Spotify",
					} as Track;
				});
			}
			break;
	}
};
