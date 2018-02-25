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

function addEmployee (name,password) {
	MongoClient.connect(url, function(err, db){
		var employees = db.collection('employees');
		var query = {name:name}
		employees.find(query).toArray().then(function(result){
			if (result.length === 0) {
				employees.insert({name:name,password:password,isAdmin:false,startHour:"07:00:00",endHour:"19:00:00",meetings:[]});
			}
			db.close()
		});
	});
}

function loginEmployee (name,password) {
		
}

function addRoom (roomNum,roomCapacity) {
		MongoClient.connect(url, function(err, db) {
			var room=db.collection('rooms');
			room.insert({roomNum:roomNum},{roomCapacity:roomCapacity});
		});
		db.close();
};

function addMeeting (ownerMeeting,startTime,endTime,roomNum,subject,description) {
		MongoClient.connect(url, function(err, db) {
			var meeting=db.collection('meetings');
			meeting.insert({ownerMeeting:ownerMeeting},{startTime:startTime},{endTime:endTime},{roomNum:roomNum},{subject:subject},{description:description});
		});
		dbclose();
};

function deleteRoom (roomNum) {
		MongoClient.connect(url, function(err, db) {
			var room=db.collection('rooms');
			room.remove({roomNum:roomNum},{roomCapacity:roomCapacity} );
		});
		db.close();
};

function deleteMeeting (ownerMeeting,startTime,endTime,roomNum,subject,description) {
		MongoClient.connect(url, function(err, db) {
			var meeting=db.collection('meetings');
			meeting.remove({ownerMeeting:ownerMeeting},{startTime:startTime},{endTime:endTime},{roomNum:roomNum},{subject:subject},{description:description});
		});
		db.close();
};

function roomCapacity (roomNum) {
		console.log('FINDING ROOM');
		MongoClient.connect(url, function(err, db) {
			var room=db.collection('rooms');
			room.find({roomNum:roomNum});
		});
		db.close();
}

var server = connect()
		.use(function (req, res, next) {
			var query;
			var url_parts = url.parse(req.url, true);
			query = url_parts.query;

			if (req.method == 'GET') {
				switch (url_parts.pathname) {
					case '/roomCapacity':
					// do something
					roomCapacity(2)
					res.end();
					break;
				}
			else if (req.method == 'POST') {
				switch (url_parts.pathname) {
					case '/somepath2':
					// do something
					res.end();
					break;
				}
			}}
		}).listen(port, hostname, () => {
			console.log(`Server running at http://${hostname}:${port}/`);
		});

/*
server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
	addEmployee("test3","test3",);
});*/