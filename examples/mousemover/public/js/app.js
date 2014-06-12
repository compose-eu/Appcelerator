
var debug = true;
//var apiKey = "MDNkYjI5YzYtNTY3Zi00MDJlLTgxYWUtNDEzZDhjZTE4MmFkODY3NzBmZTYtMDY1YS00ZGZjLWI4MWYtODVlNjk5NDA5NmFj";
var apiKey = "YjVmMWExOWMtNjFlYS00Yjc0LTk2ZjQtYWUwYzQyYmFhYWRkNDc3N2I2NjMtMWE4MS00MzZjLTlkN2MtYjBmNmY4MTc1MTE4";

var composeConf = {
    url: "http://192.168.9.243:8080",
    apiKey: apiKey,
    debug: debug,
    transport: "stomp",
    stomp: {
        host: "192.168.9.243"
    },
    mqtt: {
        host: "192.168.9.243"
    }
};

var Game = function() {

    this.miceModel= {
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
    debug && console.info.apply(null, arguments);
};

Game.prototype.getMice = function(then) {
    
    var me = this;
    var soid = localStorage.getItem("miceId");
    
    me.log("Loading mice");
    
    var onLoad = function(so) {
        me.log("Got mice " + so.id);
        localStorage.setItem("miceId", so.id);
        me.mice = so;
        then && then(so);
    };
    
    if(soid) {
        me.log("Existing mice " + soid);
        compose.load(soid).then(onLoad).catch(this.error);
        return;
    }
    else {
        me.log("New mice");
        compose.create(me.miceModel).then(onLoad).catch(this.error);
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
    me.getMice(function() {
        
        me.$(window).on('mousemove', function(e) {
            me.updatePosition(e);
        });
        
        me.getPeople(function() {
            
        });
        
    });

};

Game.prototype.getPeople = function(then) {
    compose.list()
        .then(function() {
            
        })
        .catch(this.error);
};

Game.prototype.initialize = function() {
    var me = this;
    compose.ready(function() {
        
        compose.setup(composeConf);

        jQuery(function($) {
            me.$ = $;
            me.start();
        });
    });
};

var game = new Game();