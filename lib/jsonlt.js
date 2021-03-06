(function() {

    var RULE_REGEXP = /(#[\w\.\*\|=\(\)\[\]\-\d\^'\\]+)/g;
    var SIMPLE_RULE = /([\w\.]+)/;

    var ARRAY_INDEX_RULE = /\[([^\]]*)\]/;
    var CAST_NAME_RULE = /\(([^\)]*)\)/;
    var FILTER_RULE = /\|(\w+)=([\w']+)/;
    var MAP_RULE = /\*(\w+)/;
    var EXPAND_RULE = /\^(.*)/;

    // These things were stolen from Underscore:
    // https://github.com/jashkenas/underscore/blob/master/underscore.js

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Export the JSONLT object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = JSONLT;
        }
        exports.JSONLT = JSONLT;
    } else {
        root.JSONLT = JSONLT;
    }

    function JSONLT(options) {
        options = options || {};

        this.options = options;
        this.options.strict = options.strict || false;

        /**
         * Transform object
         * @param {Object} sourceObject Object to transform
         * @param {Object} transformationObject Object with transformation rules
         * @returns {Object} Transformed object
         */
        this.transform = function (sourceObject, transformationObject) {
            var self = this,
                result = {};

            Object.keys(transformationObject).forEach(function (key) {
                if (typeof transformationObject[key] === 'object') {
                    result[key] = self.transform(sourceObject, transformationObject[key]);
                }
                else if (isRule(transformationObject[key])) {
                    result[key] = self.process(sourceObject, transformationObject[key])
                }
                // TODO: do something smart with version
                else if (key !== '@jsonlt') {
                    result[key] = transformationObject[key];
                }
            });

            return result;
        };

        /**
         * Is input a rule or not
         * @param {*} input
         * @returns {Boolean}
         */
        function isRule(input) {
            if (typeof input !== 'string') return false;

            // TODO: do something better
            if (input.indexOf('#') === -1) return false;
            return true;
        }

        /**
         * Raise an error or ignore depending on strict option
         * @param {String} message
         * @returns {String}
         */
        this.error = function (message) {
            if (this.options.strict) throw new Error(message + ' (JSON path: ' + this.lastPath + ')');
            return '';
        };

        /**
         * Process rule
         * @param {Object} sourceObject
         * @param {String} rulesString String with rules
         * @returns {*}
         */
        this.process = function (sourceObject, rulesString) {
            var self = this,
                output = rulesString,
                rules = rulesString.match(RULE_REGEXP);

            rules.forEach(function (rule) {
                var rawRule = rule;
                rule = rule.trim();

                // Array index like #orders[-1]
                var arrayIndexMatch = rule.match(ARRAY_INDEX_RULE);

                // Casting to type like #(string)field
                var castMatch = rule.match(CAST_NAME_RULE);
                if (castMatch) rule = rule.replace(castMatch[0], '');

                // Filer #field|type='cd'
                var filterMatch = rule.match(FILTER_RULE);

                // Map expand #field*sup
                var mapMatch = rule.match(MAP_RULE);

                // Expand #field^delimeter
                // TODO: Better comma handling
                var expandMatch = rule.match(EXPAND_RULE);
                if (expandMatch && expandMatch[1] === '') expandMatch[1] = ',';

                var match = rule.match(SIMPLE_RULE);
                var path = match[1].replace(/#/, '').trim();
                var value = self.getByPath(sourceObject, path);

                if (arrayIndexMatch) value = self.getArrayIndex(value, arrayIndexMatch);
                if (filterMatch) value = self.filter(value, filterMatch);
                if (mapMatch) value = self.mapExpand(value, mapMatch);
                if (expandMatch) value = self.expand(value, expandMatch);

                // Casting should be the last
                if (castMatch) value = self.castToType(value, castMatch);

                if (output.length === rawRule.length) output = value;
                else output = output.replace(rawRule, value);

            });
            return output;
        };

        /**
         * Get value from source object by path
         * @param {Object} sourceObject
         * @param {String} path
         * @returns {*}
         */
        this.getByPath = function (sourceObject, path) {
            var self = this,
                value = JSON.parse(JSON.stringify(sourceObject)),
                parts = path.split('.'),
                _buffer;

            self.lastPath = path;

            while (parts.length) {
                _buffer = parts.shift();
                if (typeof value[_buffer] !== 'undefined') value = value[_buffer];
                else value = self.error("Path '" + path + "' not found in object");
            }
            return value;
        };

        /**
         * Process value using array index rule
         * @param {Array} value
         * @param {Object} matchObject
         * @returns {*}
         */
        this.getArrayIndex = function (value, matchObject) {

            if (!Array.isArray(value)) return this.error("Value '" + value + "' is not an array");

            var index = parseInt(matchObject[1], 10);

            // support for negative indexes
            if (index < 0) index = value.length + index;
            if (typeof value[index] !== 'undefined') return value[index];
            else return this.error("Array out of bound, index: " + index);
        };

        /**
         * Process value using cast to type rule
         * @param {*} value
         * @param {Object} matchObject
         * @returns {*}
         */
        this.castToType = function (value, matchObject) {
            if (typeof value === 'undefined') return;

            if (matchObject[1] === 'string') return value.toString();
            else if (matchObject[1] === 'number') return parseFloat(value);
            else return this.error("Casting to unknown type '" + matchObject[1] + "'. Available: string, number");
        };

        /**
         * Process value using array filter rule
         * @param {Array} value
         * @param {Object} matchObject
         * @returns {*}
         */
        this.filter = function (value, matchObject) {
            var key = matchObject[1],
                filterValue = matchObject[2].replace(/('|\\|")/g, '');

            if (!Array.isArray(value)) return this.error("Item is not an array '" + value + "'");

            return value.filter(function (item) {
                return item[key] === filterValue
            });
        };

        /**
         * Process value using map expand rule
         * @param {Array} value
         * @param {Object} matchObject
         * @returns {*}
         */
        this.mapExpand = function (value, matchObject) {
            if (!Array.isArray(value)) return this.error("Item is not an array '" + value + "'");

            return value.map(function (item) {
                return item[matchObject[1]]
            });
        };

        /**
         * Process value using expand rule
         * @param {Object} value
         * @param {Object} matchObject
         * @returns {*}
         */
        this.expand = function (value, matchObject) {
            if (typeof value !== 'object') return this.error("Item is not an object '" + value + "'");
            var delimiter = matchObject[1];

            delimiter = delimiter.replace(/\\s/g, ' ');

            var result = [];
            Object.keys(value).forEach(function (fieldName) {
                result.push(value[fieldName]);
            });
            return result.join(delimiter);
        };

    }

}.call(this));
