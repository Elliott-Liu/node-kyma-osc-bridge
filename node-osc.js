src =
	"http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js";
const maxAPI = require("max-api"); // loads the Max for Node stuff
let osc = require("osc"); // loads the Open Sound Control
let fs = require("fs"); // loads the File System

const { exec } = require("child_process");

const showLove = "showLove"; // this is for the inital communication
const getWidget = "getWidget";
const widgetDetail = "widgetDetail";
const passWidget = "passWidget";
let pullWidget = "pullWidget";
const pullFaders = "pullFaders";
const pullPots = "pullPots";
const pullButtons = "pullButtons";
const pull2D = "pull2D";
const pull1D = "pull1D";

const getpresetName = "getpresetName";
const getpresetCount = "getpresetCount";
const getpresets = "getpresets";
const programChange = "programChange";
const sortArray = "sortArray";
const printArray = "printArray";

let widgetCount;
let presetName;
let presetCount;
let feedback; //this creates an empty array
let widgetArray = [];
let presetArray = [];
let widgetInfo = 0;

const fillArray = "fillArray";
const notifOff = "notifOff";

const localIP = "192.168.0.200";
const KymaIP = "192.168.0.183";

var udpPort = new osc.UDPPort({
	localAddress: localIP,
	localPort: 9000, // This is the port we're listening on.
	remoteAddress: KymaIP, // This is where kyma is listening for OSC messages.
	remotePort: 8000,
	metadata: true, // not sure why we need this:
});

// time stamp experiment.
// var today = new Date();
// var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

// this has the outgoing messages
let tango = "node-OSC®© engine online and ready to tango";
let online = "status " + "The Pacarana is Online and Functioning";
let pause = "pause for thought";

// gets all the widgets
arrayFillingFunction();

// This section has the if statement which decides what to do next
udpPort.on("message", (oscMsg) => {
	maxAPI.post(oscMsg); // this is to monitor what is actually coming back , not what the array sees.

	if (oscMsg.address == "/osc/response_from") {
		// posts a response after show love
		maxAPI.outlet(online);
	} else if (oscMsg.address == "/osc/notify/vcs/msp") {
		// reacts to the Widget Count incoming
		widgetCount = JSON.parse(oscMsg.args[0].value) - 2; // minus two because of the two extra hidden widgets
		console.log("widget count variable= " + widgetCount);
		// console.log(oscMsg);
		// widgetArray =[];
		maxAPI.outlet("newsound " + 1);
	} else if (oscMsg.address == "/vcs") {
		// feedback from VCS big endian fun
		feedback = [];
		feedback = oscMsg.args[0].value; // gets array

		// console.log('fblength ' + feedback.length);

		for (let i = 0; i < feedback.length; i += 8) {
			var astart = i; // sets the start of the int range
			var aslice = i + 4; // sets the slice point
			var aend = i + 8; // sets the end of the float range

			var endInt = feedback.slice(astart, aslice); // new array from first half
			var endFloat = feedback.slice(aslice, aend); // takes array from the remainder

			var endIntBuf = new DataView(endInt.buffer); //creates dataview
			var endFltBuf = new DataView(endFloat.buffer); //creates dataview
			var fbint = endIntBuf.getInt32(); // creates a variable from the int
			var fbfloat = endFltBuf.getFloat32(); // creates a variable from the float
			maxAPI.outlet("fbint " + fbint); // post the final integer!
			maxAPI.outlet("fbfloat " + fbfloat); // post the final float!

			// console.log('astart ' + astart);
			// console.log('aslice ' + aslice);
			// console.log('aend ' + aend);
			// console.log('rawendInt '  + i + ' ' +  endInt);
			// console.log('rawendFloat '+ i + ' ' +  endFloat);

			// console.log('endInt ' + i + ' ' + endIntBuf.getInt32());  // log the final integer!
			// console.log('endFlt '+ i + ' ' +  endFltBuf.getFloat32());  // log the final float
		}
	} else if (oscMsg.address == "/osc/widget") {
		// Pulls all the widget details into the array.
		// console.log(oscMsg.args[1].value);
		widgetInfo = JSON.parse(oscMsg.args[1].value); //decodes the second layer of //slashes out of the message
		if (widgetInfo.concreteEventID == undefined) {
			console.log("widget skipped");
			let widgetInfo = 0;
		} else {
			widgetArray[oscMsg.args[0].value] = widgetInfo;

			console.log("else achieved");
		}
		console.log("there are this many widgets " + widgetArray.length);
		maxAPI.post(widgetArray.length);
	}
	// console.log (widgetInfo);
	// console.log ('wInfoLab '+widgetInfo.label);
	// console.log ('wInfoDiss '+widgetInfo.displayType);
	// console.log ('wInfoDiss '+widgetInfo.concreteEventID);
	else if (oscMsg.address == "/osc/preset") {
		// this receives the requested preset name
		presetName = oscMsg.args[1].value;
		maxAPI.post(presetName);
		console.log(presetName);
		maxAPI.outlet("presetName " + presetName);
	} else if (oscMsg.address == "/osc/notify/presets/msp") {
		// this receives the requested preset count
		presetCount = oscMsg.args[0].value;
		maxAPI.post(presetCount);
		console.log(presetCount);
		maxAPI.outlet("presetCount " + presetCount);
	} else {
		console.log("Everything else = " + oscMsg);
	}
});

try {
	console.log(tango);
	maxAPI.post(tango);
	maxAPI.outlet(tango);
	udpPort.open();
} catch (err) {
	console.log(err);
}

// this bit has all the handlers from max to send messages to the pacarana.
maxAPI.addHandler(printArray, () => {
	var file = fs.createWriteStream("arrayALL.txt");
	file.on("error", function (err) {
		/* error handling */
	});
	widgetArray.forEach(function (v) {
		file.write(v.join(", ") + "\n");
	});
	file.end();
	console.log("array printay");
});

maxAPI.addHandler(showLove, () => {
	// request love
	setImmediate(function () {
		var respond_msg = {
			address: "/osc/respond_to",
			args: [{ type: "i", value: "9000" }],
		};

		udpPort.send(respond_msg);
	});
});

maxAPI.addHandler(getWidget, () =>
	// this gets the total number of widgets
	{
		getWidgetCount();
	}
);

maxAPI.addHandler(passWidget, () =>
	// this passess the total number of widgets from JS to Max
	{
		maxAPI.outlet("passwidgetcount " + widgetCount);
	}
);

maxAPI.addHandler(widgetDetail, () =>
	// this is asks for a single widget details.
	{
		getWidgetDetails(1);
	}
);

// this is asks for total number of presets
maxAPI.addHandler(getpresetCount, () => {
	getthepresetcount();
});

// this is asks for a preset name
maxAPI.addHandler(getpresetName, (pnum) => {
	getthepresetname(pnum);
});

// this is asks for Notifications Off, useful to stop all the data spewing back in.
maxAPI.addHandler(notifOff, () => {
	setImmediate(() => {
		var offStrung = {
			address: "/osc/notify/vcs/msp",
			args: [{ type: "i", value: "0" }],
		};
		udpPort.send(offStrung);
	});
});

// this bit has the handlers to pull data out of the array: Number, Label, ConcreteID. We use this to build the outgoing controls in max.
maxAPI.addHandler("pullWidget", (wnum) => {
	maxAPI.outlet("widget " + wnum);
	maxAPI.outlet("label " + widgetArray[wnum].label);
	maxAPI.outlet("mini " + widgetArray[wnum].minimum);
	maxAPI.outlet("maxi " + widgetArray[wnum].maximum);
	maxAPI.outlet("conEvent " + widgetArray[wnum].concreteEventID);
});

let verifyArray = "verifyArray";
let income;

// this verfies the contents of the widgetArray
maxAPI.addHandler(verifyArray, () => {
	console.log(widgetArray.length);

	for (let i = 0; i < widgetArray.length; i++) {
		// (
		//     i + ' ' + widgetArray[i].displayType + ' ' + widgetArray[i].concreteEventID + ' ' + widgetArray[i].minimum + ' '+ widgetArray[i].maximum
		// );
		i +
			" " +
			widgetArray[i].label +
			" " +
			widgetArray[i].displayType +
			" " +
			widgetArray[i].concreteEventID +
			" " +
			widgetArray[i].minimum +
			" " +
			widgetArray[i].maximum;

		// elliot in g string backticks
		// (
		//     `${i} ${widgetArray[i].label} ${widgetArray[i].displayType} ${widgetArray[i].concreteEventID} ${widgetArray[i].minimum} ${widgetArray[i].maximum}`
		// );

		// maxAPI.outlet('verfication ' + i +','+ widgetArray[i].concreteEventID+ ' ' + widgetArray[i].label + ' ' + widgetArray[i].displayType );

		// income =
		//     (
		//         widgetArray[i].label + ' ' + widgetArray[i].displayType + ' ' + widgetArray[i].concreteEventID + ' ' + widgetArray[i].minimum + ' '+ widgetArray[i].maximum + ' '
		//     );

		// dumpFile();
	}
});

// An experiment in pulling specific displayTypes from the array.
maxAPI.addHandler(pullFaders, () => {
	var fadercount = -1;
	for (let i = 0; i < widgetArray.length; i++) {
		if (
			widgetArray[i].displayType == "Fader" &&
			widgetArray[i].concreteEventID !== undefined
		) {
			fadercount = fadercount + 1;
			maxAPI.outlet(
				"fader " +
					fadercount +
					"," +
					widgetArray[i].concreteEventID +
					" " +
					widgetArray[i].label +
					" " +
					widgetArray[i].minimum +
					" " +
					widgetArray[i].maximum
			);
			// maxAPI.post('fader ' + (i - skipcount) +','+ widgetArray[i].concreteEventID+ ' ' + widgetArray[i].label );
			// console.log('fader ' + (i - skipcount) +','+ widgetArray[i].concreteEventID+ ' ' + widgetArray[i].label );
		} else {
			//    maxAPI.post(i + ' fader skipped');
		}
	}
});

maxAPI.addHandler(pull1D, () =>
	// 1D fader Array
	{
		var onedfadercount = -1;
		for (let i = 0; i < widgetArray.length; i++) {
			if (
				widgetArray[i].displayType == "1D Fader Array" &&
				widgetArray[i].concreteEventID !== undefined
			) {
				onedfadercount = onedfadercount + 1;
				maxAPI.outlet(
					"1dfader " +
						onedfadercount +
						"," +
						widgetArray[i].concreteEventID +
						" " +
						widgetArray[i].label +
						" " +
						widgetArray[i].minimum +
						" " +
						widgetArray[i].maximum
				);
			} else {
			}
		}
	}
);

maxAPI.addHandler(pullPots, () => {
	var potcount = -1;
	for (let i = 0; i < widgetArray.length; i++) {
		if (
			(widgetArray[i].displayType == "Potentiometer" ||
				widgetArray[i].displayType == "Rotary" ||
				widgetArray[i].displayType == "Pan Pot") &&
			widgetArray[i].concreteEventID !== undefined
		) {
			potcount = potcount + 1;
			maxAPI.outlet(
				"pot " +
					potcount +
					"," +
					widgetArray[i].concreteEventID +
					" " +
					widgetArray[i].label +
					" " +
					widgetArray[i].minimum +
					" " +
					widgetArray[i].maximum
			);
		} else {
		}
	}
});

maxAPI.addHandler(pullButtons, () => {
	var buttcount = -1;
	for (let i = 0; i < widgetArray.length; i++) {
		if (
			(widgetArray[i].displayType == "Button (fill)" ||
				widgetArray[i].displayType == "Toggle (fill)" ||
				widgetArray[i].displayType == "Button" ||
				widgetArray[i].displayType == "Toggle") &&
			widgetArray[i].concreteEventID !== undefined
		) {
			buttcount = buttcount + 1;
			var redux = widgetArray[i].displayType;
			var dissredux = redux.substring(0, 6); // this reduces the string to get rid of the (fill)

			maxAPI.outlet(
				"button " +
					buttcount +
					"," +
					widgetArray[i].concreteEventID +
					" " +
					dissredux +
					" " +
					widgetArray[i].label +
					" " +
					widgetArray[i].minimum +
					" " +
					widgetArray[i].maximum
			);

			maxAPI.post(
				buttcount +
					"," +
					widgetArray[i].concreteEventID +
					" " +
					widgetArray[i].displayType +
					" " +
					widgetArray[i].label +
					" " +
					widgetArray[i].minimum +
					" " +
					widgetArray[i].maximum
			);
		} else {
			//    maxAPI.post(i + ' button skipped ');
		}
	}
});

maxAPI.addHandler(pull2D, () => {
	var two_d_count = -1;
	for (let i = 0; i < widgetArray.length; i++) {
		if (
			widgetArray[i].displayType == "2D Fader" &&
			widgetArray[i].concreteEventID !== undefined
		) {
			two_d_count = two_d_count + 1;
			maxAPI.outlet(
				"2d " +
					two_d_count +
					"," +
					widgetArray[i].concreteEventID +
					" " +
					widgetArray[i].label +
					" " +
					widgetArray[i].minimum +
					" " +
					widgetArray[i].maximum
			);
			// maxAPI.post('fader ' + (i - skipcount) +','+ widgetArray[i].concreteEventID+ ' ' + widgetArray[i].label );
			// console.log('fader ' + (i - skipcount) +','+ widgetArray[i].concreteEventID+ ' ' + widgetArray[i].label );
		} else {
			//    maxAPI.post(i + ' 2D skipped');
		}
	}
});

maxAPI.addHandler(programChange, (lnum) => {
	sendProgramChange(lnum);
});

maxAPI.addHandler(sortArray, () => {
	arraySorter();
});

function getthepresetname(pnum) {
	setImmediate(() => {
		var widgetNamez = {
			address: "/osc/preset",
			args: [{ type: "i", value: pnum }],
		};
		udpPort.send(widgetNamez);
	});
}

function getthepresetcount() {
	setImmediate(() => {
		var pname = {
			address: "/osc/notify/presets/msp",
			args: [{ type: "i", value: "1" }],
		};
		udpPort.send(pname);
		console.log("preset count requested");
		maxAPI.post("preset count requested");
	});
}

function sendProgramChange(pcnum) {
	setImmediate(() => {
		var pgc = { address: "/preset", args: [{ type: "i", value: pcnum }] };
		udpPort.send(pgc);
		console.log("PC sent");
		maxAPI.post("PC sent");
		maxAPI.post(pgc);
	});
}

//  attempt at writing file to disk
function uploadFile() {
	exec(
		"scp ./charliearray.txt root@51.15.226.62:/var/www/narmerio.com",
		(err, stdout, stderr) => {
			if (err) {
				//   console.error(err)
			} else {
			}
		}
	);
	//   else  {console.log('Everything else = ' + oscMsg)};
}

function dumpFile() {
	fs.appendFile("charliearray.txt", income + presetName + " ", function (err) {
		if (err) throw err;
	});

	console.log("written file");
	uploadFile();
}

function arrayFillingFunction() {
	maxAPI.addHandler(fillArray, (anum) => {
		getWidgetDetails(anum);
	});
}

function getWidgetCount() {
	setImmediate(() => {
		var widget = {
			address: "/osc/notify/vcs/msp",
			args: [{ type: "i", value: "2" }],
		};
		udpPort.send(widget);
	});
}

function getWidgetDetails(widgetID) {
	setImmediate(() => {
		var widgetDeetz = {
			address: "/osc/widget",
			args: [{ type: "i", value: widgetID }],
		};
		udpPort.send(widgetDeetz);
	});
}

// function arraySorter ()
// {
//     var sortedWidgetArray = _.sortBy( widgetArray, 'label');
//     console.log(sortedWidgetArray);
// }
