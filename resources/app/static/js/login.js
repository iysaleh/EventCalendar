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
	},
	updateMeetingsCalendar: function() {
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
					window.calendar_events = responseData;
					//console.log("I'VE RELOADED THE VARIABLE!");
					$('#calendar').fullCalendar( 'removeEvents' );
					$('#calendar').fullCalendar( 'addEventSource',window.calendar_events );
					//$('#calendar').fullCalendar( 'refetchEvents' );
					$('#calendar').fullCalendar( 'rerenderEvents' );
					setTimeout(function(){login.updateMeetingsCalendar();},5000);

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
					//window.calendar_events = window.calendar_events.concat(responseData['meetings']);
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
					login.updateMeetingsCalendar()
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