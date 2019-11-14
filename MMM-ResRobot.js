/* Resrobot - Timetable for ResRobot Module */

/* Magic Mirror
 * Module: MMM-ResRobot
 *
 * By Johan Alvinger https://github.com/Alvinger
 * based on a script by Benjamin Angst http://www.beny.ch which is
 * based on a script from Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("MMM-ResRobot",{

	// Define module defaults
	defaults: {
		updateInterval: 5 * 60 * 1000,	// Update module every 5 minutes.
		animationSpeed: 2000,
		fade: true,
		fadePoint: 0.25,	// Start on 1/4th of the list.
		apiBase: "https://api.resrobot.se/v2/trip?format=json&passlist=0",
		apiKey: "<YOUR RESROBOT API KEY HERE>",
		routes: [
			{from: "740020749", to: "740020749", label: ""},	// Each route has a starting station ID from ResRobot, default: Stockholm Central Station (Metro)
		],					// and a destination station ID from ResRobot, default: none
		skipMinutes: 0,		// Number of minutes to skip before showing departures
		maximumEntries: 6,	// Maximum Entries to show on screen
		truncateAfter: 0,	// A value > 0 will truncate direction name at first space after <value> characters. Default: 5
		transportTypesMap: {
			"express-train": 2,
			"regional-train": 4,
			"express-bus": 8,
			"commuter-train": 16,
			"subway": 32,
			"tram": 64,
			"bus": 128,
			"ferry": 256
			},
		//Defaults to all available
		transportTypes: [
			"express-train",
			"regional-train",
			"express-bus",
			"commuter-train",
			"subway",
			"tram",
			"bus",
			"ferry"
		],
		iconTable: {
			"B": "fa fa-bus",
			"S": "fa fa-subway",
			"J": "fa fa-train",
			"U": "fa fa-subway",
			"F": "fa fa-ship",
		},
	},

	// Define required styles.
	getStyles: function() {
		return ["MMM-ResRobot.css", "font-awesome.css"];
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(this.config.language);

		this.departures = [];
		this.loaded = false;
		this.sendSocketNotification("CONFIG", this.config);
	},

	socketNotificationReceived: function(notification, payload) {
		Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		if (notification === "DEPARTURES") {
			this.departures = payload;
			this.loaded = true;
			this.updateDom();
		}
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.routes === "") {
			wrapper.innerHTML = "Please set at least one route to watch name: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = "Fetching departures ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		wrapper.className = "ResRobot";

		var table = document.createElement("table");
		table.className = "small";

		var cutoff = moment().add(moment.duration(this.config.skipMinutes, "minutes"));

		for (var i = 0; i < this.departures.length; i++) {
			var departure = this.departures[i];

			if (i > this.config.maximumEntries) {
				break;
			}
			
			if (moment(departure.timestamp).isBefore(cutoff)) {
				continue;
			}

			var row = document.createElement("tr");
			table.appendChild(row);

			var depTimeCell = document.createElement("td");
			depTimeCell.className = "departuretime";
			depTimeCell.innerHTML = departure.departuretime;
			row.appendChild(depTimeCell);

			var depTypeCell = document.createElement("td");
			depTypeCell.className = "linetype";
			var typeSymbol = document.createElement("span");
			typeSymbol.className = this.config.iconTable[departure.type.substring(0,1)];
			depTypeCell.appendChild(typeSymbol);
			row.appendChild(depTypeCell);

			var depLineCell = document.createElement("td");
			depLineCell.className = "lineno";
			depLineCell.innerHTML = departure.line;
			row.appendChild(depLineCell);

			var depLineCell = document.createElement("td");
			depLineCell.className = "duration";
			depLineCell.innerHTML = departure.durationtime;
			row.appendChild(depLineCell);

			var depToCell = document.createElement("td");
			depToCell.className = "to";
			depToCell.innerHTML = departure.to;
			row.appendChild(depToCell);

			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
 					this.config.fadePoint = 0;
				}
				var startingPoint = this.config.maximumEntries * this.config.fadePoint;
				var steps = Math.min(this.departures.length, this.config.maximumEntries) - startingPoint;
				if (i >= startingPoint) {
					var currentStep = i - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
				}
			}

		}
		
		wrapper.appendChild(table);
		return wrapper;
	},
});
