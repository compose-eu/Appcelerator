
var DEBUG = true;

var fs = require("fs");
var composelib = require("../../../index");
var config = require('./config').config;

//config.compose.transport = 'stomp';
//config.compose.transport = 'mqtt';

var compose;

config.compose.debug = true;
//config.compose.debug = false;


    var soModel = require('../fruit.so');

    var lib = {};

    var Manager = function() {

        this.debug = DEBUG;
        this.so = null;
        this.clients = {};

        this.initialize();
    };

    Manager.prototype.initialize = function() {
        var me = this;
        composelib.setup(config.compose).then(function(api) {
            compose = api;

            me.getSo(function(err, so) {

                if(err) {
                    me.log("An error occured", err);
                    return;
                }


                setInterval(function() {
                    var p = me.hasPlayers();
                    if(p) {
                        me.log("Got players, moving target");
                        me.moveTarget();
                    }
                }, 3000);

            });
        });
    };

    Manager.prototype.moveTarget = function() {
        var me = this;

        var x = Math.round(Math.random() * 1000);
        var y = Math.round(Math.random() * 1000);

        this.getSo(function(err, so) {

            so.getStream('position').push({
                x: x,
                y: x
            }).then(function() {
                me.log("Sent new position ", [x, y] );
            });
        })
    };

    Manager.prototype.hasPlayers = function() {
        for(var i in this.clients)
            return true;

        return false;
    }

    Manager.prototype.log = function() {
        if(this.debug) {

            var a = ["Manager: "];
            for(var i in arguments)
                a.push(arguments[i]);

            console.log.apply(null, a);
        }
    };

    Manager.prototype.getSo = function(cb) {
        var me = this;

        if(this.so) {
            cb(null, this.so);
            return;
        }

        var file = 'soid.tmp';
        fs.readFile(file, function(err, soid) {

            if(err) {
                compose.create(soModel).then(function(so) {
                    me.log("Saving SO id");
                    fs.writeFile(file, so.id, function(err) {
                        if(err) console.log("Error saving so.id to cache file");
                        me.log("Id " + so.id);
                        me.so = so;
                        cb(null, so);
                    });

                }).catch(function(err) {
                    me.so = null;
                    cb(err, null);
                });

                return;
            }

            me.log("Loading SO id " + soid);
            compose.load(soid).then(function(so) {
                me.so = so;
                cb(null, so);
            }).catch(function(err) {
                me.so = null;
                cb(err, null);
            });

        });
    };

    Manager.prototype.addClient= function(soid) {

        var me = this;

        if(this.clients[soid]) {
            this.log("Already registered!");
            return;
        }

        me.log("Adding client " + soid);
        compose.load(soid)
            .then(function(so) {

                me.log("Done");
                me.clients[so.id] = so;

                so.getStream('position').subscribe(function(data) {
                    console.log("GOT DATA!", data);
                }).then(function() {
    //                console.log(so.getStream('position').getSubscriptions());
                });

            })
            .catch(function(e) {
                console.log("An error occured", e);
            });
    };

var instance = null;

module.exports.Manager = Manager;
module.exports.get = function() {

    if(instance) return instance;

    instance = new Manager();
    return instance;
};