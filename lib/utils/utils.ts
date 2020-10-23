export function moveIndex(
	array: Array<Object>,
	oldIndex: number,
	newIndex: number
) {
	if (newIndex >= array.length) {
		newIndex = array.length - 1;
	}
	array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
	return array;
}

export function getSecondsFromYtLabel(label: string): number | false {
	let seconds = 0;
	const parts = label.split(":");
	if (parts.length == 3) {
		// hours
		seconds += parseInt(parts.shift() || "0") * 3600;
	}
	if (parts.length == 3 || 2) {
		// mins
		seconds += parseInt(parts.shift() || "0") * 60;
		// seconds
		seconds += parseInt(parts.shift() || "0");
	}
	return seconds !== 0 ? seconds : false;
}
