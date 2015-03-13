'use strict';

var parser = require('./lib/parser');
var normalizer = require('./lib/normalizer');
var tableize = require('./lib/tableizer');

module.exports = {
    rawParse: parser.parse,
    normalize: normalizer.normalize,
    tableize: tableize,
    parse: function(query) {
        return tableize(normalizer.normalize(parser.parse(query)));
    }
};