var fs = require('fs')
var path = require('path')
var express = require('express')
var mysql = require('mysql');
var app = express()

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'tusstar',
    password: 'TusstarDB@123',
    port: '3306',
    database: 'TusstarDB'
});
connection.connect();

app.use('/', express.static(__dirname))
app.get('/api',function(req,res){
    res.writeHead(200, { "Content-Type": "application/json;charset=utf-8" })
    if(req.query.type == "getInfo")
    {
        if(req.query.id == null || req.query.id == "")
        {
            connection.query('SELECT * FROM testTable', function (error, results, fields) {
                if (error) throw error;
                res.end(JSON.stringify(results))
            });
        }
        else
        {
            connection.query("SELECT * FROM testTable where id='"+ req.query.id +"'", function (error, results, fields) {
                if (error) throw error;
                res.end(JSON.stringify(results))
            });
        }
    }
})

var server = app.listen(1088, "0.0.0.0", function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Server Listening on " + host + ":" + port + '.')
})