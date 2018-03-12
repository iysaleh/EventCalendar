let admin_control_panel = {
	loadPage: function(page) {
		if (page==='deleteEmployee.html'){
			$('#main_content').load(page);
			admin_control_panel.loadEmployeeList("deleteEmpSelect");
		}
		else if (page==='deleteRoom.html'){
			$('#main_content').load(page);
			admin_control_panel.loadRoomsList("deleteRoomsSelect");
		}
		else{
			$('#main_content').load(page);
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
				timeout:10000,
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
				timeout:10000,
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
	}
};