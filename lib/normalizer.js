'use strict';

var normalizer = {};

function getType(value) {
    switch (value.type) {
        case 'column':
        case 'condition':
            return getType(value.value);
        case 'select':
            return 'subselect';
        case 'and':
        case 'or':
        case 'not':
            if (value.value && value.value.length === 1) {
                return getType(value.value[0]);
            }

    }
    return value.type && value.type.toLowerCase();
}

function getFields(value) {
    var fields = [];

    switch (value.type) {
        case 'column':
        case 'condition':
            return getFields(value.value);
        case 'and':
        case 'or':
        case 'not':
        case 'summand':
        case 'factor':
            if (value.value && value.value.length > 0) {
                return value.value.reduce(function (prev, curr) {
                    return prev.concat(getFields(curr));
                }, []);
            }
            break;
        case 'select':
            fields.push(normalize(value));
            break;
        case 'term':
            var nameParts = value.value && value.value.split('.');
            if (nameParts && nameParts.length > 1) {
                return {value: nameParts[nameParts.length - 1], tableAlias: nameParts[nameParts.length - 2]};
            }
            return {value: value.value};
        case 'number':
            return {value: value.value};
        case 'call':
            if (value.args.length > 0) {
                return value.args.reduce(function (prev, curr) {
                    return prev.concat(normalizeColumn(curr));
                }, []);
            }
    }

    return fields;
}

function getFunction(value) {
    switch (value.type) {
        case 'column':
        case 'condition':
            return getFunction(value.value);
        case 'and':
        case 'or':
        case 'not':
        case 'summand':
        case 'factor':
            if (value.value && value.value.length === 1) {
                return getFunction(value.value[0]);
            }
            return value.value;
        case 'call':
            return value.name;
    }

    return null;
}

function getAlias(value) {
    return value.alias;
}

function normalizeColumn(column) {
    var normalized = {
        type: getType(column)
    };

    if (normalized.type === 'call') {
        normalized = {
            type: normalized.type,
            func: getFunction(column),
            fields: getFields(column),
            alias: getAlias(column)
        };
    } else {
        normalized = {
            type: normalized.type,
            fields: getFields(column),
            alias: getAlias(column)
        };
    }

    return normalized;
}

function getTableType(table) {
    if (table.value.name.type && table.value.name.type === 'select') {
        return 'subselect';
    }
    return 'table';
}

function getTableName(table) {
    if (table.type && table.type === 'select') {
        return normalize(table);
    }
    return table;
}

function normalizeJoin(join) {
    var normalized = {
        type: join.modifier,
        table: join.value.name,
        alias: join.value.alias && join.value.alias.value,
        expr: join.expr
    };

    return normalized;
}

function normalizeFrom(table) {
    var normalized = {
        type: getTableType(table),
        table: table.value.name && getTableName(table.value.name),
        alias: table.value.alias && table.value.alias.value,
        join: table.join && table.join.map(normalizeJoin)
    };
    return normalized;
}

function normalizeGroup(group) {
    return normalizeColumn(group);
}

function normalizeSetOp(setOp) {
    var normalized = {
        type: setOp.type,
        all: setOp.all,
        select: setOp.select && normalize(setOp.select)
    };

    return normalized;
}

function normalize(queryObj) {
    return {
        type: queryObj.type,
        distinct: queryObj.distinct,
        columns: queryObj.columns && queryObj.columns.map(normalizeColumn),
        from: queryObj.from && queryObj.from.map(normalizeFrom),
        where: queryObj.where,
        group: queryObj.group && queryObj.group.map(normalizeGroup),
        having: queryObj.having,
        order: queryObj.order,
        setOp: queryObj.setOp && normalizeSetOp(queryObj.setOp)
    };
}

normalizer.normalize = normalize;

/**
 * Transforms a query object parsed by escuelle into a more normalized form.
 *
 * Newly parsed
 */
module.exports = normalizer;