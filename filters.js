const filters = {
  fullTextSearch: {
    value: '',
    limit: 10,
  },
  advance: [
    {
      objectType: 'edge',
      property: 'label',
      dataType: 'text',
      condition: 'regex',
      value: 'shop',
      logicOperator: 'AND',
    },
    {
      objectType: 'vertex',
      property: 'label',
      dataType: 'text',
      condition: 'prefix',
      value: 'buys',
      logicOperator: 'OR',
    },
    {
      objectType: 'edge',
      property: 'name',
      dataType: 'string',
      condition: 'equals',
      value: 'poppy',
      logicOperator: 'AND',
    },
    {
      objectType: 'edge',
      property: 'age',
      dataType: 'number',
      condition: 'notEqualTo',
      value: '23',
      logicOperator: 'OR',
    },
    // {
    //   objectType: 'filter by vertex/edge',
    //   property: '',
    //   dataType: '',
    //   condition: '',
    //   value: '',
    //   logicOperator: '',
    // },
  ],
};

module.exports = filters;
