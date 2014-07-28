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

    var DEBUG = false;

    var d = function(m) {
        (DEBUG === true || DEBUG > 20) && console.log(m);
    };

    var client = {};
    client.setup = function(compose) {

        var ComposeError = compose.error.ComposeError;
        var guid = function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        };

        if(!compose) {
            throw new ComposeError("compose.io module reference not provided, quitting..");
        }

        DEBUG = compose.config.debug;

        var httpErrors = {
          400: 'Bad Request',
          401: 'Unauthorized',
          402: 'Payment Required',
          403: 'Forbidden',
          404: 'Not Found',
          405: 'Method Not Allowed',
          406: 'Not Acceptable',
          407: 'Proxy Authentication Required',
          408: 'Request Time-out',
          409: 'Conflict',
          410: 'Gone',
          411: 'Length Required',
          412: 'Precondition Failed',
          413: 'Request Entity Too Large',
          414: 'Request-URI Too Large',
          415: 'Unsupported Media Type',
          416: 'Requested range not satisfiable',
          417: 'Expectation Failed',
          500: 'Internal Server Error',
          501: 'Not Implemented',
          502: 'Bad Gateway',
          503: 'Service Unavailable',
          504: 'Gateway Time-out',
          505: 'HTTP Version not supported'
        };


        /**
         * Minimal implementation of an event emitter
         * */
        var Emitter = function() {
            this.callbacks = {};
        };

        Emitter.prototype.on = function(event, callback) {

            if(!this.callbacks[event]) {
                this.callbacks[event] = [];
            }

            this.callbacks[event].push(callback);

            return this;
        };

        Emitter.prototype.once = function(event, callback) {
            var me = this;
            var callback2;
            callback2 = function() {
                me.off(event, callback2);
                callback.apply(me, arguments);
            };

            this.on(event, callback2);

            return this;
        };

        Emitter.prototype.off = function(event, callback) {
            callback = callback || null;

            if(!this.callbacks[event]) {
                return;
            }

            if(!callback) {
                this.callbacks[event] = [];
            }
            else {
                for(var i in this.callbacks[event]) {
                    if(this.callbacks[event][i] === callback) {
                        delete this.callbacks[event][i];
                        this.callbacks[event].splice(i, 1);
                    }
                }
            }

            return this;
        };

        Emitter.prototype.trigger = function(event) {
            if(this.callbacks[event]) {

                var a = [];
                for(var i in arguments) {
                    a[i] = arguments[i];
                }
                a.shift();

                for(var i in this.callbacks[event]) {
                    this.callbacks[event][i].apply(this, a);
                }
            }

            return this;
        };

        /**
         * DataReceiver allows to register ServiceObjects for notifications from QueueManager of incoming data
         * not already handled
         *
         * @constructor
         * */
        var DataReceiver = function() {

            this.defaultTopic = '*';

            this.registry = {};
            this.registry[this.defaultTopic] = [];

        };

        /**
         * Search for SO in list and return its index
         *
         * @argument {ServiceObject} so A ServiceObject instance
         * @return {Number} The index in the list or -1 if not found
         * */
        DataReceiver.prototype.getIndex = function(so, topic) {
            topic = topic || this.defaultTopic;
            var l = this.registry[topic].length;
            for(var i = 0; i < l; i++) {
                if(this.registry[topic][i] === so) {
                    return i;
                }
            }
            return -1;
        };

        /**
         * Add SO to list
         *
         * */
        DataReceiver.prototype.bind = function(so, topic) {
            topic = topic || this.defaultTopic;
            if(this.getIndex(so, topic) < 0) {
                this.registry[topic] = this.registry[topic] || [];
                this.registry[topic].push(so);
            }
        };

        /**
         * Remove SO from list
         *
         * */
        DataReceiver.prototype.unbind = function(so, topic) {
            topic = topic || this.defaultTopic;
            var i = this.getIndex(so, topic);
            if(i > -1) {
                this.registry[topic].splice(i,1);
                if(!this.registry[topic])
                    delete this.registry[topic];
            }
        };

        /**
         * Notify all ServiceObjects in the receiver of an event.
         *
         * @param {String} event The event to trigger
         * @params {mixed} data for the event
         *
         * */
        DataReceiver.prototype.notify = function(topic, event) {

            topic = topic || this.defaultTopic;
            var l = this.registry[topic].length;

            var args = (function() {
                var _a = [];
                for(var i in arguments) {
                    if(i === 0) continue;
                    _a.push(arguments[i]);
                }
               return  _a;
            })();

            for(var i = 0; i < l; i++) {
                var emitter = this.registry[topic][i].emitter();
                emitter && emitter.trigger.apply(emitter, args);
            }
        };


        /**
         * QueueManager handles queue of pub/sub communications.
         *
         * @constructor
         * */
        var QueueManager = function() {

            var me = this;
            var __receiver = null;

            // 60 seconds
            var __timeout = 60*1000;

            // queue[ uuid ] = { created: xxx, callback: xxx }
            var queue = {};
            var queueSize = 0;
            var timer;

            /**
             * Setter/Getter for dataReceiver
             *
             * */
            this.receiver = function(_r) {
                if(_r) __receiver = _r;
                return __receiver;
            };

            /**
             * Setter/Getter for timeout
             *
             * */
            this.timeout = function(_t) {
                if(_t) __timeout = _t;
                return __timeout;
            };

            var clearQueue = function() {

                if(!timer && queueSize > 0) {
                    d("[queue manager] timer started");
                    timer = setInterval(function() {

                        if(queueSize === 0) {
                            d("[queue manager] timer cleared");
                            clearInterval(timer);
                            timer = null;
                            return;
                        }

                        for(var i in queue) {
//                            console.log( queue[i].created + me.timeout(), (new Date).getTime() );
//                            console.log( (queue[i].created + me.timeout()) < (new Date).getTime() );
                            if(!queue[i].keep && (queue[i].created + me.timeout()) < (new Date).getTime()) {
                                d("[queue manager] Pruning " + i);
                                queue[i].handler.emitter.trigger('error', { message: 'Queue timeout', code: 408 });
                                if(queueSize > 0) {
                                    queueSize--;
                                }
                                delete queue[i];
                            }
                        }

                    }, 100);
                }

                return timer;
            };

            this.guid = guid;

            this.add = function(obj) {

                var qItem;
                var _now = (new Date).getTime();

                if(!obj.handler) {
                    qItem = {
                        created: _now, // creation time
                        handler: obj, // the request handler
                        keep: false, // keep forever (eg. for on('data') callbacks)
                        topic: null
                    };
                }
                else {
                    qItem = obj;
                    qItem.created = qItem.created || _now;
                    qItem.keep = (typeof qItem.keep !== 'undefined') ? qItem.keep : false;
                    qItem.topic = qItem.topic || null;
                }

                var uuid = qItem.uuid || this.guid();
                queue[uuid] = qItem;

                queueSize++;
                clearQueue();

                d("[queue manager] Enqueued " + uuid);
                return uuid;
            };

            this.get = function(uuid) {
                clearQueue();
                return queue[uuid] ? queue[uuid].handler : null;
            };

            this.remove = function(uuid) {
                if(queue[uuid] && !queue[uuid].keep) {
                    delete queue[uuid];
                    if(queueSize > 0) queueSize--;
                }
                clearQueue();
            };

            this.clear = function() {
                for(var i in queue) delete queue[i];
                queueSize = 0;
                clearInterval(timer);
                timer = null;
            };

            this.isErrorResponse = function(body) {
                return (body && body.status >= 400);
            };

            this.triggerAll = function() {
                for(var i in queue) {
                    var emitter = queue[i].emitter;
                    var a = [];
                    for(var i in arguments) a[i] = arguments[i];
                    a.push(queue[i]);
                    emitter.trigger.apply(emitter, a);
                }
            };

            /**
             * Normalize the returned body
             *
             * @deprecated Ensure to fix this code once the bridge is stable
             * */
            this.normalizeBody = function(message) {

                if(typeof message.body === 'string') {
                    message.body = JSON.parse(message.body);
                }

                if(message.body && typeof message.body.messageId !== 'undefined') {
                    message.messageId = message.body.messageId;
                    delete message.body.messageId;
                }

                if(message.body.meta && typeof message.body.meta.messageId !== 'undefined') {
                    message.messageId = message.body.meta.messageId;
                    message.body = message.body.body;
                }

                if(message.headers && typeof message.headers.messageId !== 'undefined') {
                    message.messageId = message.headers.messageId;
                }

            };

            this.handleResponse = function(message, raw) {

                var response;
                if(typeof message === 'object') {
                    response = message;
                }

                if(typeof message === 'string') {
                    try {
                        response = JSON.parse(message);
                    }
                    catch (e) {
                        console.error("Error reading JSON response");
                        console.error(e);
//                        d(response);
                        response = null;
                    }
                }

                // uhu?!
                if(!response) {
                    console.log("[queue manager] Message is empty.. skipping");
                    d(response);
                    return;
                }

                this.normalizeBody(response);

                var errorResponse = this.isErrorResponse(response.body);
                if(response.messageId) {

                    var handler = this.get(response.messageId);
                    if(handler) {

                        if(errorResponse) {
                            handler.emitter.trigger('error', response.body);
                        }
                        else {
                            //a callback is provided to handle the dispatch the event
                            if(handler.onQueueData && typeof handler.onQueueData === 'function') {
                                handler.onQueueData.call(handler, response, message);
                            }
                            else {
                                handler.emitter.trigger('success', response.body);
                            }
                        }

                        d("[queue manager] Message found, id " + response.messageId);
                        this.remove(response.messageId);
                        delete response.messageId;

                        return true;
                    }

                }

                d("[queue manager] Message not found, id " + ((response.messageId) ? response.messageId : '[not set]'));
//                this.triggerAll('data', response, message);
                this.receiver() && this.receiver().notify('data', response, message);

                return false;
            };

            this.registerSubscription = function(topic, handler) {

                var uuid = handler.uuid || topic;
                this.add({
                    handler: handler,
                    keep: true,
                    uuid: uuid,
                });

                return uuid;
            };

        };

        var RequestHandler = function() {
            this.emitter = null;
        };

        /**
         * Set the Client container instance
         *
         * */
        RequestHandler.prototype.container = function(_c) {
            if(_c) {
                this.__$container = _c;
                this.emitter = _c.ServiceObject.emitter();
            }
            return this.__$container;
        };

        RequestHandler.prototype.setConf = function(conf) {
            for(var i in conf) {
                this[i] = conf[i];
            }
        };

        RequestHandler.prototype.parseError = function(error) {

            var errorObject = function(message, data, code) {

                if(code && !message) {
                    message = httpErrors[code];
                }

                return {
                    message: message || "Unknown error",
                    code: code || null,
                    data: data || {}
                };
            };

            if(error && error.message) {
                error = errorObject(error.message, error.data, error.code);
            }
            else {
                if(typeof error === 'string') {
                    try {
                        var json = JSON.parse(error);
                        error = errorObject(json.message, json.info, json.status);
                    }
                    catch(jsonError) {
                        error = errorObject("An error occured", error);
                    }
                }
            }

            return error;
        };

        RequestHandler.prototype.parseSuccess = function(body) {

            var data = body;

            if(!data) {
                return null;
            }

            if(typeof body === 'string') {
                try {
                    var data = JSON.parse(body);
                }
                catch (e) {
                    console.log("Error parsing JSON", e);
                    data = null;
                }
            }
            return data;
        };


        var dataReceiver = new DataReceiver();

        var queueManager = new QueueManager();
        queueManager.receiver(dataReceiver);

        /**
         * The base library client interface
         *
         * @constructor
         * @argument {ServiceObject} so The ServiceObject instance to bind the client
         */
        var Client = function(so) {

            var adapter;
            this.adapter = function() {
                if(!adapter) {
                    adapter = compose.util.requireModule(null, compose.util.getAdapterPath());
                }
                return adapter;
            };

            this.ServiceObject = so;
            this.queue = queueManager;

            this.requestHandler = new RequestHandler();
            this.requestHandler.container(this);

            this.initialize();
        };

        Client.prototype.initialize = function() {
            this.adapter().initialize && this.adapter().initialize.call(this, compose);
        };

        Client.prototype.connect = function() {
            var me = this;
            return new compose.lib.Promise(function(success, failure) {
                me.adapter().connect(me.requestHandler, success, failure);
            });
        };

        Client.prototype.disconnect = function() {
            if(this.adapter().disconnect){
                return this.adapter().disconnect(this.requestHandler);
            }
            return false;
        };

        Client.prototype.request = function(method, path, body, success, error) {

            var me = this;
            me.requestHandler.setConf({
                method: method,
                path: path,
                body: body
            });

            d("[client] Requesting " + this.requestHandler.method + " " + this.requestHandler.path);

            success && me.requestHandler.emitter.once('success', success);
            error && me.requestHandler.emitter.once('error', error);

            this.connect()
                .then(function() {
                    me.adapter().request(me.requestHandler);
                })
                .catch(function(err) {
                    d("Connection error");
                    d(err);
                    throw new compose.error.ComposeError(err);
                });
        };

        Client.prototype.subscribe = function(conf) {

            var me = this;
            me.requestHandler.setConf(conf);

            d("[client] Add listener to topic");

            this.connect()
                .then(function() {
                    me.adapter().subscribe && me.adapter().subscribe(me.requestHandler);
                })
                .catch(function(err) {
                    d("Connection error");
                    d(err);
                    throw new compose.error.ComposeError(err);
                });
        };

        Client.prototype.post = function(path, data, success, error) {
            return this.request('post', path, data, success, error);
        };

        Client.prototype.get = function(path, data, success, error) {
            return this.request('get', path, data, success, error);
        };

        Client.prototype.put = function(path, data, success, error) {
            return this.request('put', path, data, success, error);
        };

        Client.prototype.delete = function(path, data, success, error) {
            return this.request('delete', path, data, success, error);
        };

        compose.util.queue = queueManager;
        compose.util.receiver = dataReceiver;

        client.Client = Client;
        client.RequestHandler = RequestHandler;
        client.Emitter = Emitter;
        client.QueueManager = QueueManager;

    };



    //-- multiplatform support
    (function(libname, lib, deps) {
        deps = (deps instanceof Array) ? deps : ['compose'];
        if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
            module.exports = lib;
        }
        else {

            if (typeof define === 'function' && define.amd) {
                define(deps, function(compose) {
                    return lib;
                });
            }
            if(typeof window !== 'undefined') {
                window.__$$composeioRegistry[libname] = lib;
            }
        }
    })
    ('client', client);
    //-- !multiplatform support



})();