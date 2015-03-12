'use strict';

var _ = require('lodash');

module.exports = function (normal) {
    function findTables(tables, tableMap) {
        return _.reduce(tables, function (tableMap, curr) {
            if (curr.alias) {
                tableMap[curr.alias] = curr.table;
            } else {
                tableMap[curr.table] = curr.table;
            }
            if (curr.join && curr.join.length > 0) {
                findTables(curr.join, tableMap);
            }
            return tableMap;
        }, tableMap);
    }

    function tableize(columns, tables) {
        columns = _.forEach(columns, function (column) {
            if (column.type === 'call') {
                column.fields = tableize(column.fields, tables);
            } else {
                column.fields = _.forEach(column.fields, function (field) {
                    field.table = tables[field.tableAlias];
                    return field;
                });
            }
            return column;
        });

        return columns;
    }

    var tables = findTables(normal.from, {});
    normal.columns = tableize(normal.columns, tables);

    return normal;
};