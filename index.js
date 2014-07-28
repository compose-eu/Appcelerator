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

    var composeDeps = [
        'bluebird', 'stompjs',
        'utils/List', 'client', 'WebObject', 'ServiceObject',
        'platforms/stomp/browser', 'platforms/mqtt/browser', 'platforms/http/browser'
    ];

    var Compose = function() {

        var compose = this;

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

        var registerUrl = "http://www.servioticy.com/?page_id=73";

        // configurations
        compose.config = config;
        // utils
        compose.util = {};
        // modules referece
        compose.lib = {
            registry: {}
        };
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
                    return (typeof document !== 'undefined' && typeof document.getElementById !== 'undefined');
                },
                titanium: function() {
                    return (typeof Titanium !== 'undefined' && typeof Titanium.API !== 'undefined');
                },
                node: function() {
                    return (typeof process !== 'undefined' && typeof process.exit !== 'undefined');
                }
            };

            var info = {};
            for(var type in platforms) {
                info[type] = platforms[type]();
                if(info[type]) {
                    info.name = type;
                }
            }

            if(info.name) {
                return info;
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

            if(compose.config.platform.titanium) {
                var lib = compose.util.getVendorsPath() + 'bluebird/titanium/bluebird';
                PromiseLib = compose.require(lib);
            }
            else if(compose.config.platform.browser && window.define === 'undefined') {
                PromiseLib = compose.require(compose.util.getVendorsPath() + 'bluebird/browser/bluebird');
            }
            else {
                PromiseLib = compose.require("bluebird");
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
                        + '/' + compose.config.platform.name;
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
            return compose.require(path);
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

        /*
         * Mask for `require` calls to keep functionalities either in non-U|AMD
         * enviroments (specifically, auto-loading in browser)
         */
        compose.require = (function() {

            if(compose.config.platform.titanium || compose.config.platform.node) {
                return require;
            }

            if(compose.config.platform.browser) {

                return function(requiredName) {

                    console.log("Require ", requiredName);

                    if(requiredName.match(/bluebird/)) {
                        return window.Promise;
                    }

                    if(requiredName.match(/stompjs/i)) {
                        return window.Stomp;
                    }

                    var module = compose.lib.registry[requiredName.substr(2)] || compose.lib.registry[requiredName];

                    console.log(compose.lib.registry, requiredName.substr(2), module);
    //                var moduleName = requiredName.replace(/[.\/]+/, "").replace(/\//, "_").replace(/\//, "_");
    //                var module = window.__$$Compose[moduleName];

                    return module;
                };
            }

        })();

        /**
         * Placeholder for ready callback
         * */
        compose.ready = function(cb) { cb(compose); return; };

        /**
         *
         * Load dependecies of the library directly injecting <script> tag in the DOM
         *
         * @param {Function} onReadyCallback Called when loading is done
         * */
        compose.util.loadDeps = function(onReadyCallback) {

            if(onReadyCallback && compose.isReady) {
                onReadyCallback(compose);
                return;
            };

            // global references container
            window.__$$composeioRegistry = compose.lib.registry;
            window.compose = window.compose || compose;
            if(window.compose !== compose) {
                window.Compose = compose;
            }

            var _requireAlias = {
                "bluebird": "vendors/bluebird/browser/bluebird",
                "stompjs": "vendors/stompjs/stomp.min",
            };

            compose.config.isReady = false;
            var onLoadCallback = onReadyCallback;

            compose.ready = function(cb) {
                onLoadCallback = cb || onLoadCallback;
                if(compose.config.isReady) {
                    cb(compose);
                    onLoadCallback = null;
                }
            };

            var deps = composeDeps;
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

                        if(window.__$$composeioRegistry) {
                            delete window.__$$composeioRegistry;
                        }

                        // call on load!
                        compose.config.isReady = true;

                        onLoadCallback && onLoadCallback(compose);
                        onReadyCallback && onReadyCallback(compose);
                    }
                };

                while(_d.length) {
                    c++;
                    append(_d.shift(), _counter);
                }

            })();

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


        /**
         * Turn debug on or off.
         * If an integer is provided there will be logging only for some components
         *  - debug < 15   library base logs
         *  - debug >= 15  client log
         *  - debug >=  20 adapters log
         * @param {Boolean} debug Set to true to turn it on, false otherwise
         * */
        compose.setDebug = function(debug) {

                compose.config.debug = debug;

                if(compose.config.debug) {
                    if(!compose.config.platform.titanium)
                        compose.lib.Promise && compose.lib.Promise.longStackTraces();
                }

            };

        /**
         *
         * @param {String} model
         * @return {Promise<Function(Object)>} a promise wtih a future new service object based on model definition
         */
        compose.getDefinition = function(model) {
            var r = compose.util.setupModule("utils/DefinitionReader");
            return r.read(model);
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
         * @return {Promise}
         *
         */
        compose.setup = function(_config) {

            var Promise = compose.util.getPromiseLib();
            return new Promise(function(resolve, reject) {

                compose.ready(function() {

                    var instance = new Compose();

                    // titanium expects a path like Resources/[module]
                    // adding custom path here, overridable by module.init(baseDir)
                    var platform = instance.config.platform.name;
                    if(platform === 'titanium') {
                        instance.config.modulePath = 'compose.io/';
                    }

                    if(typeof _config === 'string') {
                        _config= { apiKey: _config };
                    }

                    if(_config) {

                        instance.config.modulePath = _config.modulePath || instance.config.modulePath;
                        instance.config.platformsPath = _config.platformsPath || instance.config.platformsPath;

                        if(_config.transport) {
                             instance.config.transport = _config.transport;
                            if(_config[config.transport]) {
                                instance.config[config.transport] = _config[config.transport] || null;
                            }
                        }

                        instance.config.url = _config.url || instance.config.url;
                        instance.config.apiKey = _config.apiKey;

                        instance.config.debug = _config.debug || instance.config.debug;
                        DEBUG = instance.config.debug;
                    }

                    if(!instance.config.apiKey) {
                        throw new compose.error.ComposeError("An apiKey is required to use the platform, please visit " +
                                registerUrl + " for further instructions");
                    }


                    var setPaths = function() {
                        if(instance.config.platform.node || instance.config.platform.browser) {
                            // free definition path location
                            instance.config.definitionsPath = "";
                        }
                    };
                    setPaths();

                    /**
                     * Select the best supported transport mechanism for the current platform
                     * */
                    var selectPreferredTransport = function() {
                        if(!instance.config.transport) {
                            var p = "http";
                            switch (instance.config.platform.name) {
                                case "titanium":
                                case "node":
                                    p = "mqtt";
                                    break;
                                case "browser":
                                    p = "stomp";
                                    break;
                            }
                            instance.config.transport = p;
                        }
                        d("selected transport is " + instance.config.transport);
                    };
                    selectPreferredTransport();

                    instance.setDebug(config.debug);

                    instance.util.List = instance.util.setupModule("utils/List");

                    instance.lib.Promise = instance.util.getPromiseLib();

                    if(!instance) {
                        throw new instance.error.ComposeError("compose.io module reference not provided, quitting..");
                    }

                    instance.lib.Client = instance.util.setupModule("client");
                    instance.util.queueManager = instance.lib.Client.queueManager;

                    // initialize & expose WebObject module
                    instance.lib.WebObject = instance.util.setupModule("WebObject");
                    instance.WebObject = instance.lib.WebObject.WebObject;

                    // initialize & expose ServiceObject module
                    instance.lib.ServiceObject = instance.util.setupModule("ServiceObject");
                    instance.util.DataBag = instance.lib.ServiceObject.DataBag;
                    instance.ServiceObject = instance.lib.ServiceObject.ServiceObject;

                    // alias
                    instance.load = instance.lib.ServiceObject.load;
                    instance.delete = instance.lib.ServiceObject.delete;
                    instance.create = instance.lib.ServiceObject.create;
                    instance.list = instance.lib.ServiceObject.list;

                    resolve(instance);
                });
            });

        };
    };

    // init library, will act as a factory when setup is called multiple time
    var compose = new Compose;

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = compose;
    }
    else {

        var deps = composeDeps.deps;
        if (typeof define === 'function' && define.amd) {

            // Taint DOM in case define/require are not compatible
            // (as for external browserify-ed modules)
            compose.ready = compose.util.loadDeps;
            window.Compose = compose;

            define(deps, function() { return compose; });
        }
        else {
            if(typeof window.require === 'undefined') {
                compose.util.loadDeps();
            };
        }
    }


}).call(this);