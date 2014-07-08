
var DEBUG = true;

var fs = require("fs");
var compose = require("compose.io");
var config = require('./config').config;

//config.compose.transport = 'stomp';
config.compose.transport = 'mqtt';
config.compose.debug = true;
//config.compose.debug = false;

compose.setup(config.compose);

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
    this.getSo(function(err, so) {
        if(err) {
            me.log("An error occured", err);
            return;
        }
    });

};

Manager.prototype.log = function() {
    if(this.debug) {

        var a = ["[Manager: ]"];
        for(var i in arguments)
            a.push(arguments[i]);

        console.log(a);
    }
};

Manager.prototype.getSo = function(cb) {

    if(this.so) {
        cb(null, this.so);
        return;
    }

    var me = this;

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