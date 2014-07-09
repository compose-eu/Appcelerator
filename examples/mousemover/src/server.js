
var express = require('express');
var bodyParser = require('body-parser')
var mgm = require("./manager").get();

var config = require('./config').config;

var log = function() {
    var a = ["Server: "];
    for(var i in arguments)
        a.push(arguments[i]);

    console.log(a);
};

var app = express();
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded() ); // to support URL-encoded bodies

module.exports.get = function() {
    return app;
};

module.exports.start = function() {

    log("Starting");

    app.get("/config.json", function(req, res) {
        res.send(config);
    });

    app.post("/clients/add", function(req, res) {
        if(req.param('soid')) {
            log("Client add " + req.param('soid'));
            mgm.addClient(req.param('soid'));
        }
        res.send(200);
    });

    app.use(express.static(__dirname + '/../public'));

    app.listen(process.env.PORT || config.port);

    console.log("Server started at http://" + config.host + ":" + config.port );

    return app;
};