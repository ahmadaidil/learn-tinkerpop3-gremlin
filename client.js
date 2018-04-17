const gremlin = require('gremlin');
const gremlinConfig = require('./gremlin-config');

const client = () => {
  const newClient = gremlin.createClient(gremlinConfig.port, gremlinConfig.host, {
    session: false,
    user: gremlinConfig.user,
    password: gremlinConfig.password,
  });
  return newClient;
};

module.exports = client;
