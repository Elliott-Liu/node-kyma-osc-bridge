// Import Dependencies
const http = require("http");
const fs = require("fs");
const { parse } = require("querystring");

const host = "localhost";
const port = 3000;

const dataTemplate = {
	localAddress: "192.168.0.200",
	localPort: 9000, // This is the port we're listening on.
	remoteAddress: "192.168.0.183", // This is where kyma is listening for OSC messages.
	remotePort: 8000,
	metadata: true, // not sure why we need this
};

const server = http.createServer(function (req, res) {
	if (req.url === "/") {
		serveContent(res, "./pages/index.html", "text/html");
	} else if (req.url === "/vendor.js" && req.method === "GET") {
		serveContent(res, "./pages/scripts/vendor.js", "text/javascript");
	} else if (req.url === "/script.js" && req.method === "GET") {
		serveContent(res, "./pages/scripts/script.js", "text/javascript");
	} else if (req.url === "/styles.css" && req.method === "GET") {
		serveContent(res, "./pages/assets/styles/styles.css", "text/css");
	} else if (req.url === "/config/settings" && req.method === "GET") {
		serveContent(res, "./config/settings.json", "application/json");
	} else if (req.url === "/config/settings" && req.method === "POST") {
		parseWritePostMessage(req, res, writeJsonFile, "./config/settings.json");
	}
});

server.listen(port, host, function (err) {
	if (err) {
		console.log("Something went wrong.", err);
	} else {
		console.log(`Server is running on http://${host}:${port}`);
		readJsonFile("./config/settings.json");
	}
});

function parseWritePostMessage(req, res, writeJsonFileFunction, path) {
	let body;
	req.on("data", (buffer) => {
		body = buffer.toString(); // convert buffer to string
	});
	req.on("end", () => {
		body = JSON.parse(body);
		if (writeJsonFileFunction !== null) {
			writeJsonFileFunction(body, path);
		}
		res.end();
	});
}
function readJsonFile(filePath) {
	let pathArray = filePath.split("/");
	const fileName = pathArray.pop();
	const folderPath = pathArray.join("/");
	fs.readFile(filePath, "utf-8", (err, jsonString) => {
		if (err) {
			try {
				console.log(`No ${filePath} exists. Attempting to create new file.`);
				writeJsonFilePath(dataTemplate, filePath);
			} catch (err) {
				console.error(`Error reading ${fileName} file.`, err);
			}
		} else {
			try {
				const data = JSON.parse(jsonString);
				// console.log(data);
			} catch (err) {
				console.error("Error parsing JSON.", err);
			}
		}
	});
}

function writeJsonFile(jsonData, filePath) {
	writeFile(JSON.stringify(jsonData, null, 2), filePath);
}

function writeJsonFilePath(jsonData, filePath) {
	writeFilePath(JSON.stringify(jsonData, null, 2), filePath);
}

async function writeFilePath(data, filePath) {
	let pathArray = filePath.split("/");
	const fileName = pathArray.pop();
	const folderPath = pathArray.join("/");
	let status = await fs.promises
		.access(folderPath, fs.constants.F_OK)
		.then(() => {
			console.log(`The directory ${folderPath}/ already exists.`);
		})
		.catch((err) => {
			if (err) {
				console.log("Directory does not exist.");
				console.log(`Attempting to create new ${folderPath} directory.`);
				makeDirectory(folderPath)
					.then((res) => {
						if (folderPath === res) {
							console.log(`Successfully created ${folderPath} directory.`);
							writeFile(data, filePath);
						}
					})
					.catch((err) => {
						console.error(`Failed to create ${folderPath} directory.`, err);
					});
			}
		});
	return status;
}

function writeFile(data, filePath) {
	fs.writeFile(filePath, data, (err) => {
		if (err) {
			console.error(`Failed to write data to ${filePath} file.`, err);
		} else {
			console.log(`Successfully written data to ${filePath} file.`);
		}
	});
}

async function makeDirectory(folderPath) {
	return await fs.promises.mkdir(folderPath, { recursive: true }, (err) =>
		console.error(`Failed to create ${folderPath}/ directory.`, err)
	);
}

function serveContent(
	res = new http.ServerResponse(),
	filePath = new String(),
	contentType = new String()
) {
	res.setHeader("Content-Type", contentType);
	fs.readFile(filePath, function (err, data) {
		if (err) {
			res.writeHead(404);
			res.write("Error: File Not Found.");
		} else {
			res.writeHead(200);
			res.write(data);
		}
		res.end();
	});
}

if (!Array.prototype.last) {
	Array.prototype.last = function () {
		return this[this.length - 1];
	};
}
