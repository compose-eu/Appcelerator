var config = {
    host: 'localhost',
    port: 8090
};

var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

app.listen(process.env.PORT || config.port);

console.log("Server started at http://" + config.host + ":" + config.port );