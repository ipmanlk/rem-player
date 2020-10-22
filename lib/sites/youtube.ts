import fetch from "node-fetch";
import cheerio from "cheerio";
import ytdl from "discord-ytdl-core";
import ytsr from "ytsr";
import ytpl from "ytpl";
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
			youtubeLink = await searchInvidio(keywordOrUrl);
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

	const track = {
		name: trackInfo.videoDetails.title,
		type: "Youtube",
		url: youtubeLink,
	};

	cache.saveYoutube(keywordOrUrl, [track]);

	return [track];
}

// fallback for youtube search queries fails
async function searchInvidio(keyword: string): Promise<string | false> {
	// parse and find the first result
	const retries = 4;
	let currentTry = 0;

	let linkId: string | boolean = false;

	while (!linkId && currentTry < retries) {
		// html response
		const response = await (
			await fetch(`https://tube.connect.cafe/search?q=${keyword}`, {
				timeout: 10000,
			}).catch()
		).text();

		const $ = cheerio.load(response);
		const a = $(".pure-u-1.pure-u-md-1-4 .h-box a").first();
		if (a) linkId = a.attr("href") || "";
		currentTry++;
	}

	return linkId ? `https://www.youtube.com/${linkId}` : false;
}
