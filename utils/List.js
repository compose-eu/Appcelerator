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