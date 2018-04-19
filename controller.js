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

const getOrCollections = (filters) => {
  const orCollections = [];
  let andCollections = [];
  filters.forEach((filter, index) => {
    if (index !== filters.length - 1) {
      if (filter.logicOperator === 'AND') {
        andCollections.push(filter);
      } else if (filter.logicOperator === 'OR') {
        if (filters[index - 1] !== undefined && filters[index - 1].logicOperator === 'AND') {
          andCollections.push(filter);
          orCollections.push(andCollections);
        } else {
          if (andCollections.length) {
            orCollections.push(andCollections);
          }
          orCollections.push(filter);
        }
        andCollections = [];
      }
    } else if (index === filters.length - 1) {
      if (filters[index - 1].logicOperator === 'AND') {
        andCollections.push(filter);
        orCollections.push(andCollections);
      } else orCollections.push(filter);
    }
  });
  return orCollections;
};

const getQueries = ({
  objectType, dataType, condition, property, value,
}, isVertex) => {
  const conditionQuery = getQueryOfConditionFromType(dataType, condition);
  const hasQueryTextOrString = `has('${property}', ${conditionQuery}('${value}'))`;
  const hasQueryNumberOrDate = `has('${property}', ${conditionQuery}(${value}))`;
  let query = '';
  if (isVertex && objectType === 'edge') query += 'bothE().';
  if (!isVertex && objectType === 'vertex') query += 'bothV().';
  query += dataType === 'text' || dataType === 'string' ? hasQueryTextOrString : hasQueryNumberOrDate;
  return query;
};

const getGraphsByFilter = (filters, dataSourceIds = ['12', '34', '56'], vertexId = 'all-000', limit = 50) => (
  new Promise((resolve, reject) => {
    const newClient = client();
    const { fullTextSearch, advance } = filters;
    const limitQuery = `.limit(${limit})`;
    let getGraphQuery = 'g.V()';
    let isVertex = true;
    let query = '';
    if (vertexId === 'all-000') {
      if (advance[0].objectType === 'edge') {
        getGraphQuery = 'g.E()';
        isVertex = false;
      }
    } else getGraphQuery = `g.V(${vertexId})`;
    if (limit) getGraphQuery += limitQuery;
    if (dataSourceIds.length) query += `.has('_data_source_id', within('${dataSourceIds.join("', '")}'))`;
    if (advance.length) {
      if (advance.findIndex(({ logicOperator }) => logicOperator === 'OR') >= 0) {
        const orCollections = getOrCollections(advance);
        // console.log(orCollections);
        query += '.or(';
        orCollections.forEach((collection, index) => {
          if (collection instanceof Array) {
            if (index > 0) query += ', ';
            let andQuery = 'and(';
            collection.forEach((filter, idx) => {
              if (idx > 0) andQuery += ', ';
              andQuery += getQueries(filter, isVertex);
            });
            andQuery += ')';
            query += andQuery;
          } else if (collection instanceof Object) {
            if (index > 0) query += ', ';
            query += getQueries(collection, isVertex);
          }
        });
        query += ')';
      } else {
        query += '.and(';
        advance.forEach((filter, index) => {
          if (index > 0) query += ', ';
          query += getQueries(filter, isVertex);
        });
        query += ')';
      }
    }
    console.log(getGraphQuery + query);
    newClient.execute('g.V().count()', (err, results) => {
      if (err) {
        reject(err);
      } resolve(results);
    });
  })
);

module.exports = getGraphsByFilter;
