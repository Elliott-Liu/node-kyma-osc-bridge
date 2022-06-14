// Import Dependencies
const http = require("http");
const fs = require("fs");

const port = 3000;

const dataTemplate = {
	localAddress: "192.168.0.200",
	localPort: 9000, // This is the port we're listening on.
	remoteAddress: "192.168.0.183", // This is where kyma is listening for OSC messages.
	remotePort: 8000,
	metadata: true, // not sure why we need this
};

function readJsonFile(filePath) {
	let pathArray = filePath.split("/");
	const fileName = pathArray.pop();
	const folderPath = pathArray.join("/");
	fs.readFile(filePath, "utf-8", (err, jsonString) => {
		if (err) {
			try {
				console.log(`No ${fileName} exists, attempting to creating new file.`);
				writeJsonFile(filePath, dataTemplate);
			} catch (err) {
				console.error(`Error reading ${fileName} file.`, err);
			}
		} else {
			try {
				const data = JSON.parse(jsonString);
				console.log(data);
			} catch (err) {
				console.error("Error parsing JSON.", err);
			}
		}
	});
}

function writeFile(data, filePath) {
	let pathArray = filePath.split("/");
	const fileName = pathArray.pop();
	const folderPath = pathArray.join("/");
	let folderExists = createFolderPath(folderPath);
	console.log({ folderExists });
	if (folderExists) {
		fs.writeFile(filePath, data, (err) => {
			if (err) {
				console.error(
					`Failed to create ${fileName} file at ${folderPath}/.`,
					err
				);
			} else {
				console.log(`Successfully created ${fileName} file at ${folderPath}/.`);
			}
		});
	} else console.log("Nope!");
}

function writeJsonFile(filePath, jsonData) {
	writeFile(JSON.stringify(jsonData, null, 2), filePath);
}

function createFolderPath(folderPath) {
	let folderExists = true; // FIX
	const exists = (boolean) => {
		folderExists = boolean;
	};
	fs.access(folderPath, (err) => {
		if (err) {
			console.log(
				`Folder directory does not exist. Attempting to create new ${folderPath} directory.`
			);
			fs.mkdir(folderPath, { recursive: true }, (err) => {
				if (err) {
					console.error(`Failed to create ${folderPath} directory.`, err);
				} else {
					console.log(`Successfully created ${folderPath} directory.`);
				}
			});
		} else {
			// console.log(`The directory ${folderPath}/ already exists.`);
		}
	});
	return folderExists;
}

const server = http.createServer(function (req, res) {
	res.writeHead(200, { "Content-Type": "text/html" });
	fs.readFile("./pages/index.html", function (error, data) {
		if (error) {
			res.writeHead(404);
			res.write("Error: File Not Found.");
		} else {
			res.write(data);
		}
		res.end();
	});
});

server.listen(port, function (error) {
	if (error) {
		console.log("Something went wrong.", error);
	} else {
		console.log("Server is listening on port: http://localhost:" + port);
		readJsonFile("./config/settings.json");
	}
});

if (!Array.prototype.last) {
	Array.prototype.last = function () {
		return this[this.length - 1];
	};
}
