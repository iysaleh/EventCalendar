let admin_control_panel = {
	loadPage: function(page) {
		if (page==='deleteEmployee.html'){
			$('#main_content').load(page);
			admin_control_panel.loadEmployeeList("deleteEmpSelect");
		}
		else{
			$('#main_content').load(page);
		}
	},
	addEmployee: function(user,pass,fname,mname,lname,isAdmin) {
		$.ajax({
			type: 'POST',
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
	loadEmployeeList: function(selectorName) {
		$(document).ready(function(){
			$.ajax({
				type: 'get',
				url: window.server + '/getEmployeeList',
				data: {
					requesterUser:window.username,
					requesterToken:window.sessionToken,
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
							$("#"+selectorName).append($("<option></option>").attr({"value":value,"id":"del-list-"+value}).text(value));
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
		window.alert(user);
		$.ajax({
			type: 'POST',
			url: window.server + '/deleteEmployee',
			data: {
				requesterUser:window.username,
				requesterToken:window.sessionToken,
				username:user
			},
			timeout:3000,
			success: function(responseData,responseStatus,responseXHR){
				window.alert(responseData);
				//window.alert(responseData[0]['username']);
				if ( responseData.length === 0){
					window.alert("Delete User Failed!","USER DELETE FAILURE");
				}
				else if ( responseData==='USER_DELETE_SUCCESS' ){
					window.alert("User account '" + user + "' successfully deleted!","USER DELETE SUCCESS");
					$('#del-list-'+user).remove();
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
	}
};