function downloadObjectUrl(filename: string, objectUrl: string) {
	let a: any = document.createElement('a');
	a.download = filename;
	a.href = objectUrl;
	document.body.appendChild(a);
	a.click();
	a.remove();
}

export { downloadObjectUrl };
