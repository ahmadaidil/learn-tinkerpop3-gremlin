const app = require('express')();
const getGraphsByFilter = require('./controller');
const filters = require('./filters');

const port = process.env.PORT || '3000';

app.get('/', (req, res) => {
  getGraphsByFilter(filters).then(results => res.send(results)).catch(err => res.send(err));
});
app.listen(port, () => console.log(`listening on port ${port}`));
