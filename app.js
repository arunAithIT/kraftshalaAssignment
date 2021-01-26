var express = require('express');
var port = process.env.PORT || 3200;

var bodyParser = require('body-parser');
var app = express(); 
var path    = require("path");
let common = require('./common');


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, authorization");
    next();
});

app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('html', require('ejs').renderFile);
app.use(require('./api.js'));

app.get('/', function(req, res) {

    return res.sendFile(path.join(__dirname+'/frontend/HTML/login.html'));
    return res.send({
        error: false,
        message: 'Hello Lead Manager API!!!'
    })
});

// default route
app.get('/login', function(req, res) {

    return res.render(path.join(__dirname+'/frontend/HTML/login.html'), {data:{}});
    });

app.get('/register', async function(req, res) {

    let query = `select * from subject_details where status=1; `
    let ress = await common.asyncConn(query);
    return res.render(path.join(__dirname+'/frontend/HTML/signup.html'), {data:{subject:ress}});
    });

// Listen on port 3000, IP defaults to 127.0.0.1
app.listen(port, () => {
    console.log('Server running at port: ' + port);
});
