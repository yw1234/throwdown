var redis = require("redis"),
    client = redis.createClient(6379, '10.10.4.252');

client.keys('*', function (err, keys) {
  if (err) return console.log(err);
  console.log(keys);

  // client.lrange(keys[0], 0, -1, function(err, values){
  // 	// console.log(err);
  // 	console.log(JSON.parse(values[0]));
  // });

  console.log(client.lrange(keys[0], 0, -1));

  // client.hgetall(keys[0], function (err, dbset) {
  // 	console.log(err);
  // 	console.log(dbset);
  // });
}); 

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

// client.on("error", function (err) {
//     console.log("Error " + err);
// });

// client.set("string key", "string val", redis.print);
// client.hset("hash key", "hashtest 1", "some value", redis.print);
// client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
// client.hkeys("hash key", function (err, replies) {
//     console.log(replies.length + " replies:");
//     replies.forEach(function (reply, i) {
//         console.log("    " + i + ": " + reply);
//     });
//     client.quit();
// });