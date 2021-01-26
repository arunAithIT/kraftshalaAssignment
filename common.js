let mysql = require('mysql');
let util = require('util');
let request = require('request');
const env = require('./env.json');


let node_env = process.env.NODE_ENV || 'production';

// configuration
let dbConn = mysql.createConnection({
    host: env[node_env].host,
    user: env[node_env].user,
    password: env[node_env].password,
    database: env[node_env].database
});

// connect to database
dbConn.connect();

let asyncConn = util.promisify(dbConn.query).bind(dbConn);
let asyncReqPost = util.promisify(request.post).bind(request);
let asyncReqGet = util.promisify(request.get).bind(request);

module.exports.dbConn = dbConn;
module.exports.asyncConn = asyncConn;