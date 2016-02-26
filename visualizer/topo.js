// socket connect to server
var socket;

// elements in the topology
var nodes = [];
var links = [];
var lsps = [];

// color schema
var colors = [
'rgba(0,64,16,0.5)',
'rgba(0,18,229,0.5)',
'rgba(127,1,0,0.5)',
'rgba(191,149,0,0.5)',
'rgba(255,0,0,0.5)',
'rgba(225,118,0,1)',
'rgba(101,0,127,1)',
'rgba(0,192,229,0.5)'
];

// counter for northstar update
var northStarUpdate = 0;
var redisUpdate = 0;

// size of canvas
var width;
var height;

// array of buttons
var buttons = [];

// mouse press event handler
function onMousePressed() {
	for (var i = 0; i < buttons.length; i++) {
		if (mouseX > buttons[i].l && mouseX < buttons[i].r && mouseY > buttons[i].u && mouseY < buttons[i].b) {
			if (buttons[i].show) {
				buttons[i].show = false;
			} else {
				buttons[i].show = true;
			}
		}
	}
}

// Visualization of topology in a Wide Area Network
function setup() {
	// creat canvas
	const canvasHolder = select('#topo-main'),
	      width = canvasHolder.width,
	      height = canvasHolder.height;
	// console.log(width);
	// console.log(height);
	canvas = createCanvas(width, height).parent('topo-main');
	canvas.mousePressed(onMousePressed);

	// set frame rate as 25 fps
	frameRate(25);

	// Add buttons
	for (var i = 0; i < 4; i++) {
		var button = {
			l: width*0.82,
			r: width*0.82+width*0.07,
			u: height*0.3+height*0.2*i,
			b: height*0.3+height*0.2*i+height*0.1,
			show: false
		}
		buttons.push(button);
	}

	for (var i = 0; i < 4; i++) {
		var button = {
			l: width*0.91,
			r: width*0.91+width*0.07,
			u: height*0.3+height*0.2*i,
			b: height*0.3+height*0.2*i+height*0.1,
			show: false
		}
		buttons.push(button);
	}

	// Establish socket between browser and server
	socket = io.connect('http://localhost:8080');
	socket.emit('northstar');

	socket.on('welcome', function(data) {
		console.log(data.welcome);
	});

	socket.on('nodes', function(data) {
		nodes = data;
		for (var i = 0; i < 8; i++) {
			nodes[i].x = map(nodes[i].longtitude, -130, -70, 0, width*0.8);
			nodes[i].y = map(-nodes[i].latitude, -45, -25, 0, height);
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

	// counting whether to update northstar informations && redis information
	if (nodes.length == 8 && links.length == 15 && lsps.length == 8) {
		if (northStarUpdate < 75) {
			northStarUpdate++;
		} else {
			socket.emit('northstar_update');
			northStarUpdate = 0;
		}

		if (redisUpdate < 750) {
			redisUpdate++;
		} else {
			socket.emit('redis_update');
			redisUpdate = 0;
		}
	}

	background(255);

	// Links
	for (var i = 0; i < links.length; i++) {
		// console.log('drawing links');
		// console.log(links[i]);
		stroke(230,230,230);
		strokeWeight(5);
		line(nodes[links[i].endA-1].x+3, nodes[links[i].endA-1].y+3, nodes[links[i].endZ-1].x+3, nodes[links[i].endZ-1].y+3);
		line(nodes[links[i].endA-1].x-3, nodes[links[i].endA-1].y-3, nodes[links[i].endZ-1].x-3, nodes[links[i].endZ-1].y-3);
		stroke('rgba(0,0,0,0.5)');
		strokeWeight(5*links[i].utilA2Z);
		line(nodes[links[i].endA-1].x+3, nodes[links[i].endA-1].y+3, nodes[links[i].endZ-1].x+3, nodes[links[i].endZ-1].y+3);
		line(nodes[links[i].endA-1].x-3, nodes[links[i].endA-1].y-3, nodes[links[i].endZ-1].x-3, nodes[links[i].endZ-1].y-3);
	}

	// Nodes
	stroke(50);
	strokeWeight(1);
	for (var i = 0; i < nodes.length; i++) {
		fill(100);
		ellipse(nodes[i].x, nodes[i].y, 25, 25);
		textSize(24);
		fill(0, 102, 153);
		text(nodes[i].name, nodes[i].x, nodes[i].y+25);
		// console.log(nodes);
	}

	// LSPs
	for (var i = 0; i < lsps.length; i++) {
		// console.log(colors);
		if (buttons[i].show) {
			stroke(colors[i]);
			strokeWeight(4);
			for (var j = 0; j < lsps[i].links.length; j++) {
				line(
					nodes[links[lsps[i].links[j]].endA-1].x+i*2,
					nodes[links[lsps[i].links[j]].endA-1].y+i*2,
					nodes[links[lsps[i].links[j]].endZ-1].x+i*2,
					nodes[links[lsps[i].links[j]].endZ-1].y+i*2);
			}
		}

		stroke(0);
		strokeWeight(1);
		if (buttons[i].show) {
			fill(colors[i]);
		} else {
			fill(255);
		}
		var w = width*0.07;
		var h = height*0.1;
		if (i < 4) {
			rect(width*0.82, height*0.3+height*0.2*i, w, h);
			textSize(h*0.2);
			fill(0);
			strokeWeight(1);
			text(lsps[i].name, width*0.82, height*0.3+height*0.2*i, w, h);
		}
		if (i >= 4) {
			rect(width*0.91, height*0.3+height*0.2*(i-4), w, h);
			textSize(h*0.2);
			fill(0);
			strokeWeight(1);
			text(lsps[i].name, width*0.91, height*0.3+height*0.2*(i-4), w, h);
		}
	}
}

