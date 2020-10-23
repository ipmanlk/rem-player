import * as spotify from "./spotify";
import * as youtube from "./youtube";
import { Track } from "../types/types";

export async function getTracks(keywordOrUrl: string): Promise<Array<Track>> {
	// check given url and get tracks for correct site
	if (/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/.test(keywordOrUrl)) {
		return spotify.getTracks(keywordOrUrl);
	}

	// return youtube by default
	return youtube.getTracks(keywordOrUrl);
}
