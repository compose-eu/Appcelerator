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

    var pushData = [
        {
            testnumeric: 110,
            testtext: "abba rolling stones pink floid",
            location: [15, 55]
        },
        {
            testnumeric: 120,
            testtext: "britney spears ramazzotti",
            location: [20, 60]
        },
        {
            testnumeric: 140,
            testtext: "bieber minogue pink floid",
            location: [25, 65]
        },
        {
            testnumeric: 160,
            testtext: "dire straits pink floid",
            location: [30, 70]
        }
    ];


    it('Search by Bounding Box', function(done) {

        compose.create(smartphoneDefinition)
            .then(function(so) {

                smartphone = so;

                pushData.forEach(function(data) {
                    smartphone.getStream('test').push(data);
                });

                setTimeout(function() {

                    smartphone.getStream('test').searchByBoundingBox([
                        { latitude: 0, longitude: 0 }, { latitude: 100, longitude: 100 }
                    ])
                    .then(function(res) {
                        expect(res.size()).toEqual(pushData.length);
                    })
                    .catch(console.log)
                    .finally(done);

                }, 1500);

            })
            .catch(console.log)

    });

    it('Search by Distance', function(done) {

        smartphone.getStream('test')
            .searchByDistance({ latitude: 15, longitude: 55 }, 10000)
            .then(function(res) {
                expect(res.size()).toEqual(pushData.length);
            })
            .catch(console.log)
            .finally(done);
    });

    it('Search by Text', function(done) {

        smartphone.getStream('test')
            .searchByText("testtext", "pink floid")
            .then(function(res) {
                expect(res.size()).toEqual(3);
            })
            .catch(console.log)
            .finally(done);
    });

    it('Search by Number', function(done) {

        smartphone.getStream('test')
            .searchByNumber("testnumeric", 100, 150)
            .then(function(res) {
                expect(res.size()).toEqual( pushData.length -1 );
            })
            .catch(console.log)
            .finally(done);
    });

    it('Search by Time', function(done) {

        smartphone.getStream('test')
            .searchByTime((new Date().getTime() - (1000 * 60 * 60 * 24 * 365 * 10)))
            .then(function(res) {
                expect(res.size()).toEqual(pushData.length-1);
            })
            .catch(console.log)
            .finally(done);
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