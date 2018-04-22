/* eslint no-console: 0 */

const app = require('express')();
const getGraphByFilter = require('./controller');
const filters = require('./filters');

const port = process.env.PORT || '3000';

app.get('/', (req, res) => {
  getGraphByFilter(filters).then(results => res.send(results)).catch(err => res.json({ err }));
});
app.listen(port, () => console.log(`listening on port ${port}`));
