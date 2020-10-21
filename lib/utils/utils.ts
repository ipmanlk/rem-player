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
