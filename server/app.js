const http = require('http');// open port
const connect = require('connect')
const url = require('url');
const hostname = '0.0.0.0'; //setting variables
const port = 3000;
const MongoClient = require('mongodb').MongoClient, assert=require('assert');
const sUrl = 'mongodb://localhost:27017/EventCalendar';
const dbName = 'EventCalendar';
const Promise = require('promise');
const crypto = require('crypto');


/*const server = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.end('Hello World again\n');
});*/

function addEmployee (requesterUser,requesterToken,username,password,fname,mname,lname,isAdmin) {
	console.log(requesterUser);
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					var employees = db.collection('employees');
					var query = {username:username};
					employees.find(query).toArray().then(function(result){
						if (result.length === 0) {
							employees.insert({username:username,password:password,isAdmin:isAdmin,startHour:"07:00:00",endHour:"19:00:00",fname:fname,mname:mname,lname:lname,meetings:[],notifications:[]});
							resolve("USER_ADD_SUCCESS")
							db.close()
						}
						else{
							resolve("USERNAME_ALREADY_EXISTS");
							db.close()
						}
					});
				});
			}
		});
	});
}

function deleteEmployee (requesterUser,requesterToken,username) {
	console.log(requesterUser);
	console.log(requesterToken);
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	console.log("HELLOOOOO");
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			console.log(result);
			if (result.length===0){
				console.log("BAD CREDS");
				resolve("BAD_CREDENTIALS");
			}
			else{
				console.log("VERIFIED! TIME TO DELETE.")
				MongoClient.connect(sUrl, function(err, db){
					var employees = db.collection('employees');
					console.log('SENDING DELETE');
					employees.remove({username:username});
					resolve("USER_DELETE_SUCCESS");
					db.close();
				});
			}
		});
	});
}

function _verifyRequesterUserToken(requesterUser,requesterToken){
	return new Promise( function(resolve) {
		requesterToken = parseInt(requesterToken);
		MongoClient.connect(sUrl, function(err, db){
			db.collection('employees').find({username:requesterUser,sessionToken:requesterToken}).map(function(item){
				return {username:item.username,isAdmin:item.isAdmin};
			}).toArray().then(function(result){
				resolve(result[0]);
				db.close();
			});
		});
	});
}

function addEmployeeOld (username,password) {
	MongoClient.connect(sUrl, function(err, db){
		var employees = db.collection('employees');
		var query = {username:username}
		employees.find(query).toArray().then(function(result){
			if (result.length === 0) {
				employees.insert({username:username,password:password,isAdmin:false,startHour:"07:00:00",endHour:"19:00:00",meetings:[]});
			}
			db.close()
		});
	});
}

function getEmployeeList(requesterUser,requesterToken) {
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('employees').find().map(function(item){
						return item.username;
					}).toArray().then(function(result){
						resolve(result);
					});
				});				
			}
		});
	});
}

function login (username,password) {
	return new Promise( function(resolve) {
		MongoClient.connect(sUrl, function(err, db){
			db.collection('employees').find({username:username, password:password}).map(function(item){
				return {username:item.username, meetings:item.meetings, notifications:item.notifications, sessionToken:item.sessionToken,fName:item.fName, isAdmin:item.isAdmin};
			}).toArray().then(function(result){
				if (result.length===1){
					//Generate login Session token if not exist
					if (result[0].sessionToken===""){
						result[0].sessionToken = randU32Sync();
						addLoginSessionToken(result[0].username,result[0].sessionToken);
					}
				}
				resolve(result);
			});
		});
	});
}

function addLoginSessionToken(username,sessionToken) {
	MongoClient.connect(sUrl, function(err, db){
		var employees = db.collection('employees');
		var query = {username:username}
		employees.find(query).toArray().then(function(result){
			if (result.length === 1) {
				employees.update({username:username},{$set:{sessionToken:sessionToken}});
			}
			db.close()
		});
	});	
}

function addRoom (roomNum,roomCapacity) {
		MongoClient.connect(sUrl, function(err, db) {
			var room=db.collection('rooms');
			room.insert({roomNum:roomNum},{roomCapacity:roomCapacity});
						db.close();
		});
};

function addMeeting (ownerMeeting,startTime,endTime,roomNum,subject,description) {
		MongoClient.connect(sUrl, function(err, db) {
			var meeting=db.collection('meetings');
			meeting.insert({ownerMeeting:ownerMeeting},{startTime:startTime},{endTime:endTime},{roomNum:roomNum},{subject:subject},{description:description});
						db.close();
				});
};

function deleteRoom (roomNum) {
		MongoClient.connect(sUrl, function(err, db) {
			var room=db.collection('rooms');
			room.remove({roomNum:roomNum},{roomCapacity:roomCapacity} );
						db.close();
		});
};

function deleteMeeting (ownerMeeting,startTime,endTime,roomNum,subject,description) {
		MongoClient.connect(sUrl, function(err, db) {
			var meeting=db.collection('meetings');
			meeting.remove({ownerMeeting:ownerMeeting},{startTime:startTime},{endTime:endTime},{roomNum:roomNum},{subject:subject},{description:description});
						db.close();
				});
};

function roomCapacity (roomNum) {
		console.log('FINDING ROOM');
		MongoClient.connect(sUrl, function(err, db) {
			var room=db.collection('rooms');
			room.find({roomNum:roomNum});
						db.close();
		});
				return "63 people";
}

//Helper functions
function randU32Sync() {
  return crypto.randomBytes(4).readUInt32BE(0, true);
}

var server = connect()
		.use(function (req, res, next) {
			var query;
			var url_parts = url.parse(req.url, true);
			query = url_parts.query;
			console.log(query);

			if (req.method === 'GET') {
				switch (url_parts.pathname) {
					case '/login':
					loginResult = login(query.user,query.pass);
					Promise.all([loginResult]).then(function(result){
						res.body = JSON.stringify(result[0]);
						res.setHeader('Content-Type', 'application/json');
						res.end(res.body);
					});
					break;
					case '/roomCapacity':
					res.body = roomCapacity(2);
					res.setHeader('Content-Type', 'text/plain');
					res.end(res.body);
					console.log(query);
					break;
					case '/getEmployeeList':
					getEmployeeList(query.requesterUser,query.requesterToken).then(function(result){
						res.body = JSON.stringify(result);
						res.setHeader('Content-Type', 'application/json');
						res.end(res.body);
					});
					break;
				}
			} else if (req.method === 'POST') {
				switch (url_parts.pathname) {
					case '/addEmployee':
					addEmployeeResult = addEmployee(query.requesterUser,query.requesterToken,query.user,query.pass,query.fname,query.mname,query.lname,query.isAdmin)
					console.log("WHY ARE YOU STUCK");
					Promise.all([addEmployeeResult]).then(function(result){
						console.log("IN THE PROMISE");
						res.body = result[0];
						console.log(res.body);
						res.setHeader('Content-Type', 'text/plain');
						res.end(res.body);
					});
					break;
					case '/deleteEmployee':
					console.log(query);
					deleteEmployeeResult = deleteEmployee(query.requesterUser,query.requesterToken,query.username)
					
					Promise.all([deleteEmployeeResult]).then(function(result){
						console.log("RESULT: RESULT");
						res.body=result[0];
						console.log(res.body);
						res.setHeader('Content-Type', 'text/plain');
						res.end(res.body);
					});
					break;
				}
			} else {
				console.log('NOT GET OR POST');
			}
		}).listen(port, hostname, () => {
			console.log(`Server running at http://${hostname}:${port}/`);
		});

/*
server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
	addEmployee("test3","test3",);
});*/