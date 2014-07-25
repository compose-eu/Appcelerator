(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){

; ;__browserify_shim_require__=require;(function browserifyShim(module, define, require) {
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
(function(){

    var DEBUG = false;
    var d = function(m) { DEBUG === true || DEBUG > 10 && console.log(m); };

    var solib = {};
    solib.setup = function(compose) {

        var Promise = compose.lib.Promise;
        var ComposeError = compose.error.ComposeError;
        var ValidationError = compose.error.ValidationError;
        var Emitter = compose.lib.Client.Emitter;


        /**
         *
         * @constructor
         * */
        var Subscription = function() {
            if(this instanceof Subscription) {
                var args = arguments[0] && typeof arguments[0] === 'object' ? arguments[0] : {};
                this.initialize(args);
            }
        };

        Subscription.prototype.__$container;

        Subscription.prototype.container = function(o) {
            this.__$container = o || this.__$container;
            return this.__$container;
        };

        Subscription.prototype.initialize = function(object) {
            for(var i in object) {
                this[i] = object[i];
            }
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        Subscription.prototype.toJson = function(asString) {
            var json = compose.util.copyVal(this);
            return asString ? JSON.stringify(json) : json;
        };

        Subscription.prototype.toString = function() {
            return this.toJson(true);
        };

        /**
         * Create a ServiceObject subscription
         *
         * @return {Promise} Promise callback with result
         */
        Subscription.prototype.create = function() {
            var me = this;
            var so = me.container().container();
            return new Promise(function(resolve, reject) {

                var url = '/'+so.id+'/streams/'+ me.container().name
                                +'/subscriptions'+ (me.id ? '/'+me.id : '');

                so.getClient().post(url, me.toJson(), function(data) {

                    me.id = data.id;
                    me.created = data.id;

                    resolve && resolve(me, me.container());

                }, reject);
            }).bind(so);
        };

        /**
         * Update a ServiceObject subscription
         *
         * @return {Promise} Promise callback with result
         */
        Subscription.prototype.update = function() {
            var me = this;
            var so = me.container().container();
            return new Promise(function(resolve, reject) {

                if(!me.id) {
                    throw new ComposeError("Subscription must have an id");
                }

                var url = '/subscriptions/'+ me.id;
                so.getClient().put(url, me.toJson(), function(data) {
                    resolve(data);
                }, reject);
            }).bind(so);
        };

        /**
         * Delete a ServiceObject subscription
         *
         * @return {Promise} Promise callback with result
         */
        Subscription.prototype.delete = function() {
            var me = this;
            var so = me.container().container();
            return new Promise(function(resolve, reject) {

                if(!me.id) {
                    throw new ComposeError("Subscription must have an id");
                }

                var url = '/subscriptions/'+ me.id;

                so.getClient().delete(url, null, function() {

                    var stream = me.container();
                    stream.getSubscriptions().remove(me);

                    resolve();
                }, reject);
            }).bind(so);
        };

        /**
         *
         * List of Subscriptions
         *
         * @constructor
         * @augments WebObject.StreamList
         */
        var SubscriptionList = function() {
            compose.util.List.ArrayList.apply(this, arguments);
        };
        compose.util.extend(SubscriptionList, compose.util.List.ArrayList);

        SubscriptionList.prototype.validate = function(obj) {
            var sub = new Subscription(obj);
            sub.container(this.container());
            return sub;
        };

        /**
         * Load all the ServiceObject subscriptions
         *
         * @return {Promise} Promise callback with result
         */
        SubscriptionList.prototype.refresh = function() {
            var me = this;
            var so = me.container().container();
            return new Promise(function(resolve, reject) {
                var url = '/'+so.id+'/streams/'+ me.container().name +'/subscriptions/';
                so.getClient().get(url, null, function(data) {
                    me.initialize(data.subscriptions);
                    resolve(me, me.container());
                }, reject);
            }).bind(so);
        };

        /**
         * @constructor
         * */
        var Actuation = function() {
            if(this instanceof Actuation) {
                var args = arguments[0] ? arguments[0] : {};
                this.initialize(args);
            }
        };

        Actuation.prototype.__$container;
        /**
         *
         * @param {Stream} Optional, a Stream object
         * @returns {Stream} The parent object
         */
        Actuation.prototype.container = function(o) {
            this.__$container = o || this.__$container;
            return this.__$container;
        };

        /**
         * Set the values of the object passed as argument
         *
         * @param {Object} object A plain object with actuations properties
         */
        Actuation.prototype.initialize = function(object) {
            for(var i in object) {
                this[i] = object[i];
            }
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        Actuation.prototype.toJson = function(asString) {
            var json = compose.util.copyVal(this);
            return asString ? JSON.stringify(json) : json;
        };

        Actuation.prototype.toString = function() {
            return this.toJson(true);
        };


        /**
         * Invoke the ServiceObject action
         *
         * @return {Promise} Promise callback with result
         */
        Actuation.prototype.invoke = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                var url = '/'+ me.container().id +'/actuations/'+ me.name;
                me.container().getClient().post(url, null, function(data) {

                    me.id = data.id;
                    me.createdAt = data.createdAt;

                    resolve && resolve(me);
                }, reject);
            });
        };

        /**
         * Reset the status of an actuation
         * */
        Actuation.prototype.reset = function() {
            this.id = null;
            this.createdAt = null;
        };

        /**
         * Get the status of an actuation
         *
         * @return {Promise} Promise callback with result
         */
        Actuation.prototype.status = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!me.id) {
                    throw new ComposeError("Actuation must have an id, have you invoked it first?");
                }

                var url = '/actuations/'+ me.id;
                me.getClient().get(url, null, function(data) {
                    if(data.status === 'completed') {
                        me.reset();
                    }
                    resolve(data.status, data);
                }, reject);
            });
        };

        /**
         * Cancel a launched actuation
         *
         * @return {Promise} Promise callback with result
         */
        Actuation.prototype.cancel = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!me.id) {
                    throw new ComposeError("Actuation must have an id, have you invoked it first?");
                }

                var url = '/actuations/'+ me.id;
                me.getClient().delete(url, null, function(data) {
                    if(data.status === 'cancelled') {
                        me.reset();
                    }
                    resolve(data.status, data);
                }, reject);
            });
        };

        /**
         *
         * List of Actuations
         *
         * @constructor
         * @augments compose.util.List.ArrayList
         */
        var ActuationList = function() {
            compose.util.List.ArrayList.apply(this, arguments);
        };
        compose.util.extend(ActuationList, compose.util.List.ArrayList);

        ActuationList.prototype.validate = function(obj) {
            var action = new Actuation(obj);
            action.container(this.container());
            return action;
        };

        /**
         * Load all the ServiceObject actuations
         *
         * @return {Promise} Promise callback with result
         */
        ActuationList.prototype.refresh = function() {
            var me = this;
            return new Promise(function(resolve, reject) {
                var url = '/'+me.container().id+'/actuations';
                me.container().getClient().get(url, null, function(data) {
                    me.container().setActions(data.actions);
                    resolve(data.actions);
                }, reject).bind(me.container());
            });
        };

        /**
         *
         * @param {Array} data A list of values
         * @returns {DataBag} An object containing the data
         */
        var DataBag = function(data) {
            this.__$list = (data && data.length) ? data : [];
            this.__$container = null;
        };
        compose.util.extend(DataBag, compose.util.List.Enumerable);

        /**
         * @return {Stream} A reference to the source stream
         * */
        DataBag.prototype.container = function($__c) {
            if($__c) this.__$container = $__c;
            return this.__$container;
        };

        /**
         * Return an object at a specific index
         * */
        DataBag.prototype.at = function(i) {
            return this.get(i);
        };

        /**
         * Return an object in the list. If index is not provided, the current cursor position will be used
         *
         * @param {Number} index Optional, index in the list
         * @param {String} channel The channel name
         * @param {mixed} defaultValue A default value if the requested channel is not available
         *
         * @returns {Object|mixed} A value set if index is provided, if channel is provided, its value
         */
        DataBag.prototype.get = function(index, channel, defaultValue) {

            if(arguments[0]*1 !== arguments[0]) {
                return this.get(this.index(), arguments[0], arguments[1]);
            }

            defaultValue = (typeof defaultValue === 'undefined') ? null : defaultValue;

            var list = this.getList();
            var data = list[index];
            if(data) {

                var channels = data.channels;

                if(!channels) return null;

                if(channel && typeof channels[channel] !== 'undefined') {
                    return channels[channel]['current-value'];
                }

                // add a get function to retrieve a single value without the full json path
                data.get = function(_channel, _defaultValue) {

                    _defaultValue = (typeof _defaultValue === 'undefined') ? null : _defaultValue;

                    if(_channel && data.channels[_channel] && typeof data.channels[_channel] !== 'undefined') {
                        return data.channels[_channel]['current-value'];
                    }

                    return _defaultValue;
                };
                return data;
            }

            return null;
        };

        /**
         *
         * A Stream object
         *
         * @constructor
         * @param {Object} obj An object with the Stream properties
         * @augments WebObject.Stream
         */
        var Stream = function(obj) {
            compose.lib.WebObject.Stream.apply(this, arguments);
            this.initialize(obj);
        };

        compose.util.extend(Stream, compose.lib.WebObject.Stream);

        Stream.prototype.__$subscriptions;
        Stream.prototype.__$pubsub = null;

        Stream.prototype.initialize = function(obj) {

            obj = obj || {};

            this.__$parent.initialize.call(this, obj);

            var subscriptions = new SubscriptionList(obj.subscriptions || {});
            subscriptions.container(this);
            this.__$subscriptions = subscriptions;

            this.__$emitter = new Emitter;

            return this;
        };

        Stream.prototype.emitter = function() {
            return this.__$emitter;
        };

        Stream.prototype.getSubscriptions = function() {
            return this.__$subscriptions;
        };

        Stream.prototype.setSubscriptions = function(list) {
            for(var i in list) {
                this.getSubscriptions().add(list[i]);
            }
            return this;
        };

        /**
         * Get a subscriptions by id
         *
         * @param {mixed} value The id value
         * @param {mixed} key The key of the subscription object to match with `value`
         *
         * @return {Subscription} A subscription if found
         */
        Stream.prototype.getSubscription = function(value, key) {
            key = key || 'id';
            return this.getSubscriptions().get(value, key);
        };

        /**
         * Add a subscriptions
         *
         * @param {mixed} object An object with the Subscription properties
         *
         * @return {Subscription} A subscription object
         */
        Stream.prototype.addSubscription = function(object) {
            object = object || {};
            return this.getSubscriptions().add(object);
        };

        /**
         * Create a pubsub subscription for the stream
         *
         * @return {Promise} A promise for the subscription object creation
         */
        Stream.prototype.subscribe = function(fn) {

            var me = this;

            if(!me.__$pubsub) {
                me.__$pubsub = {
                    callback: 'pubsub',
                    destination: compose.config.apiKey
                };
            }

            var listener = function(subscription) {
                return new Promise(function(success, failure) {

                    try {
                        me.container().getClient().subscribe({
                            uuid: me.container().id + '.stream.' + me.name,
                            topic: 'stream',
                            stream: me,
                            emitter: me.emitter(),
                            onQueueData: function() {

                            }
                        });
                    }
                    catch(e) {
                        failure(e);
                        return;
                    }

                    if(fn && typeof fn === 'function') {
                        me.on('data', fn);
                    }

                    success(subscription);
                });
            };

            return this.getSubscriptions().refresh().then(function() {
                var subscription = me.getSubscription(me.__$pubsub.callback, "callback");
                if(!subscription) {
                    subscription = me.addSubscription(me.__$pubsub);
                    return subscription.create().then(listener);
                }
                else {
                    return listener(subscription);
                }
            });

        };

        /**
         * Remove a pubsub subscription for the stream
         *
         * @param {Function} fn Callback to be called when data is received
         * @return {Stream} The current stream
         */
        Stream.prototype.unsubscribe = function(fn) {

            var me = this;
            this.getSubscriptions().refresh().then(function() {
                var subscription = this.getSubscription(me.__$pubsub.callback, "callback");

                var _clean = function() {
                    me.off('data');
                    me.__$pubsub = null;
                };

                if(!subscription) {
                    _clean();
                }
                else {
                    subscription.delete().then(_clean);
                }
            });

            return this;
        };

        Stream.prototype.on = function(event, callback) {
            if(event === 'data') {
                compose.util.receiver.bind(this, this.container().id + '.stream.' + this.name);
            }
            this.emitter().on(event, callback);
            return this;
        };

        Stream.prototype.off = function(event, callback) {
            if(event === 'data') {
                compose.util.receiver.unbind(this, this.container().id + '.stream.' + this.name);
            }
            this.emitter().off(event, callback);
        };


        /**
         * Prepare a list of data values formatted to be sent to the backend
         *
         * @see Stream.push
         *
         * @param {Object} values A list of channels name and their values
         * @param {Number|Date|String} lastUpdate A value rapresenting the lastUpdate for the data values
         *
         * @return {Stream} The current stream
         */
        Stream.prototype.prepareData = function(values, lastUpdate) {

            var me = this;

            // default value
            if(typeof lastUpdate === 'undefined') {
                lastUpdate = new Date();
            }

            if(typeof lastUpdate === 'string' || typeof lastUpdate === 'number') {
                lastUpdate = new Date(lastUpdate);
            }

            if(lastUpdate instanceof Date) {
                lastUpdate = lastUpdate.getTime();
            }

            if(!lastUpdate) {
                throw new compose.error.ValidationError("prepareData expect");
            }

            // convert from milliseconds to seconds
            if(lastUpdate.toString().length === 13) {
                lastUpdate = Math.floor(lastUpdate / 1000);
            }

            var data = {
                channels: {},
                lastUpdate: lastUpdate
            };

            if(typeof values === "object") {
                for(var name in values) {
                    var channel = this.getChannel(name);
                    if (channel) {
                        data.channels[ name ] = data.channels[ name ] || {};
                        data.channels[ name ]['current-value'] = values[name];
                    }
                    else {
                        if(console && console.log)
                            console.log("Channel " + name + " is not available in stream " + me.name);
                    }
                }
            }
            else {
                var type = typeof values;
                throw new compose.error.ValidationError("prepareData expect an `object` as first parameter but `" + type + "` has been provided");
            }

            return data;
        };

        /**
         * Send data to a ServiceObject stream
         *
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.push = function(data, lastUpdate) {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!me.container().id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                if(!data) {
                    throw new ComposeError("Data for push has to be provided as first argument");
                }

                var values = me.prepareData(data, lastUpdate);
                var url = '/' + me.container().id + '/streams/' + me.name;
                me.container().getClient().put(url, values, resolve, reject);
            });
        };


        /**
         * Retieve data from a ServiceObject stream
         *
         * @param {String} timeModifier  text, optional Possible values: lastUpdate, 1199192940 (time ago as timestamp)
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.pull = function(timeModifier) {

            var me = this;
            timeModifier = timeModifier ? timeModifier : "";

            return new Promise(function(resolve, reject) {

                if(!me.container().id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                var url = '/' + me.container().id + '/streams/' + me.name + '/' + timeModifier;
                me.container().getClient().get(url, null, function(res) {

                    var data = [];
                    if(res && res.data) {
                        data = res.data;
                    }

                    var dataset = new DataBag(data);
                    dataset.container(me);

                    resolve && resolve(dataset, data);

                }, reject);
            });
        };

        /**
         * Search data of a ServiceObject stream
         *
         * @param {Object} options
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.search = function(options) {

            var me = this;

            return new Promise(function(resolve, reject) {

                if(!me.container().id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                if(!options) {
                    throw new ComposeError("No params provided for search");
                }

                var getFieldName = function(opts) {

                    var hasField = (typeof opts.field !== 'undefined' && opts.field),
                        hasChannel = (typeof opts.channel !== 'undefined'
                                        && opts.channel && me.getChannel(opts.channel));

                    if(!hasChannel && !hasField) {
                        throw new ComposeError("At least a valid `channel` or `field` properties has to be provided for numeric search");
                    }

                    if(hasField) {
                        return opts.field;
                    }
                    else if(hasChannel) {
                        return "channels." + opts.channel + ".current-value";
                    }
                };

                var hasProp = function(data, name) {
                    return 'undefined' !== data[name];
                };

                var params = {};

                /**
                {
                    "numericrange": true,
                    "rangefrom": 13,
                    "rangeto": 17,
                    "numericrangefield": "channels.age.current-value",
                }

                {
                    numeric: {
                        channel: 'name'
                        from: 1
                        to: 10
                    }
                }

                */
                var queryParams = options.numeric;
                if(queryParams) {

                    params.numericrange = true;
                    params.numericrangefield = getFieldName(queryParams);

                    var hasFrom = hasProp(queryParams, "from"),
                        hasTo = hasProp(queryParams, "to");

                    if(!hasFrom && !hasTo) {
                        throw new ComposeError("At least one of `from` or `to` properties has to be provided for numeric range search");
                    }

                    if(hasFrom) {
                        params.rangefrom = queryParams.from;
                    }

                    if(hasTo) {
                        params.rangeto = queryParams.to;
                    }

                }

                /**
                {
                    "timerange": true,
                    "rangefrom": 1396859660,
                }

                {
                    time: {
                        from: time
                        to: time
                    }
                }
                */
                var queryParams = options.time;
                if(queryParams) {

                    params.timerange = true;

                    var hasFrom = hasProp(queryParams, "from"),
                        hasTo = hasProp(queryParams, "to");

                    if(!hasFrom && !hasTo) {
                        throw new ComposeError("At least one of `from` or `to` properties has to be provided for time range search");
                    }

                    // set defaults
                    // if from is not set, set to epoch
                    queryParams.from = queryParams.from || (new Date(0));
                    // if to is not set, set to now
                    queryParams.to = queryParams.to || (new Date());

                    // a timestamp is expected but try parsing other values too
                    var getTimeVal = function(val, label) {

                        var type = typeof val;
                        var date;
                        var err = false;

                        if(type === 'number') {

                            var d = new Date(val);
                            if(d.getTime() !== val) {
                                d = new Date(val * 1000);
                                if(d.getTime() !== val) {
                                    err = true;
                                }
                            }

                            if(!err) {
                                date = d;
                            }
                        }
                        else if(type === "string") {
                            var d = new Date(val);
                            if(!d) {
                                err = true;
                            }
                            else{
                                date = d;
                            }
                        }
                        else if(val instanceof Date) {
                            date = val;
                        }

                        if(err || !date) {
                            throw new ComposeError("The value " + val + " for `" + label
                                                        + "` cannot be parsed as a valid date");
                        }

                        return date.getTime();
                    };

                    if(hasFrom) {
                        params.rangefrom = getTimeVal(queryParams.from, 'timeRange.from');
                    }

                    if(hasTo) {
                        params.rangeto = getTimeVal(queryParams.to, 'timeRange.to');
                    }

                }

                /**
                {
                    "match": true,
                    "matchfield": "channels.name.current-value",
                    "matchstring": "Peter John",

                    options.match : {
                        channel: '',
                        string: ''
                    }

                }
                */
                var queryParams = options.match;
                if(queryParams) {

                    params.match = true;
                    params.matchfield = getFieldName(queryParams);

                    var hasString = hasProp(queryParams, "string");

                    if(!hasString) {
                        throw new ComposeError("A value for `string` property has to be provided for text based search");
                    }

                    params.string = queryParams.string;
                }


                var checkForLocationChannel = function() {
                    if(!me.getChannel('location')) {
                        throw new ComposeError("To use geospatial based search a `location` channel is required");
                    }
                };

                /**
                {
                    "geoboundingbox": true,
                    "geoboxupperleftlon": 15.43,
                    "geoboxupperleftlat": 43.15,
                    "geoboxbottomrightlat": 47.15,
                    "geoboxbottomrightlon": 15.47

                    bbox: {
                        coords: [
                            { latitude: '', longitude: ''}, // top position
                            { latitude: '', longitude: ''}  // bottom position
                        ]
                    }

                }
                */
                var queryParams = options.bbox;
                if(queryParams) {

                    checkForLocationChannel();

                    params.geoboundingbox = true;

                    var hasBbox = false;
                    if(queryParams.coords) {
                        // [toplat, toplon, bottomlat, bottomlon]
                        if(queryParams.coords instanceof Array && queryParams.coords.length === 4) {
                            params.geoboxupperleftlat = queryParams.coords[0];
                            params.geoboxupperleftlon = queryParams.coords[1];
                            params.geoboxbottomrightlat = queryParams.coords[2];
                            params.geoboxbottomrightlon = queryParams.coords[3];
                            hasBbox = true;
                        }
                        //[{lat, lon}, {lat, lon}]
                        if(queryParams.coords instanceof Array && queryParams.coords.length === 2) {
                            params.geoboxupperleftlat = queryParams.coords[0].lat || queryParams.coords[0].latitude;
                            params.geoboxupperleftlon = queryParams.coords[0].lon || queryParams.coords[0].longitude;
                            params.geoboxbottomrightlat = queryParams.coords[1].lat || queryParams.coords[1].latitude;
                            params.geoboxbottomrightlon = queryParams.coords[1].lon || queryParams.coords[1].longitude;
                            hasBbox = true;
                        }
                    }

                    if(!hasBbox) {
                        throw new ComposeError("The values provided for `coords` option are not valid");
                    }

                }
                else {

                    if(options.bbox) {
                        (console && console.warn) && console.warn("`bbox` and `distance` search are not compatible, `bbox` will be used");
                    }

                    /*
                     {
                        "geodistance": true,
                        "geodistancevalue": 300,
                        "pointlat": 43.15,
                        "pointlon": 15.43,
                        "geodistanceunit": "km"
                    }

                    {
                        distance: {
                            position: {latitude: '', longitude: ''}
                            // or
                            // position: [lat, lon]
                            value: 'val',
                            unit: 'km'
                        }
                    }


                    */
                    var queryParams = options.distance;
                    if(queryParams) {

                        checkForLocationChannel();

                        params.geodistance = true;

                        if(queryParams.position) {
                            var position = queryParams.position;
                            var isArray = (position instanceof Array);
                            queryParams.lat =  isArray ? position[0] : (position.latitude || position.lat);
                            queryParams.lon = isArray ? position[1] : (position.longitude || position.lon);
                        }

                        var hasValue = hasProp(queryParams, "value"),
                            hasLat = hasProp(queryParams, "lat") || hasProp(queryParams, "latitude"),
                            hasLng = hasProp(queryParams, "lon") || hasProp(queryParams, "longitude")
                            ;

                        if(!hasLat || !hasLng || !hasValue) {
                            throw new ComposeError("`latitude`, `longitude` and `value` properties must be provided for distance search");
                        }

                        params.geodistanceunit = queryParams.unit || "km";
                        params.geodistancevalue = queryParams.value;
                        params.pointlat = queryParams.lat || queryParams.latitude;
                        params.pointlon = queryParams.lon || queryParams.longitude;

                    }
                }

                var url = '/' + me.container().id + '/streams/' + me.name + '/search';
                me.container().getClient().post(url, params, function(res) {

                    var data = [];
                    if(res && res.data) {
                        data = res.data;
                    }

                    var dataset = new DataBag(data);
                    dataset.container(me);

                    resolve && resolve(dataset, data);

                }, reject);
            });
        };

        /**
         * Search data of a ServiceObject by distance from a point
         *
         * @param {Object} position An object representing a geo-position, eg `{ latitude: 123 , longitude: 321 }`
         * @param {Number} distance The distance value
         * @param {String} unit Optional unit, default to `km`
         *
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.searchByDistance = function(position, distance, unit) {
            return this.search({
                distance: {
                    position: position,
                    value: distance,
                    unit: unit
                }
            });
        };

        /**
         * Search data of a ServiceObject in a Bounding Box
         *
         * @param {Array} bbox An array of 4 elements representing the bounding box, eg
         *                      ```
         *                      [
         *                          upperLat, upperLng,
         *                          bottomLat, bottomLng
         *                      ]
         *                      ```
         *                or an Array with 2 elements each one as an object eg
         *                      ```
         *                      [
         *                          { latitude: 123, longitude: 321 }, // upper
         *                          { latitude: 321, longitude: 123 }  // bottom
         *                      ]
         *                      ```
         *
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.searchByBoundingBox = function(bbox) {
            return this.search({ bbox: { coords: bbox } });
        };

        /**
         * Search text for a channel of a ServiceObject stream
         *
         * @param {String} channel The channel name where to search in
         * @param {Number} string The string query to search for
         *
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.searchByText = function(channel, string) {
            return this.search({ match: { string: string, channel: channel } });
        };

        /**
         * Search data by the update time range of a ServiceObject stream
         *
         * @param {Object} params An object with at least one of `from` or `to` properties
         *
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.searchByTime = function(params) {
            if(typeof params !== "object") {
                params = {
                    from: arguments[0],
                    to: arguments[1]
                };
            }
            return this.search({ time: params });
        };

        /**
         * Search data by a numeric value of a ServiceObject stream
         *
         * @param {String} channel Channel name to search for
         * @param {Object} params An object with at least one of `from` or `to` properties
         *
         * @return {Promise} Promise callback with result
         */
        Stream.prototype.searchByNumber = function(channel, params) {
            if(typeof params !== 'object') {
                params = {
                    from: arguments[1], to: arguments[2]
                }
            }
            params.channel = channel;
            return this.search({ numeric: params });
        };

        /**
         *
         * List of Stream object
         *
         * @constructor
         * @augments WebObject.StreamList
         */
        var StreamList = function(obj) {
            compose.lib.WebObject.StreamList(this, arguments);
            this.initialize(obj);
        };
        compose.util.extend(StreamList, compose.lib.WebObject.StreamList);

        StreamList.prototype.validate = function(stream) {

            stream.description = stream.description || "";

            if(!stream.name) {
                throw new ValidationError("Stream property `name` is required");
            }

            if(!stream.type) {
                throw new ValidationError("Stream property `type` is required");
            }

            var streamObj = new Stream(stream);
            streamObj.container(this.container());
            return streamObj;
        };

        /**
         * Retieve the description of the ServiceObject streams
         *
         * @return {Promise} A promise with future result
         */
        StreamList.prototype.refresh = function() {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(!me.container().id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }

                me.container().getClient().get('/'+me.container().id+'/streams', null, function(data) {
                    if(data) {
                        for(var i in data.streams) {
                            var stream = data.streams[i];
                            me.container().getStreams().add(stream.name || i, stream);
                        }
                    }

                    resolve && resolve(me);

                }, reject);
            }).bind(me.container());
        };

        /**
         *
         * The Service Object
         *
         * @param {Object} An optional object with the SO definition
         * @constructor
         * @augments WebObject
         */
        var ServiceObject = function(objdef) {

            compose.WebObject.apply(this, arguments);

            this.id = null;
            this.createdAt = null;

            this.__$emitter = new Emitter;

            this.initialize(objdef);
        };
        compose.util.extend(ServiceObject, compose.WebObject);

        ServiceObject.prototype.__$actions = null;
        ServiceObject.prototype.__$subscriptions = null;

        ServiceObject.prototype.emitter = function() {
            return this.__$emitter;
        };

        ServiceObject.prototype.getClient = function() {
            return new compose.lib.Client.Client(this);
        };

        /*
         * @return {String} The service object id
         */
        ServiceObject.prototype.getId = function() {
            return this.id || null;
        };

        /*
         * @return {Number} The creation date as unix timestamp
         */
        ServiceObject.prototype.getCreatedAt = function() {
            return this.createdAt || null;
        };

        /*
         * Destroy a ServiceObject instance, taking care to cleanout inner references
         *
         */
        ServiceObject.prototype.destroy = function() {
            this.emitter().off();
            compose.client.receiver.bind(this);
        };

        /**
         * Bind to an event
         *
         * @param {String} event The event name
         * @param {Function} callback Triggered when the event occur
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.on = function(event, callback) {

            // for `data` event bind to the global dataReceiver
            if(event === 'data') {
                compose.util.receiver.bind(this);
            }

            this.emitter().on(event, callback);
            return this;
        };

        /**
         * Bind to an event, but trigger only one time
         *
         * @param {String} event The event name
         * @param {Function} callback Triggered when the event occur
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.once = function(event, callback) {

            // for `data` event bind to the global dataReceiver
            if(event === 'data') {
                compose.util.receiver.bind(this);
            }

            this.emitter().once(event, callback);
            return this;
        };

        /**
         * Unbind to an event
         *
         * @param {String|Boolean} event The event name or true to remove all the callbacks
         * @param {Function} callback The function to remove
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.off = function(event, callback) {

            // for `data` event bind to the global dataReceiver
            if(event === 'data') {
                compose.util.receiver.unbind(this);
            }

            this.emitter().off(event, callback);
            return this;
        };

        /**
         * Trigger an event
         *
         * @param {String} event The event name
         * @params {mixed} additional arguments to pass to the event
         * @return {Stream} Self refrence to current stream
         */
        ServiceObject.prototype.trigger = function() {
            this.emitter().trigger.apply(this.emitter(), arguments);
            return this;
        };

        ServiceObject.prototype.setStreams = function(streams) {

            var _streams = new StreamList();
            _streams.container(this);
            _streams.initialize(streams);

            this.__$streams = _streams;
        };

        /**
         *
         * @param {Object} actions
         * @returns {ServuceObject} self reference
         */
        ServiceObject.prototype.setActions = function(actions) {

            var _actions = this.getActions();
            _actions = new ActuationList(actions);
            _actions.container(this);

            this.__$actions = _actions;

            return this;
        };

        /**
         * Create a new ServiceObject definition and register it in the repository.
         * The unique ServiceObject id (soId) is returned on success.
         *
         * @return {ServiceObject} Self reference
         */
        ServiceObject.prototype.create = function() {
            var me = this;
            return new Promise(function(resolve, reject) {
                me.getClient().post('/', me.toJson(), function(data) {
                    if(data) {
                        // set internal reference to soId and createdAt
                        me.id = data.id;
                        me.createdAt = data.createdAt;
                    }
                    resolve && resolve(me, data);
                }, reject);
            })
            .bind(this)
            ;
        };

        /**
         * Get the ServiceObject description
         *
         * @param {String} soId A service object Id
         *
         * @return {Promise} Promise of the request with the ServiceObject as argument
         */
        ServiceObject.prototype.load = function(id) {
            var me = this;
            return new Promise(function(resolve, reject) {

                if(id) {
                    me.id = id;
                }

                if(!me.id) {
                    throw new ComposeError("Missing ServiceObject id.");
                }
                me.getClient().get('/'+me.id, null, function(data) {
                    if(data) {
                        me.initialize(data);
                    }
                    resolve && resolve(me);
                }, reject);
            }).bind(me);
        };

        /**
         * Update a Service Object
         *
         * @return {Promise} Promise of the request with the ServiceObject as argument
         */
        ServiceObject.prototype.update = function() {
            var me = this;
            return new Promise(function(resolve, error) {

                if(!me.id) {
                    throw new Error("Missing ServiceObject id.");
                }

                me.getClient().put('/'+ me.id, me.toString(), function(data) {
                    resolve && resolve(me);
                }, error);
            });
        };

        /**
         * Delete a Service Object
         *
         * @param {String} Optional, the soid to delete
         *
         * @return {Promise} Promise of the request with a new empty so as argument
         */
        ServiceObject.prototype.delete = function(soid) {
            var me = this;
            return new Promise(function(resolve, error) {

                soid = soid || null;

                if(!soid && !me.id) {
                    throw new Error("Missing ServiceObject id.");
                }

                if(me.id === soid) {
                    soid = null;
                }

                var delId = soid || me.id;

                me.getClient().delete('/'+ delId, null, function() {
                    if(!soid) {
                        me.initialize({});
                        me.id = null;
                        me.createdAt = null;
                    }
                    resolve && resolve(me);
                }, error);
            });
        };


        /**
         * @todo: ACTUATIONS section
         */

    //    ServiceObject.prototype.toString = compose.WebObject.prototype.toString;
        solib.DataBag = DataBag;
        solib.ServiceObject = ServiceObject;

        /**
         * Create a Service Object from an object or a WebObject
         *
         * @param {Object} wo ServiceObject compatible definition object or WebObject
         *
         * @return {Promise} Promise for the future ServiceObject created
         * */
        solib.create = function(wo) {

            if(wo instanceof compose.WebObject) {
                wo = wo.toJson();
            }

            var so = new ServiceObject(wo);
            return so.create();
        };

        /**
         * Delete a Service Object by id
         *
         * @param {String} soid ServiceObject id
         *
         * @return {Promise} Promise for the future result of the operation
         * */
        solib.delete = function(soid) {
            return (new ServiceObject()).delete(soid);
        };

        /**
         * @param {String} id ServiceObject id
         *
         * @return {Promise} A promise with the created SO
         */
        solib.load = function(id) {
            return (new ServiceObject()).load(id);
        };


        /**
         * Return a API client instance
         *
         * @todo move to a autonomous module?
         * @return {compose.lib.Client.Client} A compose client
         */
        solib.client = function() {
            return (new ServiceObject()).getClient();
        };

        /**
         * Retrieve all the Service Objects from a given user (identified by the Authorization header).
         *
         * @return {ServiceObject} Self reference
         */
        solib.list = function() {
            var client = solib.client();
            return new Promise(function(resolve, reject) {
                client.get('/', null, function(data) {
                    client.ServiceObject = null;
                    resolve(data);
                }, reject);
            }).bind(client);
        };

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = solib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose', 'WebObject', 'utils/List'], function(compose) {
                return solib;
            });
        }
        else {
            window.__$$Compose.ServiceObject = solib;
        }
    }

})();
}).call(global, module, undefined, undefined);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
(function (global){

; ;__browserify_shim_require__=require;(function browserifyShim(module, define, require) {
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
(function(){

    var wolib = {};
    wolib.setup = function(compose) {

        var ComposeError = compose.error.ComposeError;
        var copyVal = compose.util.copyVal;

        if(!compose) {
            throw new ComposeError("compose.io module reference not provided, quitting..");
        }

        /**
         *
         * A list of Channel of a Stream
         *
         * @constructor
         * @augments ObjectList
         */
        var ChannelsList = function(channels) {
            compose.util.List.ObjectList.apply(this);
            this.initialize(channels);
        };
        compose.util.extend(ChannelsList, compose.util.List.ObjectList);

        ChannelsList.prototype.validate = function(channel) {

//            if(!channel.name) {
//                throw new ValidationError("Channel must have a `name` property");
//            }
//
//            if(!channel.type) {
//                throw new ValidationError("Channel must have a `type` property");
//            }
//
//            if(!channel.unit) {
//                throw new ValidationError("Channel must have a `unit` property");
//            }
//
//            if(channel.type !== 'Number' || channel.type !== 'String' || channel.type !== 'Boolean' ) {
//                throw new ValidationError("Channel `type` must be one of Number, String or Boolean");
//            }

            return channel;
        };


        /**
         *
         * A list of Stream objects of a WebObject
         *
         * @constructor
         * @augments ObjectList
         */
        var StreamList = function(streams) {

            compose.util.List.ObjectList.apply(this);

            if(this instanceof StreamList) {
                this.initialize(streams);
            }

        };
        compose.util.extend(StreamList, compose.util.List.ObjectList);

        StreamList.prototype.add = function(name, obj) {

            if (typeof name === "object") {
                for (var i in name) {
                    this.add(i, name[i]);
                }
                return this;
            }

            // handle arrays using the obj.name property
            if(obj.name && (typeof (parseFloat(name)) === 'number')) {
                name = obj.name;
            }

            if(!obj.name) {
                obj.name = name;
            }

            var stream = this.validate(obj);
            this.getList()[name] = stream;

            return stream;
        };

        /**
         * @param {String} name Identifier name
         * @return {Number} Return the index or -1 if not found
         */
        StreamList.prototype.getIndex = function(name, key) {

            var list = this.getList();

            if(list[name]) {
                return name;
            }

            key = key || 'name';
            var _size = this.size();
            for (var i = 0; i < _size; i++) {
                if (list[i][key] === name) {
                    return i;
                }
            }

            return -1;
        };

        StreamList.prototype.validate = function(stream) {

            var streamObj = new Stream(stream);
            streamObj.container(this.container());

            return streamObj;
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        StreamList.prototype.toJson = function(asString) {

            var list = this.getList();
            var json = copyVal(list);

            return asString ? JSON.stringify(json) : json;
        };

        StreamList.prototype.toString = function() {
            return this.toJson(true);
        };

        /**
         *
         * A Stream object
         *
         * @constructor
         */
        var Stream = function(obj) {
            if(this instanceof Stream) {
                this.initialize(obj);
            }
        };

        Stream.prototype.__$container;

        Stream.prototype.container = function(o) {
            this.__$container = o || this.__$container;
            return this.__$container;
        };

        /**
         * Add a list of elements provided as argument to the stream
         * @param {Object} obj An object with the properties to set for the Stream
         */
        Stream.prototype.initialize = function(obj) {

            obj = obj || {};

            for (var i in obj) {
                if (!this[i]) {
                    this[i] = obj[i];
                }
            }

            this.channels = new ChannelsList(obj.channels || {});
            this.channels.container(this.container());
        };

        /**
         * Add or updates a channel. This function handles multiple arguments, eg.
         *
         * - addChannel(name, channel)
         * - addChannel(name, unit, type, value)
         *
         * @param {String} name Name of the channel
         * @param {String|Object} channel|unit Channel object (or unit value, when arguments count is >= 3)
         * @param {String} type Type of value
         *
         * @return {Stream} The current stream
         * */
        Stream.prototype.addChannel = function(name, channel, a3, a4) {

            if (arguments.length >= 3) {
                name = arguments[0];
                channel = {
                    "unit": arguments[1],
                    "type": arguments[2]
                };
            }

            this.channels.add(name, channel);

            return this;
        };

        /**
         * Add or updates a list of channels
         *
         * @param {Object} channels List of channels
         *
         * @return {Stream} The current stream
         * */
        Stream.prototype.addChannels = function(channels) {
            this.channels.add(channels);
            return this;
        };

        /**
         * @return {ChannelsList} The list of channels 
         */
        Stream.prototype.getChannels = function() {
            return this.channels;
        };

        /**
         * @param {String} name The channel name
         * @return {Object} The requested channel or null if not available
         */
        Stream.prototype.getChannel = function(name) {
            return this.channels.get(name);
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        Stream.prototype.toJson = function(asString) {

            var json = {};

            copyVal(this, json);
            json.channels = this.channels.toJson();

            return asString ? JSON.stringify(json) : json;
        };

        Stream.prototype.toString = function() {
            return this.toJson(true);
        };

        /**
         * Creates a WebObject instance
         */
        var WebObject = function(objdef) {

            var me = this;

            this.properties = [];
            this.customFields = {};

            if(this instanceof WebObject) {
                this.initialize(objdef);
            }
        };

        WebObject.prototype.__$streams = null;
        WebObject.prototype.__$actions = null;

        /**
         * Take an object and set the fields defining the WO accordingly
         * This method will overwrite any previous information
         *
         * Minimum information required are
         * `{ properties: { name: "<wo name>", id: "<wo id>" } }`
         *
         * @param {Object} obj An object with the definition of the WO.
         * @return {WebObject} A webobject instace
         */
        WebObject.prototype.initialize = function(obj) {

            obj = obj || {};

            for (var i in obj) {
                if (typeof obj[i] !== 'function') {
                    this[i] = obj[i];
                }
            }

            this.customFields = obj.customFields || {};
            this.properties = obj.properties || [];

            this.setStreams(copyVal(obj.streams || {}));
            this.setActions(copyVal(obj.actions || {}));

            return this;
        };

        WebObject.prototype.getStreams = function() {
            return this.__$streams;
        };

        /**
         *
         */
        WebObject.prototype.setStreams = function(streams) {
            var _streams = new StreamList(streams);
            _streams.container(this);
            this.__$streams = _streams;
        };

        /**
         *
         * @param {String} name The stream name
         * @return {Object} The Streamobject
         */
        WebObject.prototype.getStream = function(name) {
            return this.getStreams().get(name);
        };


        WebObject.prototype.getActions = function() {
            return this.__$actions;
        };

        /**
         *
         * @param {Object} actions
         * @returns {WebObject} self reference
         */
        WebObject.prototype.setActions = function(actions) {

            var _actions = this.getActions();
            _actions = new compose.util.List.ArrayList(actions);
            _actions.container(this);
            this.__$actions = _actions;

            return this;
        };

        /**
         * @param {String} name The action name
         * @return {Object} The Action object
         */
        WebObject.prototype.getAction = function(name) {
            return this.getActions().get(name);
        };

        /**
         * @param {Object} key The object name
         * @param {Object} stream The object with stream data
         *
         * @return {Object} The Stream object
         */
        WebObject.prototype.addStream = function(key, stream) {
            return this.getStreams().add(key, stream);
        };

        /**
         * @param {Array} streams List of objects to add
         * @return {WebObject} The WO object
         */
        WebObject.prototype.addStreams = function(streams) {
            if (typeof streams === "object") {
                for (var i in streams) {
                    this.addStream((typeof parseFloat(i) === 'number') ? streams[i].name : i, streams[i]);
                }
            }
            return this;
        };

        /**
         * @param {Object} action The object to add
         * @return {Object} The Action object
         */
        WebObject.prototype.addAction = function(action) {
            return this.getActions().add(action);
        };

        /**
         * @param {Array} actions List of objects to add
         * @return {WebObject} The WO object
         */
        WebObject.prototype.addActions = function(actions) {
            if (actions instanceof Array) {
                for (var i = 0; i < actions.length; i++) {
                    this.getActions().add(actions[i]);
                }
            }
            return this;
        };

        /*
         *
         * @param {boolean} asString Return as string if true, object otherwise
         * @returns {Object|String}
         */
        WebObject.prototype.toJson = function(asString) {
            var json = {};

            for (var i in this) {
                if (typeof this[i] !== 'function' && i.substr(0, 3) !== '__$') {
                    if(this[i] !== null) {
                        json[i] = this[i];
                    }
                }
            }

            var streams = this.getStreams();
            json.streams = streams ? streams.toJson() : {};

            var actions = this.getActions();
            json.actions = actions ? actions.toJson() : [];

            return asString ? JSON.stringify(json, null) : json;
        };

        WebObject.prototype.toString = function() {
            return this.toJson(true);
        };

        /**
         * StreamList class
         */
        wolib.StreamList = StreamList;

        /**
         * Stream class
         */
        wolib.Stream = Stream;

        /**
         * WebObject class
         */
        wolib.WebObject = WebObject;

        /**
         * Creates a new instance of a WebObject
         *
         * @param {Object} wo An object with WebObject properties
         */
        wolib.create = function(wo) {
            return new WebObject(wo || {});
        };

    //    // read a json file by name @todo need to be ported and adapted
    //    wolib.read = function(name) {
    //        var platform = getPlatformImpl();
    //        var content = platform.readFile(name, { definitionsPath: getDefinitionPath() });
    //        return content ? JSON.parse(content) : {};
    //    };

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = wolib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose', 'utils/List'], function(compose) {
                return wolib;
            });
        }
        else {
            window.__$$Compose.WebObject = wolib;
        }
    }

})();
}).call(global, module, undefined, undefined);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
(function (global){

; require("/home/l/git/github.com/compose.io/platforms/stomp/browser.js");
require("/home/l/git/github.com/compose.io/platforms/http/browser.js");
require("/home/l/git/github.com/compose.io/platforms/mqtt/browser.js");
;__browserify_shim_require__=require;(function browserifyShim(module, define, require) {
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

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = client;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return client;
            });
        }
        else {
            window.__$$Compose.client = client;
        }
    }

})();
}).call(global, module, undefined, undefined);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"/home/l/git/github.com/compose.io/platforms/http/browser.js":5,"/home/l/git/github.com/compose.io/platforms/mqtt/browser.js":6,"/home/l/git/github.com/compose.io/platforms/stomp/browser.js":7}],4:[function(require,module,exports){
(function (process,global){

; require("/home/l/git/github.com/compose.io/ServiceObject.js");
require("/home/l/git/github.com/compose.io/utils/List.js");
require("/home/l/git/github.com/compose.io/WebObject.js");
require("/home/l/git/github.com/compose.io/client.js");
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
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
"use strict";

(function(){

    var config = {};

    config.debug = false;

    var DEBUG = config.debug;
    var d = function(m) { (DEBUG === true || DEBUG > 5) && console.log(m); };

    config.modulePath = "./";
    config.platformsPath = "platforms/";
    config.vendorsPath = "vendors/";
    config.definitionsPath = "definitions/";

    config.url = "http://api.servioticy.com";
    config.apiKey = null;

    config.transport = null;

    var compose = {};

    var registerUrl = "http://www.servioticy.com/?page_id=73";

    // configurations
    compose.config = config;
    // utils
    compose.util = {};
    // modules referece
    compose.lib = {};
    // custom errors
    compose.error = {};

    compose.error.ComposeError = function() {
        this.name = "ComposeError";
        this.mapArgs(arguments);
    };
    compose.error.ComposeError.prototype = Error.prototype;
    compose.error.ComposeError.prototype.mapArgs = function(args) {

        var m = args[0];

        if(typeof m === "string") {
            this.message = args[0];
        }

        if(m instanceof Error) {
            this.message = m.message;
            this.stack = m.stack;
            this.code = m.code;
            this.errno = m.errno;
        }

    };

    compose.error.ValidationError = function() {
        this.name = "ValidationError";
        this.mapArgs(arguments);
    };
    compose.error.ValidationError.prototype = compose.error.ComposeError.prototype;

    /**
     * Sniff the current enviroment
     */
    compose.config.platform = (function() {

        var platforms = {
            browser: function() {
                return (typeof document !== 'undefined' && document.getElementById);
            },
            titanium: function() {
                return (typeof Titanium !== 'undefined' && Titanium.API);
            },
            node: function() {
                return (typeof process !== 'undefined' && process.exit);
            }
        };

        for(var type in platforms) {
            if(platforms[type]()) {
                return type;
            }
        }

        throw new compose.error.ComposeError("Enviroment not supported.");

    })();

    compose.util.getModulePath = function() {
        return config.modulePath;
    };

    compose.util.getPlatformPath = function() {
        return compose.util.getModulePath() + config.platformsPath;
    };

    compose.util.getVendorsPath = function() {
        return compose.util.getModulePath() + config.vendorsPath;
    };

    compose.util.getDefinitionsPath = function() {
        return compose.util.getModulePath() + config.definitionsPath;
    };

    compose.util.getPromiseLib = function() {

        var PromiseLib = null;

        if(compose.config.platform === 'titanium') {
            var lib = compose.util.getVendorsPath() + 'bluebird/titanium/bluebird';
            PromiseLib = __browserify_shim_require__(lib);
        }
        else if(compose.config.platform === 'browser' && window.define === 'undefined') {
            PromiseLib = __browserify_shim_require__(compose.util.getVendorsPath() + 'bluebird/browser/bluebird');
        }
        else {
            PromiseLib = __browserify_shim_require__("bluebird");
        }

        if(!PromiseLib) {
            throw new Error("Cannot load Promise library, please check paths configuration for "
                                + compose.util.getVendorsPath());
        }

        return PromiseLib;
    };

    /**
     * @return {String} Return an adapter module path, placed in
     *                  [platform-path]/[transport]/[enviroment]
     */
    compose.util.getAdapterPath = function() {
        var path = compose.util.getPlatformPath() + compose.config.transport
                    + '/' + compose.config.platform;
        return path;
    };

    /**
     * Wrapper for standard require, to normalize paths on different enviroments
     *
     * @param {String} name
     * @param {String} path Optional, full path to module (substitute name)
     * @returns {Object} The required module
     */
    compose.util.requireModule = function(name, path) {
        path = path || compose.util.getModulePath() + name;
        return __browserify_shim_require__(path);
    };

    /*
     * Requires a module and call its `setup` method, if any
     *
     * @param {type} name
     * @param {type} path
     * @returns {module}
     */
    compose.util.setupModule = function(name, path) {
        var module = compose.util.requireModule(name, path);
        (module && module.setup) && module.setup(compose);
        return module;
    };

    /**
     *  Extends an object by (shallow) copying its prototype and expose a
     *  `__$parent` property to Child to get access to parent
     *
     *  @memo In the child contructor remember to call `Parent.apply(this, arguments)`
     *
     *  @param {Object} Child The object to extend
     *  @param {Object} Parent The object to extend
     *
     */
    compose.util.extend = function(Child, Parent) {
        var p = Parent.prototype;
        var c = Child.prototype;
        for (var i in p) {
            c[i] = p[i];
        }
        c.__$parent = p;
        c.parent = function() { return c.__$parent; };
    };

    var setPaths = function() {
        if(compose.config.platform === 'node' || compose.config.platform === 'browser') {
            // free definition path location
            config.definitionsPath = "";
        }
    };

    /*
     * Recursively copy an object to another skipping function, key with __$ prefix
     *
     * @param {Object,Array} src Source object
     * @param {Object,Array} dst Optional, destination object
     *
     * @returns {Object,Array}
     */
    compose.util.copyVal = function (src, dst) {

        var gettype = function(t) { return (t instanceof Array) ? [] : {}; };
        dst = dst || gettype(src);


        for (var i in src) {

            var v = src[i];

            if(i.substr(0, 3) === '__$') {
                continue;
            }

            if (typeof v === 'function') {
                continue;
            }

            if (v && v.toJson) {
                dst[i] = v.toJson();
                continue;
            }

            if (typeof v === 'object') {
                dst[i] = compose.util.copyVal(v);
                continue;
            }

            dst[i] = v;
        }
        return dst;
    };

    var setDebug = function(debug) {

        compose.config.debug = debug;

        if(compose.config.debug) {
            if(compose.config.platform !== 'titanium')
                compose.lib.Promise && compose.lib.Promise.longStackTraces();
        }

    };

    /**
     * Select the best supported transport mechanism for the current platform
     * */
    var selectPreferredTransport = function() {
        if(!compose.config.transport) {
            var p = "http";
            switch (compose.config.platform) {
                case "titanium":
                case "node":
                    p = "mqtt";
                    break;
                case "browser":
                    p = "stomp";
                    break;
            }
            compose.config.transport = p;
        }
        d("selected transport is " + compose.config.transport);
    };

    /**
     * Initialize the module. Available options are
     * {
     *  // api key
     *  apiKey: '<api key>',
     *  // endpoint url
     *  url: 'http://api.servioticy.com'
     *  // transport layer, supported list is [ http, mqtt, stomp ]
     *  transport: 'stomp'
     *  // custom module path eg `custom-path/compose.io/`
     *  modulePath: './'
     * }
     * @param {Object|String} _config An object with config options or only the apiKey
     *
     */
    var _initialized = false;
    compose.setup = function(_config) {

        if(_initialized && !_config.reinit) {
            return compose;
        }

        // titanium expects a path like Resources/[module]
        // adding custom path here, overridable by module.init(baseDir)
        var platform = compose.config.platform;
        if(platform === 'titanium') {
            compose.config.modulePath = 'compose.io/';
        }

        if(typeof _config === 'string') {
            _config= { apiKey: _config };
        }

        if(_config) {

            config.modulePath = _config.modulePath || config.modulePath;
            config.platformsPath = _config.platformsPath || config.platformsPath;

            if(_config.transport) {
                 config.transport = _config.transport;
                if(_config[config.transport]) {
                    config[config.transport] = _config[config.transport] || null;
                }
            }

            config.url = _config.url || config.url;
            config.apiKey = _config.apiKey;

            config.debug = _config.debug || config.debug;
            DEBUG = config.debug;
        }

        if(!config.apiKey) {
            throw new compose.error.ComposeError("An apiKey is required to use the platform, please visit " +
                    registerUrl + " for further instructions");
        }

        setPaths();
        selectPreferredTransport();

        setDebug(config.debug);

        compose.util.List = compose.util.setupModule("utils/List");

        compose.lib.Promise = compose.util.getPromiseLib();

        if(!compose) {
            throw new compose.error.ComposeError("compose.io module reference not provided, quitting..");
        }

        compose.lib.Client = compose.util.setupModule("client");
        compose.util.queueManager = compose.lib.Client.queueManager;

        // initialize & expose WebObject module
        compose.lib.WebObject = compose.util.setupModule("WebObject");
        compose.WebObject = compose.lib.WebObject.WebObject;

        // initialize & expose ServiceObject module
        compose.lib.ServiceObject = compose.util.setupModule("ServiceObject");
        compose.util.DataBag = compose.lib.ServiceObject.DataBag;
        compose.ServiceObject = compose.lib.ServiceObject.ServiceObject;

        compose.load = compose.lib.ServiceObject.load;
        compose.delete = compose.lib.ServiceObject.delete;
        compose.create = compose.lib.ServiceObject.create;
        compose.list = compose.lib.ServiceObject.list;

        compose.setDebug = setDebug;

        /**
         *
         * @param {String} model
         * @return {Promise<Function(Object)>} a promise wtih a future new service object based on model definition
         */
        compose.getDefinition = function(model) {
            var r = compose.util.setupModule("utils/DefinitionReader");
            return r.read(model);
        };

        _initialized = true;
        return compose;
    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = compose;
    }
    else {

        var deps = [
            'bluebird', 'stompjs',
            'utils/List', 'client', 'WebObject', 'ServiceObject',
            'platforms/stomp/browser', 'platforms/mqtt/browser', 'platforms/http/browser'
        ];

        if (typeof define === 'function' && define.amd) {
            define(deps, function() {
                return compose;
            });
        }
        else {

            // global references container
            window.__$$Compose = window.__$$Compose || {};
            window.Compose = compose;
            window.compose = window.compose || compose;
            if(typeof window.require === 'undefined') {

                var _requireAlias = {
                    "bluebird": "vendors/bluebird/browser/bluebird",
                    "stompjs": "vendors/stompjs/stomp.min",
                };

                window.__$$Compose.isReady = false;
                var onLoadCallback;

                window.Compose.ready = function(cb) {
                    onLoadCallback = cb;
                    if(window.__$$Compose.isReady) {
                        cb(compose);
                        onLoadCallback = null;
                    }
                };

                var _d = [];
                for(var i in deps) {
                    _d.push( _requireAlias[deps[i]] ? _requireAlias[deps[i]] : deps[i] );
                }

                (function() {

                    var basepath;
                    var modules = document.getElementsByTagName("script");
                    for(var i in modules) {
                        if(modules[i].src && modules[i].src.match(/\/compose\.io\/index/)) {
                            basepath = modules[i].src.replace("index.js", "");
                            break;
                        }
                    }

                    var head = document.getElementsByTagName("head")[0];
                    var append = function(src, then) {
                        var script = document.createElement("script");
                        script.src = basepath + src + ".js";
                        script.onload = then;
                        head.appendChild(script);
                    };

                    var c = 0;
                    var _counter = function() {
                        c--;
                        if(c === 0) {
                            // call on load!
                            window.__$$Compose.isReady = true;
                            onLoadCallback && onLoadCallback(compose);
                        }
                    };

                    while(_d.length) {
                        c++;
                        append(_d.shift(), _counter);
                    }

                })();

                window.require = function(requiredName) {
                    if(requiredName.match(/bluebird/)) {
                        return window.Promise;
                    }
                    if(requiredName.match(/stompjs/i)) {
                        return window.Stomp;
                    }
                    var moduleName = requiredName.replace(/[.\/]+/, "").replace(/\//, "_").replace(/\//, "_");
                    var module = window.__$$Compose[moduleName];
                    return module;
                };
            };
        }
    }


}).call(this);
; browserify_shim__define__module__export__(typeof compose != "undefined" ? compose : window.compose);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"/home/l/git/github.com/compose.io/ServiceObject.js":1,"/home/l/git/github.com/compose.io/WebObject.js":2,"/home/l/git/github.com/compose.io/client.js":3,"/home/l/git/github.com/compose.io/utils/List.js":8,"_process":10}],5:[function(require,module,exports){
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
    var d = function(m) { DEBUG && console.log(m); };

    var httplib = {};

    httplib.initialize = function(compose) {

        DEBUG = compose.config.debug;

        httplib.connect = function(handler, success, failure) {
            success();
        };
        httplib.disconnect = function() {};

        httplib.request = function(handler) {

            var http = new XMLHttpRequest();
            var url = compose.config.url + handler.path;

            d(handler.method + ' ' + url);

            http.onreadystatechange = function () {
                if (http.readyState !== 4) {
                    return;
                }
                if (http.status >= 400) {
                    handler.emitter.trigger('error', {
                        code: http.status
                    });
                }
                else {
                    var json = JSON.parse(http.responseText);
                    handler.emitter.trigger('success', json);
                }
            };

            http.open(handler.method, url, true);
            http.setRequestHeader("Content-type", "application/json");
            http.setRequestHeader("Authorization", compose.config.apiKey);

            var data = null;
            if(handler.body) {
                data = JSON.stringify(handler.body);
            }

            http.send(data);
        };

    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = httplib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return httplib;
            });
        }
        else {
            window.__$$Compose.platforms_http_browser = httplib;
        }
    }

})();
},{}],6:[function(require,module,exports){
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

    var mqttlib = {};

    mqttlib.initialize = function(compose) {
        throw new compose.error.ComposeError("Browser support for mqtt has not been implemented yet! Please, use stomp instead");
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = mqttlib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return mqttlib;
            });
        }
        else {
            window.__$$Compose.platforms_mqtt_browser = mqttlib;
        }
    }

})();
},{}],7:[function(require,module,exports){
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
                return "/topic/" + compose.config.apiKey + '.' + handler.container().ServiceObject.id +'.streams.'+ handler.stream.name +'.updates';
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
},{"stompjs":9}],8:[function(require,module,exports){
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

    var listlib = {};
    listlib.setup = function(compose) {

        var copyVal = compose.util.copyVal;

        if(!compose) {
            throw new Error("compose library reference is missing");
        }


        /**
         * @constructor
         */
        var Enumerable = function() {};
        Enumerable.prototype.__$cursor = null;
        Enumerable.prototype.__$list = null;

        /**
         * @returns {mixed} A list of values
         * */
        Enumerable.prototype.getList = function() {
            return this.__$list;
        };

        /**
         * @param {mixed} list A list to set
         * */
        Enumerable.prototype.setList = function(__list) {
            this.__$list = __list;
        };

        /**
         * @return {Number} The list items length
         * */
        Enumerable.prototype.size = function() {
            return this.getList().length;
        };

        /**
         * @return {Number} The current cursor
         * */
        Enumerable.prototype.index = function() {
            if(this.__$cursor === null) this.reset();
            return this.__$cursor;
        };

        /**
         * Move foward the internal cursor to the next item
         *
         * @return {Boolean} A value indicating if the operation is possible. False means end of list
         *
         * */
        Enumerable.prototype.next = function() {

            if((this.index()+1) >= this.size())
                return false;

            this.__$cursor++;
            return true;
        };

        /**
         * Move backward the internal cursor to the previous item
         *
         * @return {Boolean} A value indicating if the operation is possible.
         *                   False means begin of list has been already reached
         *
         * */
        Enumerable.prototype.prev = function() {

            if((this.index() - 1) < 0)
                return false;

            this.__$cursor--;
            return true;
        };

        /**
         * @return {Object} The current object in the iterator
         * */
        Enumerable.prototype.current = function() {
            return this.at(this.index());
        };

        /**
         * Reset the internal cursor
         * */
        Enumerable.prototype.reset = function() {
            this.__$cursor = 0;
        };

        /**
         * Return an object at a specific index
         * */
        Enumerable.prototype.at = function(i) {
            var list = this.getList();
            return (typeof list[i] !== 'undefined') ? list[i] : null;
        };

        /**
         * @return {Object} Return the first element in the list
         * */
        Enumerable.prototype.first = function() {
            return this.at(0);
        };

        /**
         * @return {Object} Return the last element in the list
         * */
        Enumerable.prototype.last = function() {
            return this.at(this.size()-1);
        };

        /**
         * Loop the list calling fn on each element
         *
         * @param {Function<element, index>} fn A callback with the current element in the loop
         *
         * */
        Enumerable.prototype.each =
        Enumerable.prototype.forEach = function(fn) {
            var me = this;
            for(var i in this.getList()) {
                var el = this.getList()[i];
                fn.call(me, el, i);
            }
        };

        /**
         * Handles array as a list
         *
         * @constructor
         */
        var ArrayList = function(obj) {
            if(this instanceof ArrayList) {
                this.initialize(obj);
            }
        };
        compose.util.extend(ArrayList, Enumerable);

        ArrayList.prototype.__$list;
        ArrayList.prototype.__$container;

        ArrayList.prototype.container = function(o) {
            this.__$container = o || this.__$container;
            return this.__$container;
        };

        /**
         * Set the list of stored objects
         *
         * @param {Array} list An array of object to store
         * */
        ArrayList.prototype.setList = function(list) {
            this.__$list = list;
        };

        /**
         * Return the list of stored objects
         * */
        ArrayList.prototype.getList = function() {
            this.__$list = this.__$list || [];
            return this.__$list;
        };

        ArrayList.prototype.size = function() {
            return this.getList().length;
        };

        ArrayList.prototype.validate = function(obj) {
            return obj;
        };

        ArrayList.prototype.add = function(obj) {
            var objVal = this.validate(obj);
            this.getList().push(objVal);
            return objVal;
        };

        /**
         * @param {mixed} value The value to search for
         * @param {mixed} key The key to match, if provided otherwise `value` is used
         *
         * @return {mixed} The item or null if not found
         */
        ArrayList.prototype.get = function(value, key) {
            var index = this.getIndex(value, key);
            return (index > -1) ? this.getList()[index] : null;
        };

        ArrayList.prototype.set = function(name, value, key) {
            var index = this.getIndex(name, key);
            if (index > -1) {
                this.getList()[index] = value;
            }
            return this;
        };

        ArrayList.prototype.getIndex = function(val, key) {
            for (var i = 0; i < this.size(); i++) {
                var srcVal = this.getList()[i];
                if(key !== undefined) {
                    srcVal = srcVal[key];
                }
                if (srcVal === val) {
                    return i;
                }
            }
            return -1;
        };

        ArrayList.prototype.remove = function(value, key) {
            var i = this.getIndex(value, key);
            if(i > -1) {
                this.getList().splice(i, 1);
            }
            return this;
        };

        ArrayList.prototype.toJson = function(asString) {

            var list;
//            list = copyVal(this.getList());
            list = this.getList();

            return asString ? JSON.stringify(list) : list;
        };

        ArrayList.prototype.toString = function() {
            return this.toJson(true);
        };

        ArrayList.prototype.initialize = function(obj) {
            // initialize provided streams
            if (obj instanceof Array) {
                for (var i in obj) {
                    this.add(obj[i]);
                }
            }
        };


        /**
         * This list handles an object instead of an array
         *
         * @constructor
         * @augments ArrayList
         */
        var ObjectList = function(obj) {

            ArrayList.apply(this, arguments);

            if(this instanceof ObjectList) {
                this.initialize(obj);
            }

        };
        compose.util.extend(ObjectList, ArrayList);

        ObjectList.prototype.__$list;

        /**
         * Get the list
         *
         * @return {Object} The list
         *
         */
        ObjectList.prototype.getList = function() {
            this.__$list = this.__$list || {};
            return this.__$list;
        };

        /**
         * Count the list size
         *
         * @return {Number} The list size
         *
         */
        ObjectList.prototype.size = function() {
            var c = 0;
            var list = this.getList();
            for (var i in list) {
                c++;
            }
            return c;
        };


        /**
         * Add an element to the list. If and object is passed as first arguments, it is added as a list
         *
         * @param {String|Obj} name the obj name or a list like { key1: {}, key2: {} }
         * @param {String} obj the obj value
         *
         * @return {Object} The added object instance
         *
         */
        ObjectList.prototype.add = function(name, obj) {

            if (typeof name === "object") {
                for (var i in name) {
                    this.add(i, name[i]);
                }
                return this;
            }

            var objVal = this.validate(obj);
            this.getList()[name] = objVal;

            return objVal;
        };

        /**
         * Get an element from the list or null if not found
         *
         * @param {String} name the channel name
         *
         * @return {object} the requested object
         *
         */
        ObjectList.prototype.get = function(name) {
            return (this.getList()[name]) ? this.getList()[name] : null;
        };

        /**
         * Remove an element from the list
         *
         * @param {String} name the channel name
         *
         * @return {List} object instance
         *
         */
        ObjectList.prototype.remove = function(name) {
            if (this.get(name)) {
                delete this.getList()[name];
            }
            return this;
        };

        /**
         * Set a single value
         * `obj.set(name, key, value)`
         *
         * Set the whole channel informations
         * `obj.set(name, obj)`
         *
         * @param {String} name the channel name
         * @param {String} key channel object key
         * @param {String} value channel object value to set
         *
         * @return {ChannelsList} object instance
         *
         */
        ObjectList.prototype.set = function(name, key, value) {
            if (this.get(name)) {
                if (typeof key === 'object') {
                    this.getList()[name] = key;
                }
                else if (key && value) {
                    this.getList()[name][key] = value;
                }
            }
            return this;
        };

        ObjectList.prototype.initialize = function(obj) {

            // initialize provided streams
            if (obj && (typeof obj === 'object' || obj instanceof Array)) {
                for (var i in obj) {
                    this.add(i, obj[i]);
                }
            }
        };


        listlib.Enumerable = Enumerable;

        listlib.ArrayList = ArrayList;
        listlib.ObjectList = ObjectList;

    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = listlib;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(['compose'], function(compose) {
                return listlib;
            });
        }
        else {
            window.__$$Compose.utils_List = listlib;
        }
    }



})();
},{}],9:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
/*
   Stomp Over WebSocket http://www.jmesnil.net/stomp-websocket/doc/ | Apache License V2.0

   Copyright (C) 2010-2013 [Jeff Mesnil](http://jmesnil.net/)
   Copyright (C) 2012 [FuseSource, Inc.](http://fusesource.com)
*/
!function(){var t,e,n,i,r={}.hasOwnProperty,o=[].slice;t={LF:"\n",NULL:"\0"};n=function(){var e;function n(t,e,n){this.command=t;this.headers=e!=null?e:{};this.body=n!=null?n:""}n.prototype.toString=function(){var e,i,o,s,u;e=[this.command];o=this.headers["content-length"]===false?true:false;if(o){delete this.headers["content-length"]}u=this.headers;for(i in u){if(!r.call(u,i))continue;s=u[i];e.push(""+i+":"+s)}if(this.body&&!o){e.push("content-length:"+n.sizeOfUTF8(this.body))}e.push(t.LF+this.body);return e.join(t.LF)};n.sizeOfUTF8=function(t){if(t){return encodeURI(t).match(/%..|./g).length}else{return 0}};e=function(e){var i,r,o,s,u,a,c,f,h,l,p,d,g,b,m,v,y;s=e.search(RegExp(""+t.LF+t.LF));u=e.substring(0,s).split(t.LF);o=u.shift();a={};d=function(t){return t.replace(/^\s+|\s+$/g,"")};v=u.reverse();for(g=0,m=v.length;g<m;g++){l=v[g];f=l.indexOf(":");a[d(l.substring(0,f))]=d(l.substring(f+1))}i="";p=s+2;if(a["content-length"]){h=parseInt(a["content-length"]);i=(""+e).substring(p,p+h)}else{r=null;for(c=b=p,y=e.length;p<=y?b<y:b>y;c=p<=y?++b:--b){r=e.charAt(c);if(r===t.NULL){break}i+=r}}return new n(o,a,i)};n.unmarshall=function(n){var i;return function(){var r,o,s,u;s=n.split(RegExp(""+t.NULL+t.LF+"*"));u=[];for(r=0,o=s.length;r<o;r++){i=s[r];if((i!=null?i.length:void 0)>0){u.push(e(i))}}return u}()};n.marshall=function(e,i,r){var o;o=new n(e,i,r);return o.toString()+t.NULL};return n}();e=function(){var e;function r(t){this.ws=t;this.ws.binaryType="arraybuffer";this.counter=0;this.connected=false;this.heartbeat={outgoing:1e4,incoming:1e4};this.maxWebSocketFrameSize=16*1024;this.subscriptions={}}r.prototype.debug=function(t){var e;return typeof window!=="undefined"&&window!==null?(e=window.console)!=null?e.log(t):void 0:void 0};e=function(){if(Date.now){return Date.now()}else{return(new Date).valueOf}};r.prototype._transmit=function(t,e,i){var r;r=n.marshall(t,e,i);if(typeof this.debug==="function"){this.debug(">>> "+r)}while(true){if(r.length>this.maxWebSocketFrameSize){this.ws.send(r.substring(0,this.maxWebSocketFrameSize));r=r.substring(this.maxWebSocketFrameSize);if(typeof this.debug==="function"){this.debug("remaining = "+r.length)}}else{return this.ws.send(r)}}};r.prototype._setupHeartbeat=function(n){var r,o,s,u,a,c,f=this;if((a=n.version)!==i.VERSIONS.V1_1&&a!==i.VERSIONS.V1_2){return}c=function(){var t,e,i,r;i=n["heart-beat"].split(",");r=[];for(t=0,e=i.length;t<e;t++){u=i[t];r.push(parseInt(u))}return r}(),o=c[0],r=c[1];if(!(this.heartbeat.outgoing===0||r===0)){s=Math.max(this.heartbeat.outgoing,r);if(typeof this.debug==="function"){this.debug("send PING every "+s+"ms")}this.pinger=i.setInterval(s,function(){f.ws.send(t.LF);return typeof f.debug==="function"?f.debug(">>> PING"):void 0})}if(!(this.heartbeat.incoming===0||o===0)){s=Math.max(this.heartbeat.incoming,o);if(typeof this.debug==="function"){this.debug("check PONG every "+s+"ms")}return this.ponger=i.setInterval(s,function(){var t;t=e()-f.serverActivity;if(t>s*2){if(typeof f.debug==="function"){f.debug("did not receive server activity for the last "+t+"ms")}return f.ws.close()}})}};r.prototype._parseConnect=function(){var t,e,n,i;t=1<=arguments.length?o.call(arguments,0):[];i={};switch(t.length){case 2:i=t[0],e=t[1];break;case 3:if(t[1]instanceof Function){i=t[0],e=t[1],n=t[2]}else{i.login=t[0],i.passcode=t[1],e=t[2]}break;case 4:i.login=t[0],i.passcode=t[1],e=t[2],n=t[3];break;default:i.login=t[0],i.passcode=t[1],e=t[2],n=t[3],i.host=t[4]}return[i,e,n]};r.prototype.connect=function(){var r,s,u,a,c=this;r=1<=arguments.length?o.call(arguments,0):[];a=this._parseConnect.apply(this,r);u=a[0],this.connectCallback=a[1],s=a[2];if(typeof this.debug==="function"){this.debug("Opening Web Socket...")}this.ws.onmessage=function(i){var r,o,u,a,f,h,l,p,d,g,b,m;a=typeof ArrayBuffer!=="undefined"&&i.data instanceof ArrayBuffer?(r=new Uint8Array(i.data),typeof c.debug==="function"?c.debug("--- got data length: "+r.length):void 0,function(){var t,e,n;n=[];for(t=0,e=r.length;t<e;t++){o=r[t];n.push(String.fromCharCode(o))}return n}().join("")):i.data;c.serverActivity=e();if(a===t.LF){if(typeof c.debug==="function"){c.debug("<<< PONG")}return}if(typeof c.debug==="function"){c.debug("<<< "+a)}b=n.unmarshall(a);m=[];for(d=0,g=b.length;d<g;d++){f=b[d];switch(f.command){case"CONNECTED":if(typeof c.debug==="function"){c.debug("connected to server "+f.headers.server)}c.connected=true;c._setupHeartbeat(f.headers);m.push(typeof c.connectCallback==="function"?c.connectCallback(f):void 0);break;case"MESSAGE":p=f.headers.subscription;l=c.subscriptions[p]||c.onreceive;if(l){u=c;h=f.headers["message-id"];f.ack=function(t){if(t==null){t={}}return u.ack(h,p,t)};f.nack=function(t){if(t==null){t={}}return u.nack(h,p,t)};m.push(l(f))}else{m.push(typeof c.debug==="function"?c.debug("Unhandled received MESSAGE: "+f):void 0)}break;case"RECEIPT":m.push(typeof c.onreceipt==="function"?c.onreceipt(f):void 0);break;case"ERROR":m.push(typeof s==="function"?s(f):void 0);break;default:m.push(typeof c.debug==="function"?c.debug("Unhandled frame: "+f):void 0)}}return m};this.ws.onclose=function(){var t;t="Whoops! Lost connection to "+c.ws.url;if(typeof c.debug==="function"){c.debug(t)}c._cleanUp();return typeof s==="function"?s(t):void 0};return this.ws.onopen=function(){if(typeof c.debug==="function"){c.debug("Web Socket Opened...")}u["accept-version"]=i.VERSIONS.supportedVersions();u["heart-beat"]=[c.heartbeat.outgoing,c.heartbeat.incoming].join(",");return c._transmit("CONNECT",u)}};r.prototype.disconnect=function(t,e){if(e==null){e={}}this._transmit("DISCONNECT",e);this.ws.onclose=null;this.ws.close();this._cleanUp();return typeof t==="function"?t():void 0};r.prototype._cleanUp=function(){this.connected=false;if(this.pinger){i.clearInterval(this.pinger)}if(this.ponger){return i.clearInterval(this.ponger)}};r.prototype.send=function(t,e,n){if(e==null){e={}}if(n==null){n=""}e.destination=t;return this._transmit("SEND",e,n)};r.prototype.subscribe=function(t,e,n){var i;if(n==null){n={}}if(!n.id){n.id="sub-"+this.counter++}n.destination=t;this.subscriptions[n.id]=e;this._transmit("SUBSCRIBE",n);i=this;return{id:n.id,unsubscribe:function(){return i.unsubscribe(n.id)}}};r.prototype.unsubscribe=function(t){delete this.subscriptions[t];return this._transmit("UNSUBSCRIBE",{id:t})};r.prototype.begin=function(t){var e,n;n=t||"tx-"+this.counter++;this._transmit("BEGIN",{transaction:n});e=this;return{id:n,commit:function(){return e.commit(n)},abort:function(){return e.abort(n)}}};r.prototype.commit=function(t){return this._transmit("COMMIT",{transaction:t})};r.prototype.abort=function(t){return this._transmit("ABORT",{transaction:t})};r.prototype.ack=function(t,e,n){if(n==null){n={}}n["message-id"]=t;n.subscription=e;return this._transmit("ACK",n)};r.prototype.nack=function(t,e,n){if(n==null){n={}}n["message-id"]=t;n.subscription=e;return this._transmit("NACK",n)};return r}();i={VERSIONS:{V1_0:"1.0",V1_1:"1.1",V1_2:"1.2",supportedVersions:function(){return"1.1,1.0"}},client:function(t,n){var r,o;if(n==null){n=["v10.stomp","v11.stomp"]}r=i.WebSocketClass||WebSocket;o=new r(t,n);return new e(o)},over:function(t){return new e(t)},Frame:n};if(typeof window!=="undefined"&&window!==null){i.setInterval=function(t,e){return window.setInterval(e,t)};i.clearInterval=function(t){return window.clearInterval(t)};window.Stomp=i}else if(typeof exports!=="undefined"&&exports!==null){exports.Stomp=i}else{self.Stomp=i}}.call(this);
},{}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[4]);
