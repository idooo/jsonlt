module.exports = {
    transform: transform
};

var RULE_REGEXP = /(#[\w\.\*\|=\(\)\[\]\-\d\^']+)/g;
var SIMPLE_RULE = /^#[\w\.]+$/;

var ARRAY_ITEM_RULE = /^#[\w\.]+\[[-\d]+\]$/;
var ARRAY_INDEX_RULE = /\[([^\]]*)\]/;

var CAST_RULE = /^#\(([^\)]*)\)[\w\.]+$/;
var CAST_NAME_RULE = /\(([^\)]*)\)/;

function transform (src, transformationObject) {
    var result = {};

    Object.keys(transformationObject).forEach(function(key) {
        if (typeof transformationObject[key] === 'object') {
            result[key] = transform(src, transformationObject[key]);
        }
        else if (isRule(transformationObject[key])) {
            result[key] = process(src, transformationObject[key])
        }
        // TODO: do something smart with version
        else if (key !== '@jsonlt') {
            result[key] = transformationObject[key];
        }
    });

    return result;
}

function isRule(rule) {
    if (typeof rule !== 'string') return false;

    // TODO: do something better
    if (rule.indexOf('#') === -1) return false;
    return true;
}

function process(src, rulesString) {
    var output = rulesString;

    var rules = rulesString.match(RULE_REGEXP);
    rules.forEach(function(rule) {
        rule = rule.trim();
        var path = rule.replace(/#/,'');

        // simple rule like '#firstName'
        if (SIMPLE_RULE.test(rule)) {
            output = output.replace(rule, getFromSource(src, path));
        }

        // array like '#orders[-1]'
        else if (ARRAY_ITEM_RULE.test(rule)) {
            var index = rule.match(ARRAY_INDEX_RULE);
            path = path.replace(index[0], '');

            var arr = getFromSource(src, path);
            if (Array.isArray(arr)) {
                index = parseInt(index[1], 10);

                // support for negative indexes
                if (index < 0) index = arr.length + index;
                if (typeof arr[index] !== 'undefined') output = output.replace(rule, arr[index]);
            }
        }

        else if (CAST_RULE.test(rule)) {
            var cast = rule.match(CAST_NAME_RULE);

            path = path.replace(cast[0], '');
            var value = getFromSource(src, path);
            if (typeof value === 'undefined') return;

            cast = cast[1];
            if (cast === 'string') output = output.replace(rule, value);
            else if (cast === 'number') output = parseFloat(value);

            // TODO: add proper error message
            else new TypeError('Available casts: string, number');

        }
    });
    return output;
}

function getFromSource(src, path) {
    var value = JSON.parse(JSON.stringify(src));
    var parts = path.split('.');
    var _buffer;

    while (parts.length) {
        _buffer = parts.shift();
        if (typeof value[_buffer] !== 'undefined') value = value[_buffer];
        else return '';
    }
    return value;
}
