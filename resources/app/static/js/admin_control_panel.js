let admin_control_panel = {
	loadPage: function(page) {
		$('#main_content').load(page);
		if (page==='deleteEmployee.html'){
			admin_control_panel.loadEmployeeList("deleteEmpSelect");
		}
		else if (page==='deleteRoom.html'){
			admin_control_panel.loadRoomsList("deleteRoomsSelect");
		}
		else if (page==='createMeeting.html'){
			admin_control_panel.loadEmployeeList("createMeetingSelectEmp");
			admin_control_panel.loadRoomsList("createMeetingSelectRoom");
		}
		else if (page==='deleteMeeting.html'){
			admin_control_panel.loadMeetingsList("deleteMeetingSelect");
		}
		else if (page==='notifications.html'){
			$(document).ready(function(){
				//$('#notifications-pane').load($($.parseHTML(window.notificationsHtml)));
				console.log(window.notificationsHtml);
				document.getElementById("notifications-pane").insertAdjacentHTML('beforeend',window.notificationsHtml);
			});
		}
	},
	addEmployee: function(user,pass,fname,mname,lname,isAdmin) {
		$.ajax({
			method: 'POST',
			url: window.server + '/addEmployee',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				user:user,
				pass:pass,
				fname:fname,
				mname:mname,
				lname:lname,
				isAdmin:isAdmin
			},
			success: function(responseData,responseStatus,responseXHR){
				//window.alert(responseData[0]['username']);
				if ( responseData.length === 0){
					window.alert("Add User Failed!","USER ADD FAILURE");
				}
				else if ( responseData==='USER_ADD_SUCCESS' ){
					window.alert("User account '" + user + "' successfully created!","USER ADD SUCCESS");
					$('#add-employee-form').trigger('reset');
				}
				else if ( responseData==='BAD_CREDENTIALS' ){
					window.alert("Bad credentials detected! Are you an Administrator?","USER ADD FAILURE");
				}
				else if ( responseData==='USERNAME_ALREADY_EXISTS' ){
					window.alert("Username already exists!", "USER ADD FAILURE");
				}
			},
			error: function(xhr, textStatus){
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			}
		});
	},
	manageProfile: function(pass,fname,mname,lname,startHours,endHours,isVisible) {
		$("#manageEmp-updateProfile-button").attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/updateProfile',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				pass:pass,
				fname:fname,
				mname:mname,
				lname:lname,
				startHours:startHours,
				endHours:endHours,
				isVisible:isVisible
			},
			tryCount : 0,
			retryLimit : 3,
			timeout:1000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#manageEmp-updateProfile-button").removeAttr("disabled");
				if (responseData.errorMessage){
					window.alert(responseData.errorMessage,"UPDATE PROFILE FAILURE");
				}
				else{
					//console.log(responseData.successMessage);//,"NOTIFICATION ACKNOWLEDGED SUCCESSFULLY");
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#manageEmp-updateProfile-button").removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
					else{
						$("#manageEmp-updateProfile-button").removeAttr("disabled");
					}
				}
				else if (xhr.status >= 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});	
	},
	addRoom: function(roomNum,roomCap) {
		window.alert("Room Number: "+ roomNum + " RoomCap: "+ roomCap + " User: " + window.username + " Token: " + window.sessionToken);
		Promise.resolve(
			$.ajax({
				method: "POST",
				url: window.server + '/addRoom',
				data: {
					requesterUser:window.username,
					requesterToken:window.sessionToken,
					roomNumber:roomNum,
					roomCapacity:roomCap
				},
				timeout:3000
			})
		).then(function(responseData){
			if ( responseData.length === 0){
					window.alert("Add Room Failed!","ROOM ADD FAILURE");
			}
			else if ( responseData==='ROOM_ADD_SUCCESS' ){
				window.alert("Room '" + roomNum + "' successfully created!","ROOM ADD SUCCESS");
				$('#add-room-form').trigger('reset');
			}
			else if ( responseData==='BAD_CREDENTIALS' ){
				window.alert("Bad credentials detected! Are you an Administrator?","ROOM ADD FAILURE");
			}
			else if ( responseData==='ROOM_ALREADY_EXISTS' ){
				window.alert("Room " + roomNum + " already exists!", "ROOM ADD FAILURE");
			}
		}).catch(function (e){
			if (e.statusText === 'timeout'){
				console.log("Failed from timeout");
			}
		});
	},
	loadEmployeeList: function(selectorName) {
		$(document).ready(function(){
			$.ajax({
				method: 'get',
				url: window.server + '/getEmployeeList',
				data: {
					requesterUser:window.username,
					requesterToken:window.sessionToken
				},
				tryCount : 0,
				retryLimit : 3,
				timeout:2000,
				success: function(responseData,responseStatus,responseXHR){
					//window.alert(responseData[0]['username']);
					if ( responseData.length === 0){
						window.alert("Get Employeelist Failed!","GET EMPLOYEES FAILURE");
					}
					else{
						$.each(responseData,function(index,value){
							$("#"+selectorName).append($("<option></option>").attr({"value":value,"id":"del-emp-list-"+value}).text(value));
						});
					}
				},
				error: function(xhr, textStatus){
					if(textStatus === 'timeout'){
						console.log("Failed from timeout");
						if (this.tryCount <= this.retryLimit) {
							//try again
							$.ajax(this);
							return;
						}
					}
					else{
						window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
					}
				}
			});
		});
	},
	loadRoomsList: function(selectorName) {
		$(document).ready(function(){
			$.ajax({
				method: 'get',
				url: window.server + '/getRoomsList',
				data: {
					requesterUser:window.username,
					requesterToken:window.sessionToken
				},
				tryCount : 0,
				retryLimit : 3,
				timeout:2000,
				success: function(responseData,responseStatus,responseXHR){
					//window.alert(responseData[0]['username']);
					if ( responseData.length === 0){
						window.alert("Get Room list Failed!","GET ROOMS FAILURE");
					}
					else{
						$.each(responseData,function(index,value){
							$("#"+selectorName).append($("<option></option>").attr({"value":value,"id":"del-rooms-list-"+value}).text("Room Number: "+value));
						});
					}
				},
				error: function(xhr, textStatus){
					if(textStatus === 'timeout'){
						console.log("Failed from timeout");
						if (this.tryCount <= this.retryLimit) {
							//try again
							$.ajax(this);
							return;
						}
					}
					else{
						window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
					}
				}
			});
		});
	},
	loadMeetingsList: function(selectorName) {
		$(document).ready(function(){
			$.ajax({
				method: 'get',
				url: window.server + '/getMeetingsList',
				data: {
					requesterUser:window.username,
					requesterToken:window.sessionToken,
					meetingsUser:window.username
				},
				tryCount : 0,
				retryLimit : 5,
				timeout:1000,
				success: function(responseData,responseStatus,responseXHR){
					$.each(responseData,function(index,value){
						$("#"+selectorName).append($("<option></option>").attr({"key":value.key,"title":value.title,"value":value.key,"id":"del-meetings-list-"+value.key}).text("Meeting Title: "+value.title));
					});
				},
				error: function(xhr, textStatus){
					if(textStatus === 'timeout'){
						console.log("Failed from timeout");
						if (this.tryCount <= this.retryLimit) {
							this.tryCount += 1;
							this.timeout += 1500;
							//try again
							$.ajax(this);
							return;
						}
					}
					else{
						window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
					}
				}
			});
		});
	},
	deleteEmployee: function(user) {
		$.ajax({
			method: 'POST',
			url: window.server + '/deleteEmployee',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				username:user
			},
			timeout:5000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				//window.alert(responseData[0]['username']);
				if ( responseData.length === 0){
					window.alert("Delete User Failed!","USER DELETE FAILURE");
				}
				else if ( responseData==='USER_DELETE_SUCCESS' ){
					window.alert("User account '" + user + "' successfully deleted!","USER DELETE SUCCESS");
					$('#del-emp-list-'+user).remove();
				}
				else if ( responseData==='BAD_CREDENTIALS' ){
					window.alert("Bad credentials detected! Are you an Administrator?","USER DELETE FAILURE");
				}
			},
			error: function(xhr, textStatus){
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			}
		});
	},
	deleteRoom: function(roomNumber) {
		$.post({
			url: window.server + '/deleteRoom',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				roomNumber:roomNumber
			},
			datamethod:'json',
			timeout:5000,
			success: function(responseData,responseStatus,responseXHR){
				//window.alert(responseData[0]['username']);
				if ( responseData.length === 0){
					window.alert("Delete Room Failed!","ROOM DELETE FAILURE");
				}
				else if ( responseData==='ROOM_DELETE_SUCCESS' ){
					window.alert("Room Number '" + roomNumber + "' successfully deleted!","ROOM DELETE SUCCESS");
					$('#del-rooms-list-'+roomNumber).remove();
				}
				else if ( responseData==='BAD_CREDENTIALS' ){
					window.alert("Bad credentials detected! Are you an Administrator?","ROOM DELETE FAILURE");
				}
			},
			error: function(xhr, textStatus){
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			}
		});
	},
	deleteMeeting: function(roomNumber) {
		$.post({
			url: window.server + '/deleteMeeting',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				roomNumber:roomNumber
			},
			datamethod:'json',
			timeout:5000,
			success: function(responseData,responseStatus,responseXHR){
				//window.alert(responseData[0]['username']);
				if ( responseData.length === 0){
					window.alert("Delete Room Failed!","ROOM DELETE FAILURE");
				}
				else if ( responseData==='ROOM_DELETE_SUCCESS' ){
					window.alert("Room Number '" + roomNumber + "' successfully deleted!","ROOM DELETE SUCCESS");
					$('#del-rooms-list-'+roomNumber).remove();
				}
				else if ( responseData==='BAD_CREDENTIALS' ){
					window.alert("Bad credentials detected! Are you an Administrator?","ROOM DELETE FAILURE");
				}
			},
			error: function(xhr, textStatus){
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			}
		});
	},
	createMeetingSuggestAndFinalize: function(meetingTitle,meetingDesc,meetingDuration,meetingEmployeesSelector,suggestMeetingLabelSelector,buttonSelectorId){
		$('#create-meeting-select-rooms').show( "slow" );
		$("#"+buttonSelectorId).attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/suggestMeeting',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				meetingOwner:window.username,
				meetingTitle:meetingTitle,
				meetingDesc:meetingDesc,
				meetingEmployees:$('#'+meetingEmployeesSelector).val(),
				meetingDuration:meetingDuration
			},
			tryCount : 0,
			retryLimit : 5,
			timeout:1500,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#"+buttonSelectorId).removeAttr("disabled");
				//window.alert(responseData[0]['username']);
				if ( responseData.length === 0){
					window.alert("Meeting Verification Failed!","METTING VERIFICATION FAILURE");
				}
				else if (responseData.errorMessage){
					$('#'+suggestMeetingLabelSelector).text(responseData.errorMessage);
				}
				else{
					$('#'+suggestMeetingLabelSelector).text("Suitable meeting time found in Room #"+responseData.roomNumber + " from start time: " + responseData.startTime + " to end time: " + responseData.endTime);
					$('#createMeeting-datetimepicker-startMeeting').val(responseData.startTime);
					$('#createMeeting-datetimepicker-endMeeting').val(responseData.endTime);
					$('#createMeetingSelectRoom').val(responseData.roomNumber);
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#"+buttonSelectorId).removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
					else{
						$("#"+buttonSelectorId).removeAttr("disabled");
						console.log('Suggest Meeting function failed from timeout.');
					}
				}
				else if (xhr.status === 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});
	},
	verifyMeetingConfiguration: function(meetingTitle,meetingDesc,meetingEmployeesSelector,roomNumber,startTime,endTime,buttonSelectorId){
		$("#"+buttonSelectorId).attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/verifyMeeting',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				meetingOwner:window.username,
				meetingTitle:meetingTitle,
				meetingDesc:meetingDesc,
				meetingEmployees:$('#'+meetingEmployeesSelector).val(),
				roomNumber:roomNumber,
				startTime:startTime,
				endTime:endTime
			},
			tryCount : 0,
			retryLimit : 5,
			timeout:3000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#"+buttonSelectorId).removeAttr("disabled");
				if ( responseData.length === 0){
					window.alert("Meeting Verification Failed!","METTING VERIFICATION FAILURE");
				}
				else if (responseData.errorMessage){
					window.alert(responseData.errorMessage);
				}
				else{
					window.alert(responseData,"MEETING VERIFICATION");
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#"+buttonSelectorId).removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
				}
				else if (xhr.status === 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});
	},
	createMeeting: function(meetingTitle,meetingDesc,meetingEmployeesSelector,roomNumber,startTime,endTime,buttonSelectorId){
		$("#"+buttonSelectorId).attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/createMeeting',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				meetingOwner:window.username,
				meetingTitle:meetingTitle,
				meetingDesc:meetingDesc,
				meetingEmployees:$('#'+meetingEmployeesSelector).val(),
				roomNumber:roomNumber,
				startTime:startTime,
				endTime:endTime
			},
			tryCount : 0,
			retryLimit : 3,
			timeout:1000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#"+buttonSelectorId).removeAttr("disabled");
				if ( responseData.length === 0){
					window.alert("Meeting Creation Failed!","MEETING CREATION FAILURE");
				}
				else if (responseData.errorMessage){
					window.alert(responseData.errorMessage,"MEETING CREATION FAILURE");
				}
				else{
					window.alert(responseData.successMessage,"MEETING CREATED SUCCESSFULLY");
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#"+buttonSelectorId).removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
					else{
						$("#"+buttonSelectorId).removeAttr("disabled");
						console.log('CreateMeeting function failed from timeout.');
					}
				}
				else if (xhr.status >= 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});	
	},
	acceptMeetingNotification: function(notificationIdentifier,buttonSelectorId,key,title,sender){
		$("#"+buttonSelectorId).attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/acceptMeetingNotification',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				key:key,
				title:title,
				sender:sender
			},
			tryCount : 0,
			retryLimit : 3,
			timeout:1000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#"+buttonSelectorId).removeAttr("disabled");
				if (responseData.errorMessage){
					window.alert(responseData.errorMessage,"NOTIFICATION ACKNOWLEDGE FAILURE");
				}
				else{
					console.log(responseData.successMessage);//,"NOTIFICATION ACKNOWLEDGED SUCCESSFULLY");
					var element = document.getElementById(notificationIdentifier);
					element.parentNode.removeChild(element);
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#"+buttonSelectorId).removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
					else{
						$("#"+buttonSelectorId).removeAttr("disabled");
					}
				}
				else if (xhr.status >= 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});	
	},
	ignoreMeetingNotification: function(notificationIdentifier,buttonSelectorId,key,title,sender){
		$("#"+buttonSelectorId).attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/ignoreMeetingNotification',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				key:key,
				title:title,
				sender:sender
			},
			tryCount : 0,
			retryLimit : 3,
			timeout:1000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#"+buttonSelectorId).removeAttr("disabled");
				if (responseData.errorMessage){
					window.alert(responseData.errorMessage,"NOTIFICATION ACKNOWLEDGE FAILURE");
				}
				else{
					console.log(responseData.successMessage);//,"NOTIFICATION ACKNOWLEDGED SUCCESSFULLY");
					var element = document.getElementById(notificationIdentifier);
					element.parentNode.removeChild(element);
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#"+buttonSelectorId).removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
					else{
						$("#"+buttonSelectorId).removeAttr("disabled");
					}
				}
				else if (xhr.status >= 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});	
	},
	declineMeetingNotification: function(notificationIdentifier,buttonSelectorId,key,title,sender){
		$("#"+buttonSelectorId).attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/declineMeetingNotification',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				key:key,
				title:title,
				sender:sender
			},
			tryCount : 0,
			retryLimit : 3,
			timeout:1000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#"+buttonSelectorId).removeAttr("disabled");
				if (responseData.errorMessage){
					window.alert(responseData.errorMessage,"NOTIFICATION ACKNOWLEDGE FAILURE");
				}
				else{
					console.log(responseData.successMessage);//,"NOTIFICATION ACKNOWLEDGED SUCCESSFULLY");
					var element = document.getElementById(notificationIdentifier);
					element.parentNode.removeChild(element);
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#"+buttonSelectorId).removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
					else{
						$("#"+buttonSelectorId).removeAttr("disabled");
					}
				}
				else if (xhr.status >= 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});	
	},
	acknowledgeNotification: function(notificationIdentifier,buttonSelectorId,key,title,sender){
		$("#"+buttonSelectorId).attr("disabled", "disabled");
		$.ajax({
			method: 'POST',
			url: window.server + '/acknowledgeNotification',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				key:key,
				title:title,
				sender:sender
			},
			tryCount : 0,
			retryLimit : 3,
			timeout:1000,
			datamethod:'json',
			success: function(responseData,responseStatus,responseXHR){
				$("#"+buttonSelectorId).removeAttr("disabled");
				if (responseData.errorMessage){
					window.alert(responseData.errorMessage,"NOTIFICATION ACKNOWLEDGE FAILURE");
				}
				else{
					console.log(responseData.successMessage);//,"NOTIFICATION ACKNOWLEDGED SUCCESSFULLY");
					var element = document.getElementById(notificationIdentifier);
					element.parentNode.removeChild(element);
				}
			},
			error: function(xhr, textStatus){
				if(textStatus !== 'timeout'){
					$("#"+buttonSelectorId).removeAttr("disabled");
				}
				if(textStatus === 'timeout'){
					console.log("Failed from timeout");
					if (this.tryCount <= this.retryLimit) {
						this.tryCount += 1;
						this.timeout += 1000;
						$.ajax(this);
						return;
					}
					else{
						$("#"+buttonSelectorId).removeAttr("disabled");
					}
				}
				else if (xhr.status >= 400){
					window.alert('INVALID_REQUEST','INVALID REQUEST FAILURE');
				}
				else{
					window.alert('Unable to login to server: '+window.server,"CONNECTION FAILURE");
				}
			},
			complete: function(){
			}
		});	
	}
};