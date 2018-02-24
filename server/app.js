const http = require('http');// open port
const hostname = '0.0.0.0'; //setting variables
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World again\n');
});

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/EventCalendar';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");

  db.close();
});

function addEmployee (name,password) {
  MongoClient.connect(url, function(err, db) {
    var employees= db.collection('employees');
    employees.insert({name:name},{password:password},{meetings:[]});
    db.close(); 
  }
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  addEmployee("test","test");
});
