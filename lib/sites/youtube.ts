import fetch from "node-fetch";
import ytdl from "discord-ytdl-core";
import ytsr from "ytsr";
import ytpl from "ytpl";
import { getSecondsFromYtLabel } from "../utils/utils";
import * as cache from "../utils/cache";
import { Track } from "../types/types";

export async function getTracks(keywordOrUrl: string): Promise<Array<Track>> {
	// check cache first
	const cachedTracks = cache.getYoutube(keywordOrUrl);

	if (cachedTracks) {
		return cachedTracks.tracks;
	}

	let youtubeLink: string | false;

	// check if this is a youtube url or not
	const youtubeUrlRegex = new RegExp(
		"^(https?://)?(www.youtube.com|youtu.?be)/.+$"
	);

	if (!youtubeUrlRegex.test(keywordOrUrl)) {
		// find track from youtube
		try {
			const searchResults = (await ytsr(keywordOrUrl, {
				limit: 1,
				safeSearch: false,
			})) as any;

			youtubeLink = searchResults.items[0].link || false;
		} catch (e) {
			youtubeLink = await searchSearx(keywordOrUrl);
		}

		if (!youtubeLink) {
			throw "Sorry!. I couldn't find a track for that keyword!.";
		}
	} else {
		youtubeLink = keywordOrUrl;
	}

	// check if this is a playlist
	if (youtubeLink.indexOf("list=") > -1) {
		const listId = youtubeLink.split("list=")[1];

		const playlist = await ytpl(listId).catch(() => {
			throw "Sorry!. I couldn't load that playlist!.";
		});

		const tracks = playlist.items
			.filter((t) => t.title !== "[Private video]")
			.map((t) => {
				return {
					name: t.title,
					type: "Youtube",
					url: t.url,
					duration: getSecondsFromYtLabel(t.duration || ""),
				};
			});

		// save to cache
		cache.saveYoutube(keywordOrUrl, tracks);

		return tracks;
	}

	// for a single track
	const trackInfo = await ytdl.getInfo(youtubeLink).catch(() => {
		throw "Sorry!. I couldn't find info for that track!.";
	});

	// ignore unsupported tracks
	if (trackInfo.videoDetails.isPrivate || !trackInfo.videoDetails.isCrawlable) {
		throw "Sorry!. I couldn't play that track!.";
	}

	const track: Track = {
		name: trackInfo.videoDetails.title,
		type: "Youtube",
		url: youtubeLink,
		duration: parseInt(trackInfo.videoDetails.lengthSeconds) || false,
	};

	cache.saveYoutube(keywordOrUrl, [track]);

	return [track];
}

// fallback for youtube search queries fails
async function searchSearx(keyword: string): Promise<string | false> {
	let link: string | boolean = false;

	const response = await (
		await fetch(
			`https://searx.lukesmith.xyz/?category_general=1&q=${keyword} youtube&pageno=1&time_range=None&language=en-US&format=json`,
			{
				timeout: 10000,
			}
		).catch()
	).json();

	if (
		response.results[0] &&
		response.results[0].url.indexOf("youtube") !== -1
	) {
		link = response.results[0].url;
	}

	return typeof link == "string" ? link : false;
}
