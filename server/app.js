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
var express = require('express');
var app = express();
const bodyParser = require('body-parser');


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

function addRoom (requesterUser,requesterToken,roomNumber,roomCapacity) {
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					var rooms = db.collection('rooms');
					var query = {roomNumber:roomNumber};
					rooms.find(query).toArray().then(function(result){
						console.log("RESULT:");
						console.log(result);
						if (result.length === 0) {
							rooms.insert({roomNumber:roomNumber,roomCapacity:roomCapacity,meetings:[]});
							resolve("ROOM_ADD_SUCCESS")
							db.close()
						}
						else{
							resolve("ROOM_ALREADY_EXISTS");
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

function deleteRoom (requesterUser,requesterToken,roomNumber) {
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					var rooms = db.collection('rooms');
					rooms.remove({roomNumber:roomNumber});
					resolve("ROOM_DELETE_SUCCESS");
					db.close();
				});
			}
		});
	});
}

function verifyMeeting(requesterUser,requesterToken,meetingTitle,meetingDesc,meetingEmployees,room,startTime,endTime){
	return new Promise( function(resolve) {
		resolve("MEETING VERIFIED");
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

function getRoomsList(requesterUser,requesterToken) {
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('rooms').find().map(function(item){
						return item.roomNumber;
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

function logger(req,res,next){
  console.log(new Date(), req.method, req.url, req.query, req.body);
  next();
}

var app = express();
var rootRouter = express.Router();
app.use(bodyParser.urlencoded({ extended: true }));
rootRouter.use(logger);

rootRouter.get('/login',function(req,res,next){
	login(req.query.user,req.query.pass).then(function(result){
		res.json(result[0]);
		res.end();
	});
});

rootRouter.get('/getEmployeeList',function(req,res,next){
	getEmployeeList(req.query.requesterUser,req.query.requesterToken).then(function(result){
		res.json(result);
		res.end();
	});
});

rootRouter.get('/getRoomsList',function(req,res,next){
	getRoomsList(req.query.requesterUser,req.query.requesterToken).then(function(result){
		res.json(result);
		res.end();
	});
});

rootRouter.post('/addEmployee',function(req,res,next){
	addEmployee(req.body.requesterUser,req.body.requesterToken,req.body.user,req.body.pass,req.body.fname,req.body.mname,req.body.lname,req.body.isAdmin).then(function(result){
		res.json(result);
		res.end();
	});
});

rootRouter.post('/addRoom',function(req,res,next){
	console.log(req.query);
	addRoom(req.body.requesterUser,req.body.requesterToken,req.body.roomNumber,req.body.roomCapacity).then(function(result){
		res.json(result);
		res.end();
	});
});

rootRouter.post('/deleteEmployee',function(req,res,next){
	deleteEmployee(req.body.requesterUser,req.body.requesterToken,req.body.username).then(function(result){
		res.json(result);
		res.end();
	});
});

rootRouter.post('/deleteRoom',function(req,res,next){
	deleteRoom(req.body.requesterUser,req.body.requesterToken,req.body.roomNumber).then(function(result){
		res.json(result);
		res.end();
	});
});

rootRouter.post('/verifyMeeting',function(req,res,next){
	verifyMeeting(req.body.requesterUser,req.body.requesterToken,req.body.meetingTitle,req.body.meetingDesc,req.body.meetingEmployees,req.body.room,req.body.startTime,req.body.endTime).then(function(result){
		res.json(result);
		res.end();
	});
});

app.use('/',rootRouter);
app.listen(3000);
console.log("Server Started on port 3000.");

