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

(function() {

    var stomplib = {};

    stomplib.initialize = function(compose) {
        throw new compose.error.ComposeError("Titanium support for stomp-over-ws has not been implemented yet. Please use mqtt instead");
    };

//    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
//        module.exports = stomplib;
//    }
//    else {
//        if (typeof define === 'function' && define.amd) {
//            define(['compose'], function(compose) {
//                return stomplib;
//            });
//        }
//        else {
//            window.__$$Compose.platforms_stomp_browser = stomplib;
//        }
//    }

})();