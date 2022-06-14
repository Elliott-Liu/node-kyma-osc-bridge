const configForm = document.getElementById("configForm");

addEventListener("DOMContentLoaded", () => {
	// console.log("DOM fully loaded and parsed.");
	configForm.addEventListener("submit", postResponse);
	loadFormData(configForm, "/config/settings");
});

function loadFormData(form = new HTMLElement(), fetchUrl = new URL()) {
	fetch(fetchUrl)
		.then((res) => res.json())
		.then((data) => {
			const payload = data;
			const elements = form.elements;
			for (let i = 0; i < elements.length; i++) {
				if (elements[i].type !== "submit") {
					const element = String(elements[i].name);
					const itemIndex = getIndexOf(element, payload);
					document.getElementById(element).value =
						Object.values(payload)[itemIndex];
				}
			}
		});
}

function getIndexOf(item = new String(), array = new Array()) {
	index = Object.keys(array).indexOf(item);
	return index;
}

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
	xhr.open("POST", "/config/settings");
	xhr.setRequestHeader("Content-Type", "application/json");
	// console.log(payload);
	let payloadString = JSON.stringify(payload);
	// console.log(payloadString);
	xhr.send(payloadString);
}
