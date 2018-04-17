require('dotenv').config();

const gremlinConfig = {
  host: process.env.GREMLIN_HOST,
  port: process.env.GREMLIN_PORT,
  user: process.env.GREMLIN_USER,
  password: process.env.GREMLIN_PASSWORD,
};

module.exports = gremlinConfig;
