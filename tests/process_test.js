var JSONLT = require('../lib/jsonlt');

module.exports = {

    simpleObject: function (test) {

        var jsonlt = new JSONLT();

        var src = {
            "firstName": "John",
            "lastName": "Smith",
            "address": {
                "suburb": "Brisbane",
                "postCode": 4000,
                "street": "200 Adelaide"
            },
            "noWay": false,
            "example": {
                "example2": {
                    "example3": "pew"
                }
            }
        };

        var rules = {
            "person": {
                "firstName": "#firstName",
                "lastName": "#lastName"
            },
            "address": "#address.street",
            "addressNormal": "#address.street, #address.suburb #address.postCode",
            "example": "#example.example2.example3"
        };

        var objectToBe = { person: { firstName: 'John', lastName: 'Smith' },
            address: '200 Adelaide',
            addressNormal: '200 Adelaide, Brisbane 4000',
            example: 'pew'
        };

        test.deepEqual(jsonlt.transform(src, rules), objectToBe, "Simple object must be ok");
        test.done();
    },

    extendedObject: function (test) {

        var jsonlt = new JSONLT();

        var src = {
            "orders": [ 2342000, 2342001, 23400015],
            "items": [
                {
                    "type": "book",
                    "description": "Simple book..."
                },
                {
                    "type": "CD",
                    "description": "Simple music CD",
                    "artist": "Unknown Artist"
                }
            ]
        };

        var rules = {
            "@jsonlt": 1,
            "lastOrder": "#orders[-1]",
            "ordersString": "#(string)orders",
            "CDs": "#items|type='CD'",
            "descriptions": "#items*description",
            "totalOrders": "#orders.length"
        };

        var objectToBe = {
            lastOrder: 23400015,
            ordersString: '2342000,2342001,23400015',
            CDs:
                [ { type: 'CD',
                    description: 'Simple music CD',
                    artist: 'Unknown Artist' } ],
            descriptions: [ 'Simple book...', 'Simple music CD' ],
            totalOrders: 3
        };

        test.deepEqual(jsonlt.transform(src, rules), objectToBe, "Extended object must be ok");
        test.done();
    }
};