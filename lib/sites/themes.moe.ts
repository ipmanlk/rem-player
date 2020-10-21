import fetch from "node-fetch";
import { MalResponse, ThemesMoeResponse } from "../types/types";
import * as cache from "../utils/cache";
import { Track } from "../types/types";

export const getTracks = async (animeName: string): Promise<Array<Track>> => {
	if (!animeName || animeName.length < 4) {
		throw "Please provide a valid anime name!";
	}

	// check cache first
	const cachedAnime = cache.getAnime(animeName);
	if (cachedAnime) {
		return cachedAnime.tracks;
	}

	// find given anime on mal
	const malResponse: MalResponse = await request(
		`https://api.jikan.moe/v3/search/anime?q=${animeName}&limit=1`
	).catch((e) => {
		console.log(e);
		throw "Unable to contact the jikan api!.";
	});

	if (!malResponse.results || malResponse.results.length == 0) {
		throw "No anime found under the given name!.";
	}

	// extract mal id from mal url
	const malId = malResponse.results[0].url.split("/").reverse()[1];

	// get track info
	const response = await request(
		`https://themes.moe/api/themes/${malId}`
	).catch((e) => {
		console.log(e);
		throw "Unable to contact jikan api!.";
	});

	const themesMoeResponse = response[0] as ThemesMoeResponse;

	// extrat track info
	const tracks = themesMoeResponse.themes.map((theme) => {
		return {
			anime: themesMoeResponse.name,
			type: theme.themeType,
			name: theme.themeName,
			url: theme.mirror.mirrorURL,
		};
	});

	if (tracks.length == 0) throw `No tracks found for ${animeName}`;

	// save to cache
	cache.saveAnime(animeName, tracks);

	return tracks;
};

const request = async (url: string) => {
	return await (await fetch(url, { timeout: 10000 }).catch()).json();
};
