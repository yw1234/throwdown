var fs = require('fs'); // The file system module
var http = require('http');
var path = require('path');
var rest = require('restler'); // Load restler rest api
var redis = require('redis');

function handleRequest(req, res) {
  var pathname = req.url;

  // If blank, response with index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }

  // load file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };

  // content type default to plain text
  var contentType = typeExt[ext] || 'text/plain';

  // read and write back the file with the appropriate content type
  fs.readFile(__dirname + pathname,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Dynamically setting content type
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  );
}

// start the server
var http = require('http');
var server = http.createServer(handleRequest);
server.listen(8080);

// start a socket
var io = require('socket.io').listen(server);

// listen to client connection
io.sockets.on('connection',
	function (socket) {
		console.log("A client connected");
		socket.emit('welcome', {welcome: "Welcome to visualizer"});

		// mapping from interface ip to interface name
		var ip_to_int = {
			'10.210.16.2': 'chicago:ge-1/0/1',
			'10.210.13.2': 'chicago:ge-1/0/2',
			'10.210.14.2': 'chicago:ge-1/0/3',
			'10.210.17.2': 'chicago:ge-1/0/4',
			'10.210.18.1': 'san francisco:ge-1/0/0',
			'10.210.15.1': 'san francisco:ge-1/0/1',
			'10.210.16.1': 'san francisco:ge-1/0/3',
			'10.210.15.2': 'dallas:ge-1/0/0',
			'10.210.19.1': 'dallas:ge-1/0/1',
			'10.210.21.1': 'dallas:ge-1/0/2',
			'10.210.11.1': 'dallas:ge-1/0/3',
			'10.210.13.1': 'dallas:ge-1/0/4',
			'10.210.22.1': 'miami:ge-0/1/0',
			'10.210.24.1': 'miami:ge-0/1/1',
			'10.210.12.1': 'miami:ge-0/1/2',
			'10.210.11.2': 'miami:ge-0/1/3',
			'10.210.14.1': 'miami:ge-1/3/0',
			'10.210.12.2': 'new york:ge-1/0/3',
			'10.210.17.1': 'new york:ge-1/0/5',
			'10.210.26.1': 'new york:ge-1/0/7',
			'10.210.18.2': 'los angeles:ge-0/1/0',
			'10.210.19.2': 'los angeles:ge-0/1/1',
			'10.210.20.1': 'los angeles:ge-0/1/2',
			'10.210.20.2': 'houston:ge-0/1/0',
			'10.210.21.2': 'houston:ge-0/1/1',
			'10.210.22.2': 'houston:ge-0/1/2',
			'10.210.25.1': 'houston:ge-0/1/3',
			'10.210.25.2': 'tampa:ge-1/0/0',
			'10.210.24.2': 'tampa:ge-1/0/1',
			'10.210.26.2': 'tampa:ge-1/0/2',
		}

		// elements in a topology
		var nodes = [];
		var links = [];
		var lsps = [];

		var keyList = [];
		var outputList = [];

		var redisClient = redis.createClient(6379, '10.10.4.252');

		function findNode(ip) {
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].ip == ip) {
					return nodes[i].id;
				}
			}
		}

		// TODO: decide whether to use array index or link id
		function findLink(dst) {
			for (var i = 0; i < links.length; i++) {
				if (links[i].ipA == dst || links[i].ipZ == dst) {
					return i;
				}
			}
		}

		function findLinks(ero) {
			var links = [];
			for (var i = 0; i < ero.length; i++) {
				var link = findLink(ero[i].address);
				links.push(link);
			}
			return links;
		}

		function getbps() {
			redisClient.keys('*', function (err, keys) {
				if (err) return console.log(err);

				keyList = [];
				outputList = [];

				// get keys from redis
				for (var i = 0; i < keys.length; i++) {
					// we only deal with traffic statistics
					if (keys[i].includes('traffic statistics')) {
						keyList.push(keys[i]);
						// get statistics
						redisClient.lrange(keys[i], 0, -1, function (err, values) {
							var key = keyList.shift();
							// get output bit rate
							// console.log('before parsing');
							var bps = JSON.parse(values[0]).stats[0]['output-bps'][0].data;
							// console.log('after parsing');

							// calculate utilization
							for (var i = 0; i < links.length; i++) {
								if (key.includes(links[i].intA)) {
									links[i].utilA2Z = bps/1000000000.0;
									break;
								}
								if (key.includes(links[i].intZ)) {
									links[i].utilZ2A = bps/1000000000.0;
									break;
								}
							}

							// console.log('trying to add bps');
							outputList.push(bps);
						});
					}
				}
			});
		}

		// listen to WAN topology request
		socket.on('northstar',
			function () {
				console.log("Requesting northstar topology");

				// use post to fetch access token
				var payload = {grant_type: 'password', username: 'group8', password: 'nyu2016'};
				rest.post('https://10.10.2.25:8443/oauth2/token', {
					username: 'group8',
					password: 'nyu2016',
					data: payload,
					verify: false
				}).on('complete', function(data) {
					// console.log(data);

					var header = {Authorization: data.token_type + " " + data.access_token};

					// use the token we get to get nodes in the topology
					rest.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/nodes', {
						headers: header
					}).on('complete', function(data) {
						// use socket to send nodes information to browser

						// console.log(data);
						for (var i = 0; i < 8; i++) {
							var node = {
								id: data[i].nodeIndex,
								name: data[i].hostName,
								ip: data[i].name,
								// There are some problems with n.topology (undefined)
								latitude: data[i].topology.coordinates.coordinates[0],
								longtitude: data[i].topology.coordinates.coordinates[1],
								x: 0,
								y: 0
							}

							nodes.push(node)
						}

						// console.log(nodes);

						socket.emit('nodes', nodes);
						console.log('Nodes information got and sent to client');

						// getting links information
						rest.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/links', {
							headers: header
						}).on('complete', function(data) {
							// use socket to send links information to browser

							// console.log(data);

							for (var i = 0; i < 15; i++) {
								var link = {
									id: data[i].linkIndex,
									name: data[i].name,
									endA: findNode(data[i].endA.node.name),
									endZ: findNode(data[i].endZ.node.name),
									ipA: data[i].endA.ipv4Address.address,
									ipZ: data[i].endZ.ipv4Address.address,
									intA: ip_to_int[data[i].endA.ipv4Address.address],
									intZ: ip_to_int[data[i].endZ.ipv4Address.address],
									utilA2Z: 0,
									utilZ2A: 0
								};

								links.push(link);
							}

							// console.log(links);
							socket.emit('links', links);
							console.log('Links information got and sent to client');

							getbps();

							// getting lsps information
							rest.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps', {
								headers: header
							}).on('complete', function(data) {
								for (var i = 0; i < 88; i++) {
									if (data[i].name.includes("GROUP_ELEVEN")) {
									// if (data[i].name.includes("GROUP_EIGHT")) {
										// console.log(data[i].liveProperties.ero);
										var lsp = {
											id: data[i].lspIndex,
											name: data[i].name.replace(/_/g," "),
											links: findLinks(data[i].liveProperties.ero)
										};
										lsps.push(lsp);
										// console.log(lsp.links);
									}
								}
								// console.log(lsps);
								socket.emit('lsps', lsps);
								console.log('LSPs information got and sent to client');
							});
						});
					});
				});

			}
		);

		// listen to LSPs update request
		socket.on('northstar_update', function() {
			console.log("Requesting LSPs update");

			// use post to fetch access token
			var payload = {grant_type: 'password', username: 'group8', password: 'nyu2016'};
			rest.post('https://10.10.2.25:8443/oauth2/token', {
				username: 'group8',
				password: 'nyu2016',
				data: payload,
				verify: false
			}).on('complete', function(data) {
				// console.log(data);

				var header = {Authorization: data.token_type + " " + data.access_token};

				// getting lsps information
				rest.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps', {
					headers: header
				}).on('complete', function(data) {
					var tmp = [];
					for (var i = 0; i < 88; i++) {
						if (data[i].name.includes("GROUP_ELEVEN")) {
						// if (data[i].name.includes("GROUP_EIGHT")) {
							// console.log(data[i].liveProperties.ero);
							var lsp = {
								id: data[i].lspIndex,
								name: data[i].name.replace(/_/g," "),
								links: findLinks(data[i].liveProperties.ero)
							};
							tmp.push(lsp);
							// console.log(lsp.links);
						}
					}
					lsps = tmp;
					
					// console.log(lsps);
					socket.emit('lsps', lsps);
					console.log('LSPs information got and sent to client');

					// if all bit rate calculated, push new links statistics to client
					console.log("Stored bit rate numbers: " + outputList.length);
					if (outputList.length == 38) {
						socket.emit('links', links);
					}
				});
			});
		});

		socket.on('redis_update', function() {
			getbps();
		});

		// listen to disconnet information
		socket.on('disconnet', function () {
			console.log("Client has disconnected");
		});
	}
);

console.log('Server started on port 8080');