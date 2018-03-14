if (typeof asticode === "undefined") {
    var asticode = {};
	server = 'http://shadowhawk.ddns.net:3000';
	calendar_events = [];
	notifications = [];
	isAdmin = false;
	username = "";
	sessionToken = "";
	notificationsHtml = "";
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
	},
	updateNotifications: function() {
		$(document).ready(function(){
			$.ajax({
				method: 'get',
				url: window.server + '/getNotificationsList',
				data: {
					requesterUser:window.username,
					requesterToken:window.sessionToken,
				},
				tryCount : 0,
				retryLimit : 5,
				timeout:1000,
				success: function(responseData,responseStatus,responseXHR){
					//Compute new notifications set
					var new_notifications = _.filter(responseData, function(obj){ return !_.findWhere(window.notifications, obj); });
					//Add new notification objects to notificationsHtml
					for (let i = 0; i < new_notifications.length;i++){
						if (new_notifications[i].type==='respond'){
							window.notificationsHtml += login.getMeetingRespondNotificationHTML(new_notifications[i]);
						}
						else if (new_notifications[i].type==='acknowledge'){
							window.notificationsHtml += login.getAcknowledgeNotificationHTML(new_notifications[i]);
						}
					}
					
					//If notifications page is in DOM, add notifications to page directly
					if (document.getElementById('notifications-pane')) {
						for (let i = 0; i < new_notifications.length;i++){
							if (new_notifications[i].type==='respond'){
								document.getElementById('notifications-pane').insertAdjacentHTML('beforeend',login.getMeetingRespondNotificationHTML(new_notifications[i]));
							}
							else if (new_notifications[i].type==='acknowledge'){
								document.getElementById('notifications-pane').insertAdjacentHTML('beforeend',login.getAcknowledgeNotificationHTML(new_notifications[i]));
							}
						}
					}
					//set notifications to include new notifications
					window.notifications = responseData;
					setTimeout(function(){login.updateNotifications();},5000);

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
	getMeetingRespondNotificationHTML: function(notification){
		var identifier = "notification-"+notification.key+"-"+notification.title;
		var buttonAcceptIdentifier = "notification-"+notification.key+"-"+notification.title+"-buttonAccept";
		var buttonIgnoreIdentifier = "notification-"+notification.key+"-"+notification.title+"-buttonIgnore";
		var buttonDeclineIdentifier = "notification-"+notification.key+"-"+notification.title+"-buttonDecline";

		var resHTML = "";
		resHTML += "<form class='control-panel-form' id='"+identifier+"'>\n";
		resHTML += "\t<label>"+notification.title+"</label></br>\n";
		resHTML += "\t<label>"+notification.message+"</label></br>\n";
		resHTML += "\t<label>Meeting Originated from: "+notification.sender+"</label><br/>\n";
		resHTML += "\t<button type='button' id='"+buttonAcceptIdentifier+"' class='three-button-accept' onclick=\"admin_control_panel.acceptMeetingNotification('"+identifier+"','"+buttonAcceptIdentifier+"','"+notification.key+"','"+notification.title+"','"+notification.sender+"')\">Accept</button>\n";
		resHTML += "\t<button type='button' id='"+buttonIgnoreIdentifier+"' class='three-button-ignore' onclick=\"admin_control_panel.ignoreMeetingNotification('"+identifier+"','"+buttonIgnoreIdentifier+"','"+notification.key+"','"+notification.title+"','"+notification.sender+"')\">Ignore</button>\n";
		resHTML += "\t<button type='button' id='"+buttonDeclineIdentifier+"' class='three-button-decline' onclick=\"admin_control_panel.declineMeetingNotification('"+identifier+"','"+buttonDeclineIdentifier+"','"+notification.key+"','"+notification.title+"','"+notification.sender+"')\">Decline</button>\n";
		resHTML += "</form>\n";
		return resHTML;
	},
	getAcknowledgeNotificationHTML: function(notification){
		var identifier = "notification-"+notification.key+"-"+notification.title;
		var buttonIdentifier = "notification-"+notification.key+"-"+notification.title+"-button";
		var resHTML = "";
		resHTML += "<form class='control-panel-form' id='"+identifier+"'>\n";
		resHTML += "\t<label>"+notification.title+"</label></br>\n";
		resHTML += "\t<label>"+notification.message+"</label></br>\n";
		resHTML += "\t<label>Meeting Originated from: "+notification.sender+"</label>\n";
		resHTML += "\t<button type='button' id='"+buttonIdentifier+"' onclick=\"admin_control_panel.acknowledgeNotification('"+identifier+"','"+buttonIdentifier+"','"+notification.key+"','"+notification.title+"','"+notification.sender+"')\">Acknowledge</button>\n";
		resHTML += "</form>\n";
		return resHTML;
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
					//window.notifications = window.notifications.concat(responseData['notifications']);
					window.isAdmin = responseData['isAdmin'];
					window.sessionToken = responseData['sessionToken'];
					window.username = responseData['username'];
					$('body').load('index.html',function(){
						login.updateMeetingsCalendar();
						login.updateNotifications();
					});
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