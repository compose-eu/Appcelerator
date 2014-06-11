/*******************************************************************************
Copyright 2014 CREATE-NET
Developed for COMPOSE project (compose-project.eu)

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

(function() {

    var client = null;
    var reconnectTimes = 5;
    var tries = reconnectTimes;
    
    var Stomp = require("stompjs");
    
    var DEBUG = false;
    var d = function(m) { (DEBUG === true || (DEBUG > 19)) && console.log("[stomp client]" + m); };

    var parseUrl = function(href) {

        var parser = document.createElement('a');
        parser.href = href;

        var o = {
            protocol: null,
            hostname: null,
            port: null,
            pathname: null,
            search: null,
            hash: null,
            host: null
        };

        for(var i in o) {
            if(parser[i]) {
                o[i] = parser[i];
            }
        }

        o.path = o.pathname;
        o.host = o.hostname;

        parser = null;
        return o;
    };


    var adapter = {};
    adapter.initialize = function(compose) {

        DEBUG = compose.config.debug;

        var queue = this.queue;

        compose.config.stomp = compose.config.stomp || {};
        var stompConf = {
            proto: compose.config.stomp.secure ? 'wss' : 'ws',
            host: compose.config.stomp.host || "api.servioticy.com",
            port: compose.config.stomp.port || "8081",
            path: compose.config.stomp.path || "",
        };

        stompConf.path = stompConf.path.length && stompConf.path.substr(0,1) !== '/' ? '/' + stompConf.path  : stompConf.path ;

        var request = {
            meta: {
                authorization: compose.config.apiKey
            },
            body: {}
        };

        adapter.connect = function(handler, connectionSuccess, connectionFail) {

            if (!client || (client && client.connected)) {

                d("[stomp client] Connecting to stomp server " +
                        stompConf.proto +'://'+ stompConf.host + ':' + stompConf.port + stompConf.path);

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

                            message.body = JSON.parse(message.body);
                            if(typeof message.body.messageId !== 'undefined') {
                                message.messageId = message.body.messageId;
                                delete message.body.messageId;
                            }

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
            client.close();
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

            request.messageId = queue.add(handler);

            var ropts = { 
    //            priority: 1 
            };

            d("[stomp client] Sending message..");
            client.send(topics.from, ropts, JSON.stringify(request));

        };
    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = adapter;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return adapter;
            });
        }
        else {
            window.__$$Compose.platforms_stomp_browser = adapter;
        }
    }

})();