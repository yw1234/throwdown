// var ClientOAuth2 = require('client-oauth2');

// var northStarAuth = new ClientOAuth2({
// 	clientId: 'group8',
// 	clientSecret: 'nyu2016',
// 	accessTokenUri: 'https://10.10.2.25:8443/oauth2/token',
// 	authorizationUri: 'https://10.10.2.25:8443/oauth2/authorize',
// 	authorizationGrants: ['password'],
// 	redirectUri: '',
// 	scopes: []
// });

// northStarAuth.owner.getToken('group8', 'nyu2016').then(function (user) {
// 	console.log(user);
// });

// socket connect to server
var socket;
// nodes in the topology, hardcoded recently
// var nodes = [
// {id: 1, name: 'SF', x: 240, y: 300},
// {id: 2, name: 'DALLAS', x: 480, y: 300},
// {id: 3, name: 'MIAMI', x: 720, y: 300},
// {id: 4, name: 'LA', x: 320, y: 500},
// {id: 5, name: 'HOUSTON', x: 640, y: 500},
// {id: 6, name: 'TAMPA', x: 960, y: 500},
// {id: 7, name: 'NY', x: 960, y: 300},
// {id: 8, name: 'CHICAGO', x: 640, y: 100},
// ];
var nodes = [];
var links = [];
var lsps = [];
var colors = [
'rgba(35,141,129,0.5)',
'rgba(244,211,109,0.5)',
'rgba(239,81,65,0.5)',
'rgba(243,120,65,0.5)',
'rgba(48,128,161,0.5)',
'rgba(185,0,0,0.5)',
'rgba(254,179,0,0.5)',
'rgba(226,119,32,0.5)'
];
var northStarUpdate = 0;

// Visualization of topology in a Wide Area Network
function setup() {
	createCanvas(1280, 720);
	frameRate(25);

	// Establish socket between browser and server
	socket = io.connect('http://localhost:8080');
	socket.emit('northstar');

	socket.on('welcome', function(data) {
		console.log(data.welcome);
	});

	socket.on('nodes', function(data) {
		nodes = data;
		for (var i = 0; i < 8; i++) {
			nodes[i].x = map(nodes[i].longtitude, -130, -70, 0, 1280);
			nodes[i].y = map(-nodes[i].latitude, -45, -25, 0, 720);
		}
		// console.log(nodes);
		console.log('New nodes information received');
	});

	socket.on('links', function(data) {
		// console.log(data);
		links = data;
		console.log('New links information received');
	})

	socket.on('lsps', function(data) {
		// console.log(data);
		lsps = data
		console.log('New LSPs information received');
	})
}

function draw() {

	if (nodes.length == 8 && links.length == 15 && lsps.length == 8) {
		if (northStarUpdate < 75) {
			northStarUpdate++;
		} else {
			socket.emit('northstar');
			northStarUpdate = 0;
		}
	}

	background(255);

	// Links
	stroke(200);
	strokeWeight(1);
	for (var i = 0; i < links.length; i++) {
		// console.log('drawing links');
		// console.log(links[i]);
		line(nodes[links[i].endA-1].x, nodes[links[i].endA-1].y, nodes[links[i].endZ-1].x, nodes[links[i].endZ-1].y);
	}

	// Nodes
	fill(100);
	stroke(50);
	for (var i = 0; i < nodes.length; i++) {
		ellipse(nodes[i].x, nodes[i].y, 25, 25);
		// console.log(nodes);
	}

	for (var i = 0; i < lsps.length; i++) {
		// console.log(colors);
		stroke(colors[i]);
		strokeWeight(2);
		for (var j = 0; j < lsps[i].links.length; j++) {
			line(
				nodes[links[lsps[i].links[j]].endA-1].x+i*2,
				nodes[links[lsps[i].links[j]].endA-1].y+i*2,
				nodes[links[lsps[i].links[j]].endZ-1].x+i*2,
				nodes[links[lsps[i].links[j]].endZ-1].y+i*2);
		}
	}
}