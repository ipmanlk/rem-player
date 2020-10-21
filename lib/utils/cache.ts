import { writeFileSync, existsSync, mkdirSync } from "fs";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import { Database, Track, DatabaseRecord } from "../types/types";

const cacheDir = `${process.cwd()}/cache`;
const animeDbPath = `${cacheDir}/anime.json`;
const youtubeDbPath = `${cacheDir}/youtube.json`;

// create cache dir if it doesn't exist
if (!existsSync(cacheDir)) {
	mkdirSync(cacheDir);

	// create cache files
	writeFileSync(
		animeDbPath,
		JSON.stringify({
			records: [],
		})
	);

	writeFileSync(
		youtubeDbPath,
		JSON.stringify({
			records: [],
		})
	);
}

const animeAdapter = new FileSync<Database>(animeDbPath);
const youtubeAdapter = new FileSync<Database>(youtubeDbPath);
const animeDb = low(animeAdapter);
const youtubeDb = low(youtubeAdapter);

export function saveAnime(keyword: string, tracks: Array<Track>): void {
	animeDb
		.get("records")
		.push({ key: keyword.toLowerCase(), tracks: tracks })
		.write();
}

export function saveYoutube(keyword: string, tracks: Array<Track>): void {
	youtubeDb.get("records").push({ key: keyword, tracks: tracks }).write();
}

export function getAnime(keyword: string): DatabaseRecord | void {
	return animeDb.get("records").find({ key: keyword.toLowerCase() }).value();
}

export function getYoutube(keyword: string): DatabaseRecord | void {
	return youtubeDb.get("records").find({ key: keyword }).value();
}
