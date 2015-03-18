/*******************************************************************************
Copyright 2015 CREATE-NET
Developed for COMPOSE project (compose-project.eu)

@author Luca Capra <luca.capra@create-net.org>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
******************************************************************************/


var DEBUG = false;
//DEBUG = true;

var d = function(m) { (DEBUG === true || (DEBUG > 19)) && console.log("[stomp client] " + m); };

var Stomp = require("stompjs");
var parseUrl = require("url").parse;

var parseResponseContent = function(message) {

    var response = {
        type: null,
        meta: {},
        body: {}
    };

    if(!message) {
        return response;
    }

    // parts 0 is header, 1 is body
    var parts = message.split("\n\n");

    var headerparts = parts[0].split("\n");

    // first is type(?), see spec
    response.type = headerparts.shift();

    for (var i in headerparts) {
        var keyval = headerparts[i].match(/^(.+)\:(.*)$/);
        response.meta[keyval[1]] = keyval[2];
    }

    response.body = parts[1] ? JSON.parse(parts[1]) : {};

    return response;
};

var client;

var adapter = module.exports;
adapter.initialize = function(compose) {

    DEBUG = compose.config.debug;

    var queue = this.queue;

    var request = {
        meta: {
            authorization: compose.config.apiKey
        },
        body: {}
    };

    var host;
    if (compose.config.url) {
        var urlinfo = parseUrl(compose.config.url);
        host = urlinfo.hostname;
    }

    compose.config.stomp = compose.config.stomp || {};
    var stompConf = {
        proto: compose.config.stomp.secure ? 'wss' : 'ws',
        host: host || "api.servioticy.com",
        port: compose.config.stomp.port || "61623",
        user: compose.config.stomp.user || "compose",
        password: compose.config.stomp.password || "shines"
    };

    var request = {
        meta: {
            authorization: compose.config.apiKey
        },
        body: {}
    };

    var topics = {

        from: "/topic/" + compose.config.apiKey + '.from'
        , to: "/topic/" + compose.config.apiKey + '.to'

        , stream: function(handler) {
            return "/topic/" + compose.config.apiKey + '.' + handler.container().ServiceObject.id +'.streams.'+ handler.stream.name +'.updates';
        }

    };

    adapter.connect = function(handler, connectionSuccess, connectionFail) {

        d("Connection requested");

        // initialize the client, but only if not connected or reconnecting
        if (!client || (client && !client.connected)) {

            d("Connecting to server " +
                    stompConf.proto + "://" + stompConf.user + ":" + stompConf.password +
                    "@" + stompConf.host + ":" + stompConf.port);

            client = Stomp.overWS(stompConf.proto + "://" + stompConf.host + ":" + stompConf.port);

            client.connect({
                    login: stompConf.user,
                    passcode: stompConf.password
                },
                function() { //success

                    handler.emitter.trigger('connect', client);

                    d("[stomp client] Subscribe to " + topics.to);
                    client.subscribe(topics.to, function(message) {
                        d("[stomp client] New message from topic " + topics.to);
                        queue.handleResponse(message);
                    });

                    // return promise
                    connectionSuccess();

                },
                function(e) { // error

                    connectionFail(e);
                    handler.emitter.trigger('error', e);
                }
            );

        }
        else {
            // already connected
            connectionSuccess();
        }
    };

    adapter.disconnect = function() {
        queue.clear();
        client.disconnect(function() {
            // done
        });
    };

    /*
     * @param {RequestHandler} handler
     */
    adapter.request = function(handler) {

        request.meta.method = handler.method.toUpperCase();
        request.meta.url = handler.path;

        if (handler.body) {
            var body = handler.body;
            if (typeof body === "string") {
                body = JSON.parse(body);
            }
            request.body = body;
        }
        else {
            delete request.body;
        }

        request.meta.messageId = queue.add(handler);

        var ropts = {
//            priority: 1
        };

        d("[stomp client] Sending message..");
        client.send(topics.from, ropts, JSON.stringify(request));

    };

    /*
     * @param {RequestHandler} handler
     */
    adapter.subscribe = function(handler) {

        var topic = topics[ handler.topic ] ? topics[ handler.topic ] : handler.topic;
        if(typeof topic === 'function') {
            topic = topic(handler);
        };

        var uuid = queue.registerSubscription(topic, handler);

        d("[stomp client] Listening to " + topic);
        client.subscribe(topic, function(message) {
            d("[stomp client] New message from topic " + topic);
            message.messageId = uuid;
            queue.handleResponse(message);
        });
    };


};

