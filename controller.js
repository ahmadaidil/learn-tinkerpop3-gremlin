const client = require('./client');

const getQueryOfConditionFromType = (type, condition) => {
  switch (type) {
    case 'text': {
      const textContains = 'textContains';
      switch (condition) {
        case 'prefix': return `${textContains}Prefix`;
        case 'fuzzy': return `${textContains}Fuzzy`;
        case 'regex': return `${textContains}Regex`;
        default: return textContains;
      }
    }
    case 'string': {
      switch (condition) {
        case 'prefix': return 'textPrefix';
        case 'fuzzy': return 'textFuzzy';
        case 'regex': return 'regex';
        default: return 'eq';
      }
    }
    default: {
      switch (condition) {
        case 'notEqualTo': return 'neq';
        case 'lowerThan': return 'lt';
        case 'lowerThanEqual': return 'lte';
        case 'greaterThan': return 'gt';
        case 'greaterThanEqual': return 'gte';
        default: return 'eq';
      }
    }
  }
};

const getLogicOperator = (prevFilter, nextFilter, logicOperator) => {
  if (nextFilter !== undefined) {
    let operator = '';
    if (logicOperator === 'OR') {
      operator += '.or()';
    } else operator += '.and()';
    if (prevFilter.objectType === 'vertex' && nextFilter.objectType === 'edge') {
      operator += '.bothE()';
    }
    if (prevFilter.objectType === 'edge' && nextFilter.objectType === 'vertex') {
      operator += '.otherV()';
    }
    return operator;
  }
  return '';
};

const getGraphsByFilter = (filters, dataSourceIds = ['12', '34', '56'], vertexId = 'all-000', limit=50) => {
  return new Promise ((resolve, reject) => {
    const newClient = client();
    const limitQuery = `limit(${limit})`;
    let getVertex = `g.V().${limitQuery}`;
    if (vertexId !== 'all-000') {
      getVertex = `g.V(${vertexId}).${limitQuery}`;
    }
    if (dataSourceIds.length) {
      getVertex += `.has('_data_source_id', within('${dataSourceIds.join("', '")}'))`;
    }
    const { fullTextSearch, advance } = filters;
    if (advance.length) {
      advance.forEach(({
        objectType, property, condition, value, logicOperator, dataType,
      }, index) => {
        const conditionQuery = getQueryOfConditionFromType(dataType, condition);
        const hasQueryString = `.has('${property}', ${conditionQuery}('${value}'))`;
        const hasQueryNumberOrDate = `.has('${property}', ${conditionQuery}(${value}))`;
        if (index === 0 && objectType === 'edge') {
          getVertex += '.bothE()';
        }
        getVertex += dataType === 'text' || dataType === 'string' ? hasQueryString : hasQueryNumberOrDate;
        getVertex += getLogicOperator(advance[index], advance[index + 1], logicOperator);
      });
    }
    console.log(getVertex);
    newClient.execute('g.V().count()', (err, results) => {
      if (err) {
        reject(err);
      } resolve(results);
    });
  });
};

module.exports = getGraphsByFilter;
