describe('ServiceObject', function() {

    var compose = require("../../index");

    if(typeof Compose !== 'undefined') {
        compose = Compose;
    }

    compose.setup({
//        debug: true,
        apiKey: "M2UxYTFmNzQtZDZhYi00ZTNiLWEzZWUtYzdjMTU1MzJhMDE1ZTdlYWRiYzQtMmU2ZS00YTk5LTgyNGQtZDU3YzkzOWQwYzQw",
        url: "http://192.168.9.243:8080",
        transport: 'http'
    });

    var smartphone = null;
    var smartphoneDefinition = require('./smartphone.so').definition;

    it('List SO', function(done) {
        compose.list()
            .then(function(list) {
                expect(list.length > 0).toBeTruthy();
            })
            .catch(console.log)
            .finally(done);
    });


    it('Create SO', function(done) {
        compose.create(smartphoneDefinition)
            .then(function(so) {
                expect((so.id)).toBeTruthy();
                smartphone = so;
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

        stream.setValue(raw);
        var pushData = stream.getCurrentValue();

        expect(raw.latitude).toEqual(stream.getValue('latitude'));

        stream.push()
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

                }, 1500);

            })
            .catch(console.log)

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