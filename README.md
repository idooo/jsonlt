# JSONLT
#### JSON Lazy Transformation

Surprisingly I didn't find anything that can help me to solve the trivial problem - transform one simple JSON object to another without writing any code. So here we are...

#### Example
We have simple JSON input:

```json
{
	"firstName": "John",
	"lastName": "Smith",
	"address": {
		"suburb": "Brisbane",
		"postCode": 4000,
		"street": "200 Adelaide"
	},
	"orders": [ 2342000, 2342001, 23400015]
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
}
```

... and then we're applying the JSONLT template ... 

```json
{
	"person": {
		"firstName": "#firstName",
		"lastName": "#lastName"
	},
	"lastOrder": "#orders[-1]",
	"ordersString": "#(string)orders",
	"CDs": "#items|type='CD'",
	"descriptions": "#items*description",
	"address": "#address^,",
	"addressNormal": "#address.street, #address.suburb #address.postCode",
	"totalOrders": "#orders.length"
}
```

.. to have this JSON output

```json
{
	"person": {
		"firstName": "John",
		"lastName": "Smith"
	},
	"lastOrder": 23400015,
	"lastOrderString": "2342000,2342001,23400015",
	"CDs": [
		{
			"type": "CD",
			"description": "Simple music CD",
			"artist": "Unknown Artist"
		}
	],
	"descriptions": ["Simple book...", "Simple music CD"],
	"address": "Brisbane 4000 200 Adelaide",
	"addressNormal": "200 Adelaide, Brisbane 4000",
	"totalOrders": 3
}
```

### Transformation syntax:
	
##### `#fieldName` 
Return field from the input JSON object

##### `#fieldName.propertyName`
Return object.propertyName

##### `#fieldName[index]`	
Return value from array by index, -1 = last item 

##### `#(type)fieldName`
Cast to type

##### `#fieldName|propertyName=value`
Return array Array.filter by propertyName = value

##### `#fieldName*propertyName`
Return array of fieldName.propertyName elements

##### `#fieldName^delimeter`
Return string with object values divided by delimeters



## License

##### The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

