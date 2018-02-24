const http = require('http');// open port
const hostname = '0.0.0.0'; //setting variables
const port = 3000;
const MongoClient = require('mongodb').MongoClient, assert=require('assert');
const url = 'mongodb://localhost:27017/EventCalendar';
const dbName = 'EventCalendar';

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World again\n');
});

function addEmployee (name,password) {
  MongoClient.connect(url, function(err, db){
    var employees = db.collection('employees');
    var query = {name:name}
    db.collection('EventCalendar').find(query).toArray(function(a_err, a_result){
        if (a_err) employees.insert({name:name,password,password,meetings:[]});
        else {throw "Employee already exists."};
        db.close(); 
	});
  });
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  addEmployee("test3","test3");
  addEmployee("test3","test3");
});
