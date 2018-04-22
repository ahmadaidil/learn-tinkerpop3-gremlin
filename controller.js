/* eslint no-console: 0 */

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
        case 'regex': return 'textRegex';
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
          } orCollections.push(filter);
        } andCollections = [];
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

const getAndQuery = (filterAnd, isVertex) => {
  let query = 'and(';
  filterAnd.forEach((and, index) => {
    if (index > 0) query += ', ';
    query += getQueries(and, isVertex);
  });
  query += ')';
  return query;
};

const queryExecutor = (graph, query) => (
  new Promise((resolve, reject) => {
    const newClient = client();
    console.log('masuk sini', graph + query);
    newClient.execute(graph + query, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  })
);

const getGraphData = (graph, query) => (
  new Promise(async (resolve, reject) => {
    const data = { vertices: [], edges: [] };
    try {
      if (graph.graphTypeQuery) {
        const result = await queryExecutor(graph.graphTypeQuery, query);
        data[graph.isVertex ? 'vertices' : 'edges'] = result;
      } else {
        const verticesResult = await queryExecutor('g.V()', query);
        const edgesResult = await queryExecutor('g.E()', query);
        data.vertices = verticesResult;
        data.edges = edgesResult;
      }
      resolve(data);
    } catch (err) {
      reject(err);
    }
  })
);

const getGraphByFilter = (filters, dataSourceIds = [], vertexId = 'all-000', limit = 10) => (
  new Promise((resolve, reject) => {
    const { fullTextSearch: { value: fValue, limit: fLimit }, advanced } = filters;
    let graphTypeQuery = 'g.V()';
    let isVertex = true;
    let query = '';
    if (vertexId === 'all-000') {
      if (advanced.length && advanced[0].objectType === 'edge') {
        graphTypeQuery = 'g.E()';
        isVertex = false;
      }
    } else graphTypeQuery = `g.V(${vertexId})`;
    if (dataSourceIds.length) query += `.has('_data_source_id', within('${dataSourceIds.join("', '")}'))`;
    if (advanced.length) {
      if (advanced.length > 1) {
        if (advanced.findIndex(({ logicOperator }) => logicOperator === 'OR') >= 0) {
          const orCollections = getOrCollections(advanced);
          query += '.or(';
          orCollections.forEach((collection, index) => {
            if (collection instanceof Array) {
              if (index > 0) query += ', ';
              query += getAndQuery(collection, isVertex);
            } else if (collection instanceof Object) {
              if (index > 0) query += ', ';
              query += getQueries(collection, isVertex);
            }
          });
          query += ')';
        } else query += `.${getAndQuery(advanced, isVertex)}`;
      } else query = `.${getQueries(advanced[0], isVertex)}`;
      if (limit) query += `.limit(${limit})`;
    }
    if (fValue) {
      query += `.where(properties().hasValue('${fValue}'))`;
      if (fLimit) query += `.limit(${fLimit})`;
      if (vertexId === 'all-000' && !advanced.length) graphTypeQuery = '';
    }
    const graph = graphTypeQuery ? ({ graphTypeQuery, isVertex }) : ({ graphTypeQuery });
    query += '.valueMap(true)';
    getGraphData(graph, query)
      .then(response => resolve(response))
      .catch(err => reject(err));
  })
);

module.exports = getGraphByFilter;
