
var DEBUG = true;
var api;

var Game = function() {

    this.miceModel = {
        "name": "mice",
        "description": "your mice",
        "URL": "/dev/mouse",
        "public": false,
        "streams": {
            "position": {
                "description": "Position in the area",
                "type": "sensor",
                "channels": {
                    "x": {
                        "type": "Number",
                        "unit": "pixel"
                    },
                    "y": {
                        "type": "Number",
                        "unit": "pixel"
                    }
                }
            },
            "points": {
                "description": "Player points",
                "type": "sensor",
                "channels": {
                    "points": {
                        "type": "Number",
                        "unit": "point"
                    },
                }
            }
        }
    };

    // the ServiceObject instance
    this.mice = null;

    this.lastUpdate = (new Date()).getTime();
    this.minInterval = 1000;

    this.initialize();
};

Game.prototype.error = function(msg) {
    console.error(msg);
};

Game.prototype.log = function() {
    DEBUG && console.info.apply(null, arguments);
};

Game.prototype.getMice = function(then) {

    var me = this;
    var soid = localStorage.getItem("miceId");

    me.log("Loading mice");

    var onLoad = function(so) {

        me.log("Got mice " + so.id);

        localStorage.setItem("miceId", so.id);
        me.mice = so;

        me.$.post('/clients/add', { soid: so.id }, function() {
            then && then(so);
        });

    };

    if(soid) {
        me.log("Existing mice " + soid);
        api.load(soid).then(onLoad).catch(this.error);
        return;
    }
    else {
        me.log("New mice");
        api.create(me.miceModel).then(onLoad).catch(this.error);
    }

};

Game.prototype.updatePosition = function(ev) {

    var me = this;
    var x = ev.pageX, y = ev.pageY;

    me.log("Update position");
    if(me.mice && ((new Date()).getTime() - me.lastUpdate) > me.minInterval) {

        me.mice.getStream("position").push({x: x, y: y})
            .then(function() {
                me.lastUpdate = (new Date()).getTime();
                me.log("Position updated ", [x, y]);
            })
            .catch(me.error);
    }

};

Game.prototype.start = function() {

    var me = this;
    me.getTarget(function(){

        me.log("got target, subscribe to position");

        me.target.getStream('position').subscribe(function(data) {
            me.log("Target DATA!");
            me.log(data);
        });

        me.getMice(function() {

            me.$(window).on('mousemove', function(e) {
                me.updatePosition(e);
            });

            // me.getPeople(function() {});

        });
    });
};

Game.prototype.getPeople = function(then) {
//    api.list()
//        .then(function() {
//
//        })
//        .catch(this.error);
};

Game.prototype.getTarget = function(then) {
    var me = this;

    if(me.target) {
        then(me.target);
        return ;
    }

    me.log("Load target " + me.config.targetSo);
    api.load(me.config.targetSo)
        .then(function(so) {
            me.target = so;
            then(so);
        })
        .catch(function(e) {
            me.error(e);
            then(null);
        });
};

Game.prototype.initialize = function() {
    var me = this;

    jQuery(function($) {
        $.getJSON('/config.json', function(config) {

            me.config = config;
            me.$ = $;

            compose.setup(me.config.compose).then(function(_api) {
                api = _api;
                me.start();
            });

        });
    });
};

var game = new Game();