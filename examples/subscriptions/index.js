
var program = require('commander');
var compose = require("../../index");

var ini = require('ini').parse(require('fs').readFileSync('./config.ini', 'utf-8'));

compose.setup(ini.compose);

var print = function() {
    if(program.verbose && arguments.length)
        console.log.apply(null, arguments);
};

var printErr = function() {
    console.error.apply(null, arguments);
};

var die = function() {
    print.apply(null, arguments);
    process.exit();
};

var create_so = function(definition) {

    var definition = definition || ini.serviceObject.definition;
    if(!definition) {
        die("definition=<path-to-json> has to be provided or set inside config.ini");
    }

    compose.getDefinition(ini.soModel).then(compose.create).then(function(so) {
        print("ServiceObject %s created! \nYou can specify the SO id in config.ini to use it in further subscriptions experiments", so.name);
        print("\nID: \t%s", so.id);
    }).catch(print);
};

var sub_create = function(soid, streamName, type) {

    compose.load(soid).then(function() {
        return this.getStream(streamName).getSubscriptions().refresh();
    })
    .then(function(list) {

        var params = [];
        var type = ini.subscription.type || "http";
        var subDefinition = null;

        switch(type) {
            case "pubsub":

                subDefinition = {
                    "callback":"pubsub",
                    "destination": ini.compose.apiKey
                };

                break;
            case "http":
            default:

                this.getStream(streamName).getChannels().each(function(channel, name) {
                    params.push("{$.channels." + name + ".current-value}");
                });

                subDefinition = {
                    "callback":"http",
                    "destination": ini.subscription.url + "/" + soid + "/" + params.join("/"),
                    "customFields": {
                        "method":"GET"
                    }
                };

                break;
        }

        if(subDefinition) {
            this.getStream(streamName).addSubscription(subDefinition)
            .create()
            .then(function(subscr) {
                print("Created subscription %s, %s", type, subscr.id);
            })
            .catch(function(e) {
                printErr("An error occured!", e);
            });
        }

    });
};

var sub_dropall = function(soid, streamName, subids) {

    subids = subids || null;

    compose.load(soid).then(function() {
        return this.getStream(streamName).getSubscriptions().refresh();
    })
    .then(function() {

        var so = this;

        var list = [];
        if(subids) {
            subids.forEach(function(id) {
                list.push( so.getStream(streamName).getSubscription(id) );
            });
        }
        else {
            list = so.getStream(streamName).getSubscriptions().getList();
        }

        for(var i in list) {

            var item = list[i];

            if(!item || !item.id) {
                continue;
            }

            print("Dropping subscription %s", item);
            item.delete().catch(function(e) {
                printErr("An error occured (" + item.id + ")\n", e);
            });

        }
    })
    .catch(function(e) {
        printErr(e);
    });
};

var sub_listen = function(soid, stream, type) {

    print("Listening for %s updates", type);

    switch(type) {
        case "pubsub":

            compose.load(soid).then(function() {
                return this.getStream(stream).subscribe();
            })
            .then(function(list) {

                this.getStream(stream).on('data', function(data) {
                    print("Data received\n", JSON.stringify(data, null, 2));
                });

            })
            .catch(function(e) {
                printErr("An error occured!", e);
            });

            break;
        case "http":
        default:

            var express = require("express"),
                app = express(),
                bodyParser = require('body-parser'),
                errorHandler = require('errorhandler'),
                methodOverride = require('method-override'),
                port = ini.subscription.port || 9090,
                host = ini.subscription.host || '0.0.0.0'
            ;

            app.get(/([a-z0-9]+)\/(.*)/i, function (req, res) {

                console.log("Received request!");
                console.log("SO id " + req.params[0]);
                console.log("Params " + req.params[1].split('/'));

                res.send(200);
//                res.send(200, "<h1>Received request</h1> <p> SO id: "+ req.params[0]
//                                +" <pre>"
//                                + JSON.stringify(req.params[1].split('/'), null, 2)
//                                + "</pre>");
            });

            app.use(methodOverride());
            app.use(bodyParser());
            app.use(express.static(__dirname + '/public'));
            app.use(errorHandler({
                dumpExceptions: true,
                showStack: true
            }));

            app.listen(port, host);
            print("Server started at http://" + host + ":" + port);

            break;
    };

};

var sub_push = function(soid, streamName) {

    compose.load(soid).then(function(so) {

        var data = {};
        so.getStream(streamName).getChannels().each(function(channel, name) {

            switch(channel.type) {
                case "Number":
                    data[name] = 1.23 + (Math.random() * 100);
                    break;
                case "String":
                    data[name] = "In fermentum nulla sed nulla pellentesque, eget venenatis massa sodales";
                    break;
                case "Boolean":
                    data[name] = ((Math.random() * 10) > 5);
                    break;
            }
        });

        return so.getStream(streamName).push(data);
    })
    .then(function() {
        print("Data sent!");
    })
    .catch(function(e) {
        printErr("An error occured", e);
    });

};

var _g = function(str, o) {
    return str + ' ' + (o ? '['+ o +']' : '');
};

program
  .version('0.0.1')
  .option('-v, --verbose', 'Output additional information')
  .option('-id, --soid <soid>', _g('ServiceObject ID', ini.serviceObject.soid), function(val) {
      if(!val) {
          val = ini.serviceObject.soid;
          if(!val) {
              die("Missing ServiceObject Id");
          }
      }
      return val;
  }, ini.serviceObject.soid)
  .option('-s, --stream <stream>',  _g('ServiceObject stream', ini.serviceObject.stream), function(val) {
      if(!val) {
          val = ini.serviceObject.stream;
          if(!val) {
              die("Missing Stream name");
          }
      }
      return val;
  }, ini.serviceObject.stream)

program
    .command('so-create')
    .description('Create a Service Object')
    .option('-d, --definition <definition>', _g('ServiceObject JSON definition', ini.serviceObject.definition), ini.serviceObject.definition)
    .action(function(){
        create_so(program.definition);
    });

program
    .command('so-push')
    .description('Push test data to a Service Object')
    .action(function(){
        sub_push(program.soid, program.stream);
    });

program
    .command('create')
    .description('Create a subscription')
    .option('-t, --type <type>', _g('Subscription type ', ini.subscription.type), function(val) {
      if(!val) {
          val = ini.serviceObject.soid;
          if(!val) {
              die("Specify a subscription type to continue");
          }
      }
      return val;
    })
    .action(function() {
        sub_create(program.soid, program.stream, program.type);
    });

program
    .command('delete [subId]')
    .description('Delete subscriptions by id')
    .option('-a, --all', 'Delete all')
    .action(function() {

        if(program.args.length || program.all) {
            sub_dropall(program.soid, program.stream, program.args);
        }
        else
            program.outputHelp();

    });

program
    .command('listen <type>')
    .description('Listen for subscription updates [http|subpub]')
    .action(function() {
        sub_listen(program.soid, program.stream, program.args[0] || ini.subscription.type);
    });

program.parse(process.argv);

if(process.argv.length <= 2) {
    program.outputHelp();
}
