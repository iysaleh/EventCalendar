const http = require('http');// open port
const hostname = '0.0.0.0'; //setting variables
const port = 3000;
const MongoClient = require('mongodb').MongoClient, assert=require('assert');
const url = 'mongodb://localhost:27017/EventCalendar';
const dbName = 'EventCalendar';
const Promise = require('promise');


const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World again\n');
});

/*function addEmployee (name,password) {
  MongoClient.connect(url, function(err, db){
    var employees = db.collection('employees');
    var query = {name:name}
    var empWithName = employees.find(query)
	console.log(empWithName);
	empWithName.then(function(results){
		empWithName = results.toArray();
		if (empWithName.length === 0){
          employees.insert({name:name,password:password,meetings:[]});
        }
	}).catch(function(a_err){
		console.log(a_err);
	});
	//console.log(empWithName);
    /*employees.find(query).toArray(function(err, result){
      if (err) {console.log(err);} 
      //else if (a_result.length === 0) { employees.insert({name:name,password,password,meetings:[]}); }
      //else {console.log("Employee already exists.");}
	  
	});
	db.close(); 
  });
}*/

function addEmployee (name,password) {
  MongoClient.connect(url, function(err, db){
    var employees = db.collection('employees');
    var query = {name:name};
    employees.find((query),(err,doc)=>{
      if (err) {
            employees.insert({name:name,password:password,meetings:[]});
	} else {
            console.log(doc);
        }
	db.close(); 
    });
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  addEmployee("test3","test3");
  addEmployee("test3","test3");
});
