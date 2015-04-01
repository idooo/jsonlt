module.exports = {
    transform: transform
};

var RULE_REGEXP = /(#[\w\.\*\|=\(\)\[\]\-\d\^'\\]+)/g;
var SIMPLE_RULE = /([\w\.]+)/;

var ARRAY_INDEX_RULE = /\[([^\]]*)\]/;
var CAST_NAME_RULE = /\(([^\)]*)\)/;
var FILTER_RULE = /\|(\w+)=([\w']+)/;
var MAP_RULE = /\*(\w+)/;
var EXPAND_RULE = /\^(.*)/;

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
        var path = match[1].replace(/#/,'').trim();
        var value = getFromSource(src, path);

        if (arrayIndexMatch) value = getArrayIndex(value, arrayIndexMatch);
        if (filterMatch) value = filter(value, filterMatch);
        if (mapMatch) value = mapExpand(value, mapMatch);
        if (expandMatch) value = expand(value, expandMatch);

        // Casting should be the last
        if (castMatch) value = castToType(value, castMatch);

        if (output.length === rawRule.length) output = value;
        else output = output.replace(rawRule, value);

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

function getArrayIndex(value, matchObject) {

    if (Array.isArray(value)) {
        var index = parseInt(matchObject[1], 10);

        // support for negative indexes
        if (index < 0) index = value.length + index;
        if (typeof value[index] !== 'undefined') return value[index];
    }
    return '';
}

function castToType(value, matchObject) {
    if (typeof value === 'undefined') return;

    if (matchObject[1] === 'string') return value.toString();
    else if (matchObject[1] === 'number') return parseFloat(value);

    // TODO: add proper error message
    else new TypeError('Available casts: string, number');

    return '';
}

function filter(value, matchObject) {
    var key = matchObject[1],
        filterValue = matchObject[2].replace(/('|\\|")/g,'');

    if (Array.isArray(value)) {
        return value.filter(function(item) { return item[key] === filterValue});
    }
    return '';
}

function mapExpand(value, matchObject) {
    if (Array.isArray(value)) {
        return value.map(function(item) { return item[matchObject[1]]});
    }
    return '';
}

function expand(value, matchObject) {
    if (typeof value !== 'object') return '';
    var delimiter = matchObject[1];

    delimiter = delimiter.replace(/\\s/g, ' ');

    var result = [];
    Object.keys(value).forEach(function(fieldName) { result.push(value[fieldName]); });
    return result.join(delimiter);
}