let form = document.querySelector("form");
let isLoaded = addEventListener("DOMContentLoaded", (event) => {
	if (event) {
		// console.log("DOM fully loaded and parsed.");
		form.addEventListener("submit", postResponse);
	}
});

function postResponse(event) {
	event.preventDefault();
	let payload = {};
	let elements = this.elements;
	for (let i = 0; i < elements.length; i++) {
		if (elements[i].type !== "submit") {
			payload[elements[i].name] = elements[i].value;
		}
	}
	let xhr = new XMLHttpRequest();
	xhr.open("POST", "/");
	xhr.setRequestHeader("Content-Type", "application/json");
	// console.log(payload);
	let payloadString = JSON.stringify(payload, null, 2);
	// console.log(payloadString);
	xhr.send(payloadString);
}
