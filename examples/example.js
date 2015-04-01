var jsonlt = require('../lib/jsonlt');

var src = {
    "firstName": "John",
    "lastName": "Smith",
    "address": {
        "suburb": "Brisbane",
        "postCode": 4000,
        "street": "200 Adelaide"
    },
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
    "person": {
        "firstName": "#firstName",
        "lastName": "#lastName"
    },
    "lastOrder": "#orders[-1]",
    "ordersString": "#(string)orders",
    "CDs": "#items|type='CD'",
    "descriptions": "#items*description",
    "address": "#address^",
    "addressNormal": "#address.street, #address.suburb #address.postCode",
    "totalOrders": "#orders.length"
};

console.log(jsonlt.transform(src, rules));