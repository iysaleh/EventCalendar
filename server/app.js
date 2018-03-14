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
const moment = require('moment');

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
							employees.insert({username:username,password:password,isAdmin:isAdmin,scheduleBegin:"07:00:00",scheduleEnd:"19:00:00",scheduleIsVisible:true,fName:fname,mName:mname,lName:lname,sessionToken:"",meetings:[],notifications:[]});
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
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					var employees = db.collection('employees');
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
function updateProfile (requesterUser,requesterToken,password,fname,mname,lname,startHours,endHours,isVisible) {
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					var employees = db.collection('employees');
					employees.update({username:requesterUser},{$set:{password:password,fName:fname,mName:mname,lName:lname,scheduleBegin:startHours,scheduleEnd:endHours,scheduleIsVisible:isVisible}}).then(function(){
						resolve({errorMessage:"",successMessage:"USER_PROFILE_UPDATED"});
						db.close();
					});
				});
			}
		});
	});
}

function deleteMeeting (requesterUser,requesterToken,roomNumber,key,title,owner,meetingEmployees) {
	return new Promise( function(resolve) {
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				console.log("IN HERE");
				MongoClient.connect(sUrl, function(err, db){
					updatePromises = [];
					updatePromises.push(db.collection('employees').update({roomNumber:roomNumber},{$pull: { 'meetings': {key:key, title:title}}},{multi: true}));
					var notificationOfDeletion = {
						title:title,
						key:key,
						message:requesterUser + " has terminated your scheduled meeting: "+ title +"!",
						type:"acknowledge",
						creationTime:moment().format('YYYY/MM/DD HH:mm').toString(),
						sender:requesterUser};
					var notificationOfDeletionSelf = {
						title:title,
						key:key,
						message:"You have terminated your meeting: "+ title +"!",
						type:"acknowledge",
						creationTime:moment().format('YYYY/MM/DD HH:mm').toString(),
						sender:requesterUser};
					if (requesterUser === owner){ //if Meeting Owner, delete meeting for everyone!
						for (let i = 0; i < meetingEmployees.length;i++){
							updatePromises.push(db.collection('employees').update({username:meetingEmployees[i]},{$pull: { 'meetings': {key:key, title:title}}},{multi: true}));
							updatePromises.push(db.collection('employees').update({username:meetingEmployees[i]},{$addToSet:{notifications:notificationOfDeletion}}));
						}
					}
					else{ //only delete meeting for current employee
						updatePromises.push(db.collection('employees').update({username:requesterUser},{$pull: { 'meetings': {key:key, title:title}}},{multi: true}));
						updatePromises.push(db.collection('employees').update({username:requesterUser},{$addToSet:{notifications:notificationOfDeletionSelf}}));
					}
					Promise.all(updatePromises).then(function(result){
						resolve({errorMessage:"",successMessage:"MEETING_SUCCESSFULLY_DELETED"});
						db.close();
					});
				});
			}
		});
	});
}

function acknowledgeNotification(requesterUser,requesterToken,key,title,sender){
	return new Promise( function(resolve) {
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('employees').update({username:requesterUser},{$pull: { 'notifications': {key:key, title:title,sender:sender}}},{multi: true}).then(function(result){
						resolve({errorMessage:"",successMessage:"NOTIFICATION_SUCCESSFULLY_ACKNOWLEDGED"});
						db.close();
					});
				});
			}
		});
	});	
}

function ignoreMeetingNotification(requesterUser,requesterToken,key,title,sender){
	return new Promise( function(resolve) {
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('employees').update({username:requesterUser},{$pull: { 'notifications': {key:key, title:title,sender:sender}}},{multi: true}).then(function(result){
						resolve({errorMessage:"",successMessage:"NOTIFICATION_SUCCESSFULLY_IGNORED"});
						db.close();
					});
				});
			}
		});
	});	
}


function declineMeetingNotification(requesterUser,requesterToken,key,title,sender){
	return new Promise( function(resolve) {
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('employees').update({username:requesterUser},{$pull: { 'notifications': {key:key, title:title,sender:sender}}},{multi: true}).then(function(result){
						var notificationCreationTime = moment();
						var notificationForOwner = {
							title:title,
							key:key,
							message:requesterUser + " has declined your meeting!.",
							type:"acknowledge",
							creationTime:notificationCreationTime.format('YYYY/MM/DD HH:mm').toString(),
							sender:requesterUser};
						db.collection('employees').update({username:sender},{$addToSet:{notifications:notificationForOwner}}).then(function(result){
							resolve({errorMessage:"",successMessage:"MEETING_SUCCESSFULLY_DECLINED"});
							db.close();
						});;
					});
				});
			}
		});
	});	
}

function acceptMeetingNotification(requesterUser,requesterToken,key,title,sender){
	return new Promise( function(resolve) {
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('employees').update({username:requesterUser},{$pull: { 'notifications': {key:key, title:title,sender:sender}}},{multi: true}).then(function(result){
						var notificationCreationTime = moment();
						var notificationForOwner = {
							title:title,
							key:key,
							message:requesterUser + " has accepted your meeting!.",
							type:"acknowledge",
							creationTime:notificationCreationTime.format('YYYY/MM/DD HH:mm').toString(),
							sender:requesterUser};
						db.collection('employees').update({username:sender},{$addToSet:{notifications:notificationForOwner}}).then(function(result){
							resolve({errorMessage:"",successMessage:"MEETING_SUCCESSFULLY_ACCEPTED"});
							db.close();
						});;
					});
				});
			}
		});
	});	
}

function verifyMeeting(requesterUser,requesterToken,meetingTitle,meetingDesc,meetingEmployees,roomNumber,meetingStartTime,meetingEndTime){
	return new Promise( function(resolve) {
		meetingStartHour = moment(meetingStartTime.slice(-5),'HH:mm');
		meetingEndHour = moment(meetingEndTime.slice(-5),'HH:mm');
		meetingStartTime = moment(meetingStartTime,'YYYY/MM/DD HH:mm');
		meetingEndTime = moment(meetingEndTime,'YYYY/MM/DD HH:mm');
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(verResult){
			if (verResult.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				var arrayOfMeetingArrays = [];
				//Get meetings for room
				arrayOfMeetingArrays.push(_getMeetingsForRoom(roomNumber));
				//Get all meeting arrays for all invited users
				for (let i = 0; i < meetingEmployees.length; i++){
					arrayOfMeetingArrays.push(_getMeetingsForEmployee(meetingEmployees[i]));
				}
				Promise.all(arrayOfMeetingArrays).then(function(result){
					var arrayOfViolations = []
					//For each user's meeting array
					for (let i = 0; i < result.length;i++){
						//For each meeting
						var meetingObj = result[i].meetings;
						if (i === 0){ //Room Verification logic
							for (let y = 0; y < meetingObj.length;y++){
								var roomMeetingStart = moment(meetingObj[y].start,'YYYY/MM/DD HH:mm');
								var roomMeetingEnd = moment(meetingObj[y].end,'YYYY/MM/DD HH:mm');
								if (_meetingsHaveConflict(meetingStartTime,meetingEndTime,roomMeetingStart,roomMeetingEnd)){
									resolve('ROOM_MEETING_CONFLICT');
								}
							}
						}
						else{ //Employee Meeting Verification Logic
							//Check employee working hours conflict
							empScheduleStart = moment(result[i].scheduleBegin,'HH:mm');
							empScheduleEnd = moment(result[i].scheduleEnd,'HH:mm');
							if (meetingStartHour.valueOf() < empScheduleStart.valueOf() || meetingEndHour.valueOf() > empScheduleEnd.valueOf()){
								arrayOfViolations.push(result[i].username);
								continue;
							}
							//Check employee meeting conflicts
							for (let y = 0; y < meetingObj.length;y++){
								var empMeetingStart = moment(meetingObj[y].start,'YYYY/MM/DD HH:mm');
								var empMeetingEnd = moment(meetingObj[y].end,'YYYY/MM/DD HH:mm');
								if (_meetingsHaveConflict(meetingStartTime,meetingEndTime,empMeetingStart,empMeetingEnd)){
									arrayOfViolations.push(result[i].username);
									break;
								}
							}
						}
					}
					//Log violations if any or return success message.
					if (arrayOfViolations.length===0){
						resolve("NO_MEETING_CONFLICTS");
					}
					else{
						resolve("MEETING_CONFLICTS_WITH:"+arrayOfViolations.join());
					}
				});
			}
		});
	});
}

function createMeeting(requesterUser,requesterToken,meetingTitle,meetingDesc,meetingEmployees,roomNumber,meetingStartTime,meetingEndTime){
	return new Promise( function(resolve) {
		meetingStartTime = moment(meetingStartTime,'YYYY/MM/DD HH:mm');
		meetingEndTime = moment(meetingEndTime,'YYYY/MM/DD HH:mm');
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(verResult){
			if (verResult.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				Promise.all([_getMeetingsForRoom(roomNumber)]).then(function(result){
					var meetingObj = result[0].meetings;
					roomConflict = false;
					for (let y = 0; y < meetingObj.length;y++){
						var roomMeetingStart = moment(meetingObj[y].start,'YYYY/MM/DD HH:mm');
						var roomMeetingEnd = moment(meetingObj[y].end,'YYYY/MM/DD HH:mm');
						if (_meetingsHaveConflict(meetingStartTime,meetingEndTime,roomMeetingStart,roomMeetingEnd)){
							resolve({errorMessage:'ROOM_MEETING_CONFLICT'});
							roomConflict = true;
							break;
						}
					}
					if (!roomConflict){//only add meetings if no room conflicts.
						var meetingKey = randU32Sync().toString();
						var meetingCreationTime = moment();
						var meetingForRoom = {start:meetingStartTime.format('YYYY/MM/DD HH:mm').toString(),
										end:meetingEndTime.format('YYYY/MM/DD HH:mm').toString(),
										creationTime:meetingCreationTime.format('YYYY/MM/DD HH:mm').toString(),
										owner:requesterUser,
										key:meetingKey,
										title:meetingTitle,
										description:meetingDesc,
										roomNumber:roomNumber,
										meetingEmployees:meetingEmployees,
										status:"accepted",
										color:"green"};
						var meetingForOwner = {start:meetingStartTime.format('YYYY/MM/DD HH:mm').toString(),
										end:meetingEndTime.format('YYYY/MM/DD HH:mm').toString(),
										creationTime:meetingCreationTime.format('YYYY/MM/DD HH:mm').toString(),
										owner:requesterUser,
										key:meetingKey,
										title:meetingTitle,
										description:meetingDesc,
										roomNumber:roomNumber,
										meetingEmployees:meetingEmployees,
										status:"accepted",
										color:"green"};
						var meetingForInvitee = {start:meetingStartTime.format('YYYY/MM/DD HH:mm').toString(),
										end:meetingEndTime.format('YYYY/MM/DD HH:mm').toString(),
										creationTime:meetingCreationTime.format('YYYY/MM/DD HH:mm').toString(),
										owner:requesterUser,
										key:meetingKey,
										title:meetingTitle,
										description:meetingDesc,
										roomNumber:roomNumber,
										meetingEmployees:meetingEmployees,
										status:"pending",
										color:"yellow"};
						var notificationOwner = {creationTime:meetingCreationTime,
										title:meetingTitle,
										key:meetingKey,
										message:"Meeting successfully created from " + meetingStartTime.format('YYYY/MM/DD HH:mm').toString() + " to " + meetingEndTime.format('YYYY/MM/DD HH:mm').toString() + " in room #" + roomNumber.toString() + ".",
										type:"acknowledge",
										creationTime:meetingCreationTime.format('YYYY/MM/DD HH:mm').toString(),
										sender:requesterUser};
						var notificationInvitee = {creationTime:meetingCreationTime,
										title:meetingTitle,
										key:meetingKey,
										description:meetingDesc,
										message:"You have been invited to a new meeting from " + meetingStartTime.format('YYYY/MM/DD HH:mm').toString() + " to " + meetingEndTime.format('YYYY/MM/DD HH:mm').toString() + " in room #" + roomNumber.toString() + ". How do you wish to respond?",
										type:"respond",
										creationTime:meetingCreationTime.format('YYYY/MM/DD HH:mm').toString(),
										sender:requesterUser};
						MongoClient.connect(sUrl, function(err, db){
							//Add meeting to room meetings
							db.collection('rooms').update({roomNumber:roomNumber},{$addToSet:{meetings:meetingForRoom}});
							//Add meeting to employee meetings
							for (let i = 0; i < meetingEmployees.length;i++){
								if (requesterUser === meetingEmployees[i]){//meetingOwner
									db.collection('employees').update({username:meetingEmployees[i]},{$addToSet:{meetings:meetingForOwner}});
									db.collection('employees').update({username:meetingEmployees[i]},{$addToSet:{notifications:notificationOwner}});
								}
								else{//normal meeting invitee
									db.collection('employees').update({username:meetingEmployees[i]},{$addToSet:{meetings:meetingForInvitee}});
									db.collection('employees').update({username:meetingEmployees[i]},{$addToSet:{notifications:notificationInvitee}});
								}
							}
							resolve({errorMessage:"",successMessage:"MEETING_SUCCESSFULLY_CREATED"});
						});
					}
				});
			}
		});
	});
}

function suggestMeeting(requesterUser,requesterToken,meetingTitle,meetingDesc,meetingDuration,meetingEmployees){
	return new Promise( function(resolve) {
		//Begin searching for meeting times 1 day from now:
		meetingSearchBeginTime = moment('00:00','HH:mm').add(1, 'days');
		meetingSearchEndTime = moment(meetingDuration, 'HH:mm').add(1, 'days');
		meetingStartHour = moment('00:00','HH:mm');
		meetingEndHour =  moment(meetingDuration, 'HH:mm');
		//Max time frame we are willing to search for is 2 weeks from now
		meetingSearchEndRange = moment('00:00','HH:mm').add(14, 'days');
		Promise.all([_verifyRequesterUserToken(requesterUser,requesterToken)]).then(function(verResult){
			if (verResult.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				getRoomsList(requesterUser,requesterToken).then(function(meetingRooms){
					var arrayOfMeetingArrays = [];
					//Get meetings for rooms
					numberOfRooms = meetingRooms.length
					for (let i = 0; i < meetingRooms.length; i++){
						arrayOfMeetingArrays.push(_getMeetingsForRoom(meetingRooms[i]));
					}
					//Get all meeting arrays for all invited users
					for (let i = 0; i < meetingEmployees.length; i++){
						arrayOfMeetingArrays.push(_getMeetingsForEmployee(meetingEmployees[i]));
					}
					Promise.all(arrayOfMeetingArrays).then(function(result){
						//Search for a suitable meeting time until we reach the end range of the search
						var suitableMeetingFound = false;
						while (meetingSearchEndTime.valueOf() < meetingSearchEndRange.valueOf()){
							//console.log(meetingSearchEndTime);
							var suitableMeetingRooms = [];
							//For each user's meeting array
							for (let i = 0; i < result.length;i++){
								//For each meeting
								var meetingObj = result[i].meetings;
								//console.log(meetingObj);
								if (i < numberOfRooms){ //Room Verification logic
									if (meetingObj.length===0){//specialCase where room has no meetings so it's available already!
										suitableMeetingRooms.push(result[i].roomNumber);
										i = numberOfRooms-1;
									}
									var roomMeetingConflictDetected = false;
									for (let y = 0; y < meetingObj.length;y++){ 
										var roomMeetingStart = moment(meetingObj[y].start,'YYYY/MM/DD HH:mm');
										var roomMeetingEnd = moment(meetingObj[y].end,'YYYY/MM/DD HH:mm');
										if (_meetingsHaveConflict(meetingSearchBeginTime,meetingSearchEndTime,roomMeetingStart,roomMeetingEnd)){
											//Room meeting conflict detected. Break!
											roomMeetingConflictDetected=true;
											break;
										}
									}
									if (!roomMeetingConflictDetected){
										suitableMeetingRooms.push(result[i].roomNumber);
										i = numberOfRooms-1;
									}
								}
								else{ //Employee Meeting Verification Logic
									if (suitableMeetingRooms.length === 0){
										//no suitable meeting rooms for this meeting time, break!
										break;
									}
									//Check employee working hours conflict
									meetingStartHour = moment(meetingSearchBeginTime.format('HH:mm').toString(),'HH:mm');
									meetingEndHour = moment(meetingSearchEndTime.format('HH:mm').toString(),'HH:mm');
									empScheduleStart = moment(result[i].scheduleBegin,'HH:mm');
									empScheduleEnd = moment(result[i].scheduleEnd,'HH:mm');
									if (meetingStartHour.valueOf() < empScheduleStart.valueOf() || meetingEndHour.valueOf() > empScheduleEnd.valueOf()){
										//Employee Conflict! break!
										break;
									}
									//Check employee meeting conflicts
									var empConflict = false;
									for (let y = 0; y < meetingObj.length;y++){
										var empMeetingStart = moment(meetingObj[y].start,'YYYY/MM/DD HH:mm');
										var empMeetingEnd = moment(meetingObj[y].end,'YYYY/MM/DD HH:mm');
										if (_meetingsHaveConflict(meetingSearchBeginTime,meetingSearchEndTime,empMeetingStart,empMeetingEnd)){
											//Employee Conflict! break!
											empConflict = true;
											break;
										}
									}
									if (empConflict){
										break;
									}
									if (i===(result.length-1)){
										//suitableMeetingFound
										suitableMeetingFound=true;
										resolve({roomNumber:suitableMeetingRooms[0],startTime:meetingSearchBeginTime.format('YYYY/MM/DD HH:mm'),endTime:meetingSearchEndTime.format('YYYY/MM/DD HH:mm'),errorMessage:""});
										break;
									}
								}
								if(suitableMeetingFound){
									break;
								}
							}
							if(suitableMeetingFound){
								break;
							}
							//No suitable meeting found so far...Check 15 minutes later!
							meetingSearchBeginTime = meetingSearchBeginTime.add(15,'minutes');
							meetingSearchEndTime = meetingSearchEndTime.add(15,'minutes');
						}
						if(!suitableMeetingFound){
							resolve({errorMessage:"No Conflict Free Meetings Found Within the Next 2 Weeks!"});
						}
					});
				});
			}
		});
	});
}

function _meetingsHaveConflict(meetingAStart,meetingAEnd,meetingBStart,meetingBEnd){
	//Input variables are moments.
	if((meetingAStart.valueOf()<meetingBStart.valueOf()&&meetingAEnd.valueOf()>meetingBStart.valueOf()) ||(meetingAStart.valueOf()<meetingBEnd.valueOf()&&meetingAEnd.valueOf()>meetingBStart.valueOf())||(meetingAStart.valueOf()===meetingBStart.valueOf()&&meetingAEnd.valueOf()===meetingBEnd.valueOf())){
		return true;
	}
	else{
		return false;
	}
}

function getMeetingsForEmployee(requesterUser,requesterToken,employeeName){
	return new Promise( function(resolve) {
		_verifyRequesterUserToken(requesterUser,requesterToken).then(function(){
			resolve(_getMeetingsForEmployee(employeeName));
		});
	});	
}

function _getMeetingsForEmployee(employeeName){
	return new Promise( function(resolve) {
		MongoClient.connect(sUrl, function(err, db){
			db.collection('employees').find({username:employeeName}).map(function(item){
				return {username:item.username,meetings:item.meetings,scheduleBegin:item.scheduleBegin,scheduleEnd:item.scheduleEnd};
			}).toArray().then(function(result){
				resolve(result[0]);
				db.close();
			});
		});
	});
}

function getMeetingsForRoom(requesterUser,requesterToken,roomNumber){
	return new Promise( function(resolve) {
		_verifyRequesterUserToken(requesterUser,requesterToken).then(function(){
			resolve(_getMeetingsForRoom(roomNumber));
		});
	});	
}

function _getMeetingsForRoom(roomNumber){
	return new Promise( function(resolve) {
		MongoClient.connect(sUrl, function(err, db){
			db.collection('rooms').find({roomNumber:roomNumber}).map(function(item){
				return {meetings:item.meetings,roomNumber:item.roomNumber};
			}).toArray().then(function(result){
				resolve(result[0]);
				db.close();
			});
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

function getMeetingsList(requesterUser,requesterToken,meetingsUser) {
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('employees').find({username:meetingsUser}).map(function(item){
						return item.meetings;
					}).toArray().then(function(result){
						resolve(result[0]);
					});
				});				
			}
		});
	});
}

function getNotificationsList(requesterUser,requesterToken) {
	verify = _verifyRequesterUserToken(requesterUser,requesterToken);
	return new Promise( function(resolve) {
		Promise.all([verify]).then(function(result){
			if (result.length===0){
				resolve("BAD_CREDENTIALS");
			}
			else{
				MongoClient.connect(sUrl, function(err, db){
					db.collection('employees').find({username:requesterUser}).map(function(item){
						return item.notifications;
					}).toArray().then(function(result){
						resolve(result[0]);
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
						result[0].sessionToken = randU32Sync().toString();
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
		res.status(200).json(result[0]);
		res.end();
	});
});

rootRouter.get('/getEmployeeList',function(req,res,next){
	getEmployeeList(req.query.requesterUser,req.query.requesterToken).then(function(result){
		res.status(200).json(result);
		res.end();
	});
});

rootRouter.get('/getRoomsList',function(req,res,next){
	getRoomsList(req.query.requesterUser,req.query.requesterToken).then(function(result){
		res.status(200).json(result);
		res.end();
	});
});

rootRouter.get('/getMeetingsList',function(req,res,next){
	if (!req.query.requesterUser || !req.query.requesterToken || !req.query.meetingsUser) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		getMeetingsList(req.query.requesterUser,req.query.requesterToken,req.query.meetingsUser).then(function(result){
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.get('/getNotificationsList',function(req,res,next){
	if (!req.query.requesterUser || !req.query.requesterToken) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		getNotificationsList(req.query.requesterUser,req.query.requesterToken,req.query.meetingsUser).then(function(result){
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/addEmployee',function(req,res,next){
	addEmployee(req.body.requesterUser,req.body.requesterToken,req.body.user,req.body.pass,req.body.fname,req.body.mname,req.body.lname,req.body.isAdmin).then(function(result){
		res.status(200).json(result);
		res.end();
	});
});

rootRouter.post('/addRoom',function(req,res,next){
	addRoom(req.body.requesterUser,req.body.requesterToken,req.body.roomNumber,req.body.roomCapacity).then(function(result){
		res.status(200).json(result);
		res.end();
	});
});

rootRouter.post('/updateProfile',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.pass || !req.body.fname || !req.body.mname || !req.body.lname || !req.body.startHours || !req.body.endHours) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		updateProfile(req.body.requesterUser,req.body.requesterToken,req.body.pass,req.body.fname,req.body.mname,req.body.lname,req.body.startHours,req.body.endHours,req.body.isVisible).then(function(result){
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/deleteEmployee',function(req,res,next){
	deleteEmployee(req.body.requesterUser,req.body.requesterToken,req.body.username).then(function(result){
		res.status(200).json(result);
		res.end();
	});
});

rootRouter.post('/deleteRoom',function(req,res,next){
	deleteRoom(req.body.requesterUser,req.body.requesterToken,req.body.roomNumber).then(function(result){
		res.status(200).json(result);
		res.end();
	});
});

rootRouter.post('/verifyMeeting',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.meetingTitle || !req.body.meetingDesc || !req.body.meetingEmployees || !req.body.roomNumber || !req.body.startTime || !req.body.endTime) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		verifyMeeting(req.body.requesterUser,req.body.requesterToken,req.body.meetingTitle,req.body.meetingDesc,req.body.meetingEmployees,req.body.roomNumber,req.body.startTime,req.body.endTime).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/deleteMeeting',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.roomNumber || !req.body.key || !req.body.title || !req.body.owner || !req.body.meetingEmployees) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		req.body.meetingEmployees = req.body.meetingEmployees.split(',');
		console.log(req.body);
		deleteMeeting(req.body.requesterUser,req.body.requesterToken,req.body.roomNumber,req.body.key,req.body.title,req.body.owner,req.body.meetingEmployees).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/acknowledgeNotification',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.key || !req.body.title || !req.body.sender) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		acknowledgeNotification(req.body.requesterUser,req.body.requesterToken,req.body.key,req.body.title,req.body.sender).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/acceptMeetingNotification',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.key || !req.body.title || !req.body.sender) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		acceptMeetingNotification(req.body.requesterUser,req.body.requesterToken,req.body.key,req.body.title,req.body.sender).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/declineMeetingNotification',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.key || !req.body.title || !req.body.sender) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		declineMeetingNotification(req.body.requesterUser,req.body.requesterToken,req.body.key,req.body.title,req.body.sender).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/ignoreMeetingNotification',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.key || !req.body.title || !req.body.sender) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		ignoreMeetingNotification(req.body.requesterUser,req.body.requesterToken,req.body.key,req.body.title,req.body.sender).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/suggestMeeting',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.meetingTitle || !req.body.meetingDesc || !req.body.meetingDuration || !req.body.meetingEmployees) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		suggestMeeting(req.body.requesterUser,req.body.requesterToken,req.body.meetingTitle,req.body.meetingDesc,req.body.meetingDuration,req.body.meetingEmployees).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

rootRouter.post('/createMeeting',function(req,res,next){
	if (!req.body.requesterUser || !req.body.requesterToken || !req.body.meetingTitle || !req.body.meetingDesc || !req.body.meetingEmployees || !req.body.roomNumber || !req.body.startTime || !req.body.endTime) {
		res.status(400).json("INCOMPLETE_REQUEST_DETECTED");
		res.end();
	}
	else{
		createMeeting(req.body.requesterUser,req.body.requesterToken,req.body.meetingTitle,req.body.meetingDesc,req.body.meetingEmployees,req.body.roomNumber,req.body.startTime,req.body.endTime).then(function(result){
			console.log(result);
			res.status(200).json(result);
			res.end();
		});
	}
});

app.use('/',rootRouter);
app.listen(3000);
console.log("Server Started on port 3000.");

