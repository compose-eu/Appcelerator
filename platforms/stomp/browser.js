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
    var ws = null;

    var reconnectTimes = 5;
    var tries = reconnectTimes;

    var DEBUG = false;
    var d = function(m) { (DEBUG === true || (DEBUG > 19)) && console.log("[stomp client] " + m); };

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

        var Stomp = require("stompjs");

        DEBUG = compose.config.debug;

        var queue = this.queue;

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
            password: compose.config.stomp.password || "shines",
            path: compose.config.stomp.path || ""
        };
        stompConf.path = stompConf.path.length && stompConf.path.substr(0,1) !== '/' ? '/' + stompConf.path  : stompConf.path ;

        var topics = {
            from: "/topic/" + compose.config.apiKey + '.from',
            to: "/topic/" + compose.config.apiKey + '.to'

            , stream: function(handler) {
                return "/topic/" + compose.config.apiKey + '.' + handler.container().ServiceObject.id +'.updates';
            }

        };

        var request = {
            meta: {
                authorization: compose.config.apiKey
            },
            body: {}
        };

        adapter.connect = function(handler, connectionSuccess, connectionFail) {


            // initialize the client, but only if not connected or reconnecting
            // 0 not yet connected
            // 1 connected
            // 2 closing
            // 3 closed

            var needConnection = function() {

                if(client) {

                    d("WS state " + ws.readyState);
                    switch(ws.readyState) {
                        case 0:

                            d("[ws client] WS is connecting");
                            setTimeout(function() {
                                adapter.connect(handler, connectionSuccess, connectionFail);
                            }, 100);

                            return null;

                            break;
                        case 1:

                            d("[ws client] WS is already connected");
                            return false;

                            break;
                        case 2:
                        case 3:

                            d("[ws client] WS is closed or closing");
                            ws = null;

                            break;
                    }
                }

                return true;
            };

            var needConn = needConnection();

            if(needConn === null) {
                return;
            }

            if (needConn) {

                d("Connecting to stomp server " +
                        stompConf.proto +'://'+ stompConf.host + ':' + stompConf.port + stompConf.path);

                ws = new WebSocket(stompConf.proto + "://" + stompConf.host + ":" + stompConf.port);

//                client.onerror = function(e) {
//
//                    // @TODO: test properly the reconnection beahvior!
//                    if(ws) {
//
//                        if(ws.readyState >= 2 && tries < reconnectTimes){
//                            d("[ws client] Connection lost, try reconnect");
//                            tries--;
//                            adapter.connect(handler, connectionSuccess, connectionFail);
//                            return;
//                        }
//
//                        if(ws.readyState < 2) {
//                            d(e);
//                            handler.emitter.trigger("error", { message: "Websocket error", data: e })
//                            return;
//                        }
//                    }
//
//                    d("[ws client] Connection error");
//                    tries = reconnectTimes;
//                };
//                ws.onopen = function() {
//                    tries = reconnectTimes;
//                };

                client = Stomp.over(ws);

                client.debug = d;

                client.connect({
                        login: stompConf.user,
                        passcode: stompConf.password
                    },
                    function() { //success

                        handler.emitter.trigger('connect', client);

                        d("Subscribe to " + topics.to);
                        client.subscribe(topics.to, function(message) {
                            d("New message from topic " + topics.to);

                            message.body = JSON.parse(message.body);

                            /**
                             * @deprecated Ensure to fix this code once the bridge is stable
                             * */
                            if(typeof message.body.messageId !== 'undefined') {
                                message.messageId = message.body.messageId;
                                delete message.body.messageId;
                            }
                            if(typeof message.headers.messageId !== 'undefined') {
                                message.messageId = message.headers.messageId;
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

            request.meta.messageId = queue.add(handler);

            var ropts = {
    //            priority: 1
            };

            d("Sending message..");
            client.send(topics.from, ropts, JSON.stringify(request));

        };
    };

    /*
     * @param {RequestHandler} handler
     */
    adapter.subscribe = function(handler) {

        var topic = topics[ handler.topic ] ? topics[ handler.topic ] : handler.topic;

        if(typeof topic === 'function') {
            topic = topic(handler);
        };

        d("[stomp client] Listening to " + topic);
        client.subscribe(topic, function(message) {

            d("[stomp client] New message from topic " + topic);
            handler.emitter.trigger('data', message);
        });
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