
var compose = require("compose.io");

var ini = require('ini').parse(require('fs').readFileSync('./config.ini', 'utf-8'));
compose.setup(ini.compose);

ini.port = ini.port || 9090;

var cli = function() {
    
    var create_so = function() {
        if(!ini.soModel) {
            console.log("soModel=<path-to-json> has to be set inside config.ini");
            return;
        }
        compose.getDefinition(ini.soModel).then(compose.create).then(function(so) {
            console.log("Created " + so.name + " - id " + so.id);
            console.log("You can specify the SO id in config.ini to use it for further subscriptions experiments");
            
        }).catch(console.log);
    };
    
    var sub_create = function(soid) {
        compose.load(soid).then(function(so) {
            return so.getStream('location').getSubscriptions().refresh();
        })
        .then(function(list) {

//            console.log(list, this.getStream("location").getSubscriptions().getList());

            this.getStream('location').addSubscription({
                "callback":"http",
                "destination": ini.subscription.url +"/"+soid+"/@latitude@/@longitude@",
                "customFields": {
                    "aliases": [
                        { "##": "{$.channels.", "!!": ".current-value}" },
                        {"@latitude@": "##latitude!!"},
                        {"@longitude@": "##longitude!!"}
                    ],
                    "method":"GET"
                }
            })
            .create()
            .then(function(subscr) {
                console.log("CREATED subscription " + subscr.id);
            });


        });
    };

    var sub_dropall = function(soid) {
        compose.load(soid).then(function(so) {
            return so.getStream('location').getSubscriptions().refresh();
        })
        .then(function() {
            var list = this.getStream("location").getSubscriptions().getList();
            for(var i in list) {
                console.log("Dropping sub " + list[i].id);
                list[i].delete();
            }
        });
    };

    var sub_listen = function() {
        var express = require("express"),
            app = express(),
            bodyParser = require('body-parser'),
            errorHandler = require('errorhandler'),
            methodOverride = require('method-override'),
            port = ini.port;

        app.get("/:soid/:lat/:lng", function (req, res) {

            console.log(req.param("soid"));
            console.log(req.param("lat"));
            console.log(req.param("lng"));
            res.send(200, "Received");
        });

        app.use(methodOverride());
        app.use(bodyParser());
        app.use(express.static(__dirname + '/public'));
        app.use(errorHandler({
          dumpExceptions: true,
          showStack: true
        }));

        app.listen(port, '0.0.0.0');
        console.log("server started at " + port);
    };

    var sub_push = function() {

        compose.load(soid).then(function(so) {
            var data = {
                latitude: 11.12346 + Math.random(),
                longitude: 45.12346 + Math.random()
            };
            console.log(data);
            return so.getStream('location').push(data);
        })
        .then(function() {
            console.log("Data sent!");
        });

    };


    var testserver = function() {
        var express = require("express"),
            app = express(),
            bodyParser = require('body-parser'),
            errorHandler = require('errorhandler'),
            methodOverride = require('method-override'),
            port = ini.port;

        app.use(methodOverride());
        app.use(bodyParser());
        app.use(express.static(__dirname + '/tmp'));
        app.use(errorHandler({
          dumpExceptions: true,
          showStack: true
        }));

        app.listen(port, '0.0.0.0');
        console.log("server started at " + port);
    };

    var get_soid = function() {
        var soid = process.argv[3];
        if(!soid)
            if(ini.soid)
                return ini.soid;
            else return false;
        return soid;
    };
    
    var cmd = process.argv[2];
    switch (cmd) {
        case "so-create":
            console.log(cmd);
            create_so();
            break;
        case "sub-create":
            var soid = get_soid();
            if(!soid) {
                console.log("Please, specify as service object ID");
                return;
            }
            console.log(cmd);
            sub_create(soid);
            break;
        case "sub-listen":
            var soid = get_soid();
            if(!soid) {
                console.log("Please, specify as service object ID");
                return;
            }            
            console.log(cmd);
            sub_listen(soid);
            break;
        case "sub-push":
            var soid = get_soid();
            if(!soid) {
                console.log("Please, specify as service object ID");
                return;
            }            
            console.log(cmd);
            sub_push(soid);
            break;
        case "sub-dropall":
            var soid = get_soid();
            if(!soid) {
                console.log("Please, specify as service object ID");
                return;
            }            
            console.log(cmd);
            sub_dropall();
            break;
        case "test-server":
            console.log(cmd);
            testserver();
            break;
        default:

            if(cmd) console.log(cmd + ": command unknown");
            
            console.log("USAGE: node test.js <cmd>\n \
            \n\
    so-create          : create a  test service object\n\
    sub-create  [soid] : create a  test subscription\n\
    sub-push    [soid] : push some test data\n\
    sub-listen  [soid] : listen for subscription updates\n\
    sub-dropall [soid] : drop all created subscriptions\n\n");

            break;
    }

};

cli();
