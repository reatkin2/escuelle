'use strict';

var parser = require('./lib/parser');
var normalizer = require('./lib/normalizer');

module.exports = {
    rawParse: parser.parse,
    normalize: normalizer.normalize,
    parse: function(query) {
        return normalizer.normalize(parser.parse(query));
    }
};