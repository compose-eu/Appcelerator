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
    ('platforms/http/browser', httplib);

})();