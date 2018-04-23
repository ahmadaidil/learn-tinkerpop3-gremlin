const filters = {
  fullTextSearch: {
    value: 'Crow, the',
    limit: 10,
  },
  advanced: [
    // {
    //   objectType: 'edge',
    //   property: '_label',
    //   dataType: 'text',
    //   condition: 'contains',
    //   value: 'buys',
    //   logicOperator: 'OR',
    // },
    // {
    //   objectType: 'edge',
    //   property: '_label',
    //   dataType: 'text',
    //   condition: 'contains',
    //   value: 'knows',
    //   logicOperator: 'AND',
    // },
  ],
};

module.exports = filters;
