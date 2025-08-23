export function decodeMessage(data: ArrayBuffer): any {
	const decoder = new TextDecoder();
	const messageText = decoder.decode(data);
	return JSON.parse(messageText);
}

export function encodeMessage(data: any): string {
	return JSON.stringify(data);
}
