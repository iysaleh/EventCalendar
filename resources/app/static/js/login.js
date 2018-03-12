if (typeof asticode === "undefined") {
    var asticode = {};
	server = 'http://shadowhawk.ddns.net:3000';
	calendar_events = [];
	notifications = [];
	isAdmin = false;
	username = ""
	sessionToken = ""
}

let login = {
	init: function() {
		$('#server').attr('placeholder',window.server);
	}
};

asticode.authentication = {
    login: function(user,pass) {

		$.ajax({
			type: 'get',
			url: window.server + '/login',
			data: {
				user:user,
				pass:pass
			},
			success: function(responseData,responseStatus,responseXHR){
				//window.alert(responseData[0]['username']);
				if ( responseData.length === 0){
					window.alert("Bad Login Attempt.","LOGIN FAILURE");
				}
				else{
					window.calendar_events = window.calendar_events.concat(responseData['meetings']);
					window.notifications = window.notifications.concat(responseData['notifications']);
					window.isAdmin = responseData['isAdmin'];
					window.sessionToken = responseData['sessionToken'];
					window.username = responseData['username'];
					$('body').load('index.html');
					/*$(document).ready(function() {
						window.alert(responseData[0]);
						$('#calendar').fullCalendar('addEventSource',responseData[0]['meetings']);
						$('#calendar').fullCalendar('refetchEvents');
						$('#calendar').fullCalendar('render');
					});*/
				}
			},
			error: function(xhr){
				window.alert('Unable to login to server: '+window.server + ' with user: ' +user,"CONNECTION FAILURE");
			}
		});
    },
	configure: function(server){
		window.server = server;
		window.alert('Server Configuration changed to: '+server);
		login.init()
	}
};


$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});