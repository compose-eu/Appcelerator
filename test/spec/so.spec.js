describe('ServiceObject', function() {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

    var composelib = require("../../index");
    composelib.setup({
//        debug: true,
        apiKey: "M2UxYTFmNzQtZDZhYi00ZTNiLWEzZWUtYzdjMTU1MzJhMDE1ZTdlYWRiYzQtMmU2ZS00YTk5LTgyNGQtZDU3YzkzOWQwYzQw",
        url: "http://192.168.9.243:8080",
        transport: 'http'
    }).then(function(compose){

        var smartphone = null;
        var smartphoneDefinition = require('./smartphone.so').definition;

        it('Create SO', function(done) {
            compose.create(smartphoneDefinition)
                .then(function(so) {
                    expect((so.id)).toBeTruthy();
                    smartphone = so;
                })
                .catch(console.log)
                .finally(done);
        });

        it('List SO', function(done) {
            compose.list()
                .then(function(list) {
                    expect(list.length > 0).toBeTruthy();
                })
                .catch(console.log)
                .finally(done);
        });

        it('Load SO', function(done) {
            compose.load(smartphone.id)
                .then(function(so) {
                    expect(so.id).toEqual(smartphone.id);
                })
                .catch(console.log)
                .finally(done);
        });

        it('Update SO custom fields', function(done) {
            var time = new Date().getTime();
            smartphone.customFields.newTestField = time;
            smartphone.update()
                .then(function(so) {
                    expect(smartphone.customFields.newTestField).toEqual(time);
                })
                .catch(console.log)
                .finally(done);
        });

        it('Push and pull stream data', function(done) {

            var stream = smartphone.getStream('location');
            var raw = {
                latitude: 11.123,
                longitude: 45.321
            };
            var lastUpdate = (new Date).toString();

            var pushData = stream.prepareData(raw, lastUpdate);

            expect(raw.longitude).toEqual(pushData.channels.longitude['current-value']);
            expect(lastUpdate).toEqual(new Date(pushData.lastUpdate * 1000).toString());

            stream.push(raw)
                .then(function() {

                    setTimeout(function() {

                        stream.pull('lastUpdate')
                            .then(function(data, raw) {

                                var record = data.last();

                                expect(record.lastUpdate).toEqual(pushData.lastUpdate);
                                expect(record.get("latitude")).toEqual(pushData.channels.latitude['current-value']);

                            })
                            .catch(console.log)
                            .finally(done);

                    }, 2000);

                })
                .catch(console.log);

        });

        it('Push a bunch parallel requests', function(done) {

            var stream = smartphone.getStream('location');
            var getData = function(i) {
                return {
                    channels: {
                        latitude:  11 + Math.random(),
                        longitude: 45 + Math.random()
                    },
                    lastUpdate: (new Date).getTime() + (i * 2000)
                };
            };

            var amount = 50;
            var counter = 0;
            for(var i = 0; i < amount; i++) {

                var data = getData(i);
                stream.push(data.channels, data.lastUpdate)
                    .then(function() {
                        counter++;
                    })
                    .catch(console.log);
            }

            var intv = setInterval(function() {

                if(counter !== amount) return;

                clearInterval(intv);

                setTimeout(function() {
                    stream.pull().then(function(data) {

    //                    console.log(data);
    //                    console.log(smartphone.id);

                        expect(data.size()).toEqual(amount + 1);
                    })
                    .catch(console.log)
                    .finally(done);
                }, 10000);


            }, 100);

        });

        it('Delete SO', function(done) {
            smartphone.delete()
                .then(function(so) {
                    expect(so.id).toEqual(null);
                })
                .catch(console.log)
                .finally(done);
        });
    });
});