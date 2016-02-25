// The file system module
var fs = require('fs');

var http = require('http');
var path = require('path');

// load restler
var rest = require('restler');

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

					var nodes = [];
					var links = [];
					var lsps = [];
					var header = {Authorization: data.token_type + " " + data.access_token};

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
							if (links[i].intA == dst || links[i].intZ == dst) {
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
									intA: data[i].endA.ipv4Address.address,
									intZ: data[i].endZ.ipv4Address.address
								};

								links.push(link);
							}

							// console.log(links);
							socket.emit('links', links);
							console.log('Links information got and sent to client');

							// getting lsps information
							rest.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps', {
								headers: header
							}).on('complete', function(data) {
								for (var i = 0; i < 88; i++) {
									if (data[i].name.includes("GROUP_ELEVEN")) {
										// console.log(data[i].liveProperties.ero);
										var lsp = {
											id: data[i].lspIndex,
											name: data[i].name,
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

		// listen to disconnet information
		socket.on('disconnet', function () {
			console.log("Client has disconnected");
		})
	}
);

console.log('Server started on port 8080');