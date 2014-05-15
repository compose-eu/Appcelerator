compose.io - COMPOSE JS library
========

compose.io is the [COMPOSE] JavaScript library designed to be used with [Titanium Appcelerator] platform, node.js and modern browsers.

[Titanium Appcelerator]:http://www.appcelerator.com
[COMPOSE]:http://www.compose-project.eu
[REST API]:http://docs.servioticy.com/

#Topics

- [Installation](#installation)
    - [Appcelerator Titanium Mobile](#appcelerator-titanium-mobile)
    - [Node.js](#nodejs)
    - [Browser](#browser)
- [Library configuration](#library-configuration)
- [Example usage](#example-usage)
    - [List all Service Objects](#list-all-service-objects)
    - [List all Service Objects](#list-all-service-objects)
    - [Create a Service Object](#create-a-service-object)
    - [Load a Service Object definition](#load-a-service-object-definition)
    - [Sending data update](#sending-data-update)
    - [Loading a Service Object by ID](#loading-a-service-object-by-id)
    - [Retrieving data from a Service Object](#retrieving-data-from-a-service-object)
    - [Search for data in a Stream](#search-for-data-in-a-stream)
        - [Numeric range](#numeric-range)
        - [Time range](#time-range)
        - [Match](#match)
        - [Bounding box](#bounding-box)
        - [Distance](#distance)
- [Getting realtime updates](#getting-realtime-updates)
- [Additional notes](#additional-notes)
    - [Async impl](#async-impl)
    - [API support](#api-support)
- [Tests](#tests)
- [Contributing](#contributing)
- [Docs](#docs)
- [License](#license)

<hr>

#Installation

##Appcelerator Titanium Mobile


Add the library inside the `Resources` folder (or `app/lib` if you use Alloy) in your project, then in the code

`var compose = require('compose.io/index')`

##Node.js

Install the module from the git repository

` npm i git+https://github.com/compose-eu/Appcelerator.git`

and then import it in your code

`var compose = require('compose.io')`


##Browser

You can simply link to the `index.js` script inside your page

`<script src="js/compose.io/index.js"></script>`

The library will self-load all its dependencies, you can provide a callback to the `ready` method in order to get notified of the completion of the operation.

```
Compose.ready(function(compose) {
    // all dependencies loaded!
});
```

If you wish to use the library in an AMD-enable setup (like with [require.js](http://requirejs.org/)) some configuration are required in order to load the correct resources.

(This will be better handled in future releases)

```
require.config({
    paths: {

        "compose.io": 'compose.io/index',
        "utils/List": 'compose.io/utils/List',
        "bluebird": 'compose.io/vendors/bluebird/browser/bluebird',
        "client": 'compose.io/client',
        "WebObject": 'compose.io/WebObject',
        "ServiceObject": 'compose.io/ServiceObject',

        "platforms/mqtt/browser": "compose.io/platforms/mqtt/browser",
        "platforms/websocket/browser": "compose.io/platforms/websocket/browser",
        "platforms/http/browser": "compose.io/platforms/http/browser"

    }
});
```
Once done, just request the module

`var compose = require('compose.io')`

#Library configuration

The minimal configuration required is the apiKey to access the API.

Please refer to the [Online demo](http://www.servioticy.com/?page_id=73) section on servioticy.com to request your api key.

`compose.setup('your api key');`

All the available options follow

```
compose.setup({

    // api key
    apiKey: '<api key>',

    // Compose API endpoint
    url: 'http://api.servioticy.com'

    // transport type, one of http, mqtt, websocket
    transport: 'websocket'

    // Additional configuration to be passed to sub-modules handling data trasmission
    // can be passed by adding a properties matching the transport name
    websocket: {
        proto: 'ws', // or 'wss'
        host: 'api.servioticy.com',
        port: 8081,
        path: ""
    },
    mqtt: {
        proto: 'mqtt', // or 'mqtts'
        host: 'api.servioticy.com',
        port: 1883
        user: 'compose',
        password: 'shines'
    }

});

```

#Example usage


##List all Service Objects

```

compose.list()
    .then(function(list) {

        console.info("List loaded, " + list.length + " elements");

    })

    // .catch is optional, will report errors, if any occurs
    .catch(function(e) {
        console.warn("An error occured!");
    })
    // .finally is optional too, will run after the request is completed (either if failed)
    .finally(function() {
        console.log("Done");
    });

```

Load all the Service Objects in the list.

```
compose.list().map(compose.load).then(function(list) {
    // list is an array containing ServiceObject instances
    list.forEach(function(so) {
        console.log(so.id, so.toString());
    })
})
// .catch(fn).finally(fn)
;
```

Get the data from all the Service Objects in the list

```
compose.list().map(compose.load).map(function(so) {
    // return a Promise to use further chainability
    return so.getStream("location") && so.getStream("location").pull();
})
.then(function(res) {
    // res is now a list of DataBag
    res.forEach(function(dataset) {
        console.log( "Last position registered for " +
            dataset.container() // Stream reference
                .container() // ServiceObject reference
                    .id +
            + " is " + dataset.last().get('latitude') + ", " + dataset.last().get('longitude') );
    });

})
// .catch(fn).finally(fn)
;
```

Delete all the ServiceObject
```
compose.list().map(compose.delete).then(function() {
    console.log("Done");
})
// .catch(fn).finally(fn)
;
```

##Create a Service Object

Follows a pseudo drone definition as per COMPOSE spec.

The `location` stream will keep track of the movement of the drone

```
var droneDefinition = {
   "name": "Drone",
   "description": "My amazing drone",
   "public":"false",
   "streams": {
         "location": {
            "channels": {
                "latitude": {
                    "type": "Number",
                    "unit": "degrees"
                },
                "longitude": {
                    "type": "Number",
                    "unit": "degrees"
                }
            },
            "description": "GPS location",
            "type": "sensor"
        }
    },
    "customFields": {
        model: 'drone-001',
        colors: ['red', 'blue']
    },
    "actions": [],
    "properties": []
}
```

Create the drone Service Object on the backend

```

compose.create(droneDefinition)
    .then(function(drone) {

        // drone is the new ServiceObject create
        console.info("Drone ServiceObject created, id" + drone.id);
        console.info(drone.toString());

        // see below how to use the drone object to send and receive data

    }).catch(function(e) {

        console.warn("An error occured!");
        console.error(e);

    });


```

##Load a Service Object definition

The json definition can be stored in the `./definitions` folder (eg `./definitions/drone.json`)

```
// use just the json filename
compose.getDefinition("drone")
    .then(compose.create) // enjoy Promise
    .then(function(drone) {
        console.log("Drone SO loaded!");
    });

```

##Sending data update

First you have to select the stream you want to use, `location` in our case

The simple way

```javascript

drone.getStream('location').push({
    latitude: 11.234,
    longitude: 45.432
}).then(successCallback);

```

Alternative, detailed example

```javascript

// select a stream
drone.getStream('location')

    // set a single channel name
    .setValue('latitude', 11.234)

    // set multiple values
    .setValues({
        latitude: 11.234,
        longitude: 45.432
    })

    // set the data update time, as unix timestamp.
    // If not set,  the request timestamp will be used
    .setLastUpdate( (new Date).getTime() )
    .push();

```

##Loading a Service Object by ID

Imagine now to work on a mobile application to control the drone.

```
var soid = '<ServiceObject id>';
compose.load(soid)
    .then(function(drone) {

        // drone is the new ServiceObject
        console.info("Drone ServiceObject created, id" + drone.id);
        console.info(drone.toString());

    })
//  .catch(fn)
//  .finally(fn)
    ;
```

##Retrieving data from a Service Object

Load the drone Service Object by its ID (or load the list and search for it)

The returned value is a `DataBag` object which expose some simplified methods to use the data from the stream

```

drone.getStream("location")
    .pull().then(function(data) {

        console.log("Data for stream loaded " + data.size());

        // iterate results
        while(data.next()) {
            // current return the data stored at the position of the internal cursor
            var value = data.current();
            console.log("Data loaded " + value.get("latitude") + ", " + value.get("longitude"));
        }

        // Stream reference
        var StreamRef = data.container();
        // ServiceObject reference
        var ServiceObjectRef = StreamRef.container();

        console.log("Data for " + data.container().container().name + "." + data.container().name);
        // will print `Data for Drone.location`

        // count the data list
        var count = data.size();

        // get the current index (position in the list)
        var index = data.index();

        // reset internal cursor
        // data.index() will return 0
        data.reset();

        // first data stored
        data.first();

        // last data stored
        data.last();

        // get data at a certain index
        var item = data.at(index);

        console.log(item);
        // { channels: { latitude: { current-value: 'val' } } }

        // shorthand to get the values
        var lat = item.get("latitude"),
            lng = item.get("longitude");
        console.log( lat , lng );

        //get a value from the list
        // data.get(index, channel_name, defaultValue)
        var lng1 = data.get(data.size()-1, "longitude", -1);

        console.log( (lng === lng1) ? "It works!" : "Something went wrong.." );

    });

```

##Search for data in a Stream

Methods to search for data in a stream. All search method returns promises

Available search types are

- [Numeric range](#numeric-range)
- [Time range](#time-range)
- [Match](#match)
- [Bounding box](#bounding-box)
- [Distance](#distance)

###Numeric Range

Search for data in a stream matching a numeric range constrain

```
drone.getStream('stream name').searchByNumber("channel name", { from: 'val1', to: 'val2' });
drone.getStream('stream name').searchByNumber("channel name", val_from, val_to });
```

To combine with other filters
```
drone.getStream('stream name').search({
    numeric: {
        channel: 'channel name',
        from: 'val1'
        to: 'val2'
    }
});
```

###Time Range

Search for data in a time range, creation date (`lastUpdate`) value will be used to match the search

```
// timeFrom / timeTo can be any value readable as a javascript `Date`
drone.getStream('stream name').searchByTime(timeFrom, timeTo);
drone.getStream('stream name').searchByTime("Tue May 13 2014 10:21:18 GMT+0200 (CEST)", new Date());
```

To combine with other filters
```
drone.getStream('stream name').search({
    time: {
        from: 1368433278000,
        to:   1399969278000
    }
});
```

###Match

Search for a matching value in a provided channel

```
drone.getStream('stream name').searchByText("channel name", "string to search");
```

To combine with other filters
```
drone.getStream('stream name').search({
    match: {
        channel: "channel name",
        string: "string to search"
    }
});
```

###Bounding box

Search by a delimiting [bounding box](http://en.wikipedia.org/wiki/Minimum_bounding_box)

This search type will look to match a channel named `location` with a geojson value. [See API docs](http://docs.servioticypublic.apiary.io/#dataqueries)


```
drone.getStream('stream name').searchByBoundingBox([
    // upper point
    { latitude: '', longitude: '' },
    // lower point
    { latitude: '', longitude: '' }
]);
```

To combine with other filters (incompatible with distance, if both provided `bbox` will be used )
```
drone.getStream('stream name').search({
    bbox: {
        coords: [
            // upper point
            { latitude: '', longitude: '' },
            // lower point
            { latitude: '', longitude: '' }
        ]
        // or
        // coords: [ toplat, toplon, bottomlat, bottomlon ]
    }
});
```

###Distance

Search data by distance

```
// default unit is km
drone.getStream('stream name').searchByDistance({ latitude: 11,longitude: 46 }, 10);

// specifying a unit
drone.getStream('stream name').searchByDistance({ latitude: 11,longitude: 46 }, 1000, 'm');
```

To combine with other filters (incompatible with bbox, if both provided `bbox` will be used )

```
drone.getStream('stream name').search({
    distance: {
        position: { latitude: 11, longitude: 46 },
        // or
        // position: [11, 46],
        value: 1,
        unit: 'km'
    }
});

```

#Getting realtime updates

** This section is under development and changes will occur, soon **

Realtime updates works only with mqtt and websocket transport types as two-way communication is available

At the moment, all the request made by a Service Object are broadcasted to all the Service Objects
To get all the updates (from ALL the service objects)

```
// register to updates
droid.on("data", function(data, raw) {
    console.log("Received data ", data);
    console.log("Raw message was ", raw);
})

// unregister from updates
droid.off("data")


```


#Additional notes

* In order to use mqtt/websocket please setup those bridge until an alternative is available
* * [mqtt bridge](https://gist.github.com/muka/78d91529473f293b9df9)
* * [websocket bridge](https://gist.github.com/muka/dba612c1fe33102f32ac)

Browser support has been tested on latest Firefox and Chrome (any feedback is appreciated!)

##Async impl

Async request are implemented as [Promise](http://promises-aplus.github.io/promises-spec/), using the [bluebird](https://github.com/petkaantonov/bluebird) library


##API support

Current status of the library follows the [Servioticy docs](http://docs.servioticy.com) reference implementation.

*Service Objects*

* All available CRUD operation are supported
* List of SO

*Streams*

* refresh - load a fresh list of streams
* push - send data
* pull - receive data list (filtered search adapted support TBD)
* search - untested, implemented

*Subscriptions*

* untested, implemented

*Actuations*

* untested, implemented


#Tests

Unit tests are available in spec/ and use Jasmine Spec

For node.js [jasmine-node](https://github.com/mhevery/jasmine-node) is used.

Titanium tests support are under development and will use [tishadow](http://tishadow.yydigital.com/) tests enviroment (jasmine)

Browser tests are `undefined` at the moment, but will be covered

`npm test`

#Contributing

Any help is welcome!

Feel free to open an issue or contact us to discuss the library status

#Docs

API docs needs review. Can be generated using `jsdoc` and will be added to the repository once the library has a stable release.

`npm install -g jsdoc`

`jsdoc ./`


#License

Apache2

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
