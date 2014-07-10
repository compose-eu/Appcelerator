Subscription CLI tool
===

Setup
---

Install dependencies

`npm i`

Create a `config.ini` file from `config.dist.ini` and customize (at least an `apiKey` is required)

Commands
---

Create a demo ServiceObject or set the id in the `soid` property in config.ini

`./cli so-create`

Use `-d` flag to specify the location of a json to use as model for the ServiceObject to be created

Send test data (will be generated randomly)

`./cli so-push`

Create a subscription

`./cli create`

Delete a subscription(s)

`./cli delete [id]`

or delete all subscriptions with `-a` flag

List of commands

`./cli -h`

Testing subscriptions
---

Open a terminal and create a listener

`./cli listen [type]`

`type` can be `pubsub` or `http`

- `http` will create an http server (see `config.ini`) for fine tuning
- `pubsub` will report to screen data coming from the stream topic

**Note:** to use pubsub, set in `config.ini` the `transport` option to `mqtt` or `stomp`

In antother terminal, send test data with

`./cli so-push`

At this point in the first terminal you should see the data sent from the second one.
