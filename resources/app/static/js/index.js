let index = {
    about: function(html) {
        let c = document.createElement("div");
        c.innerHTML = html;
        asticode.modaler.setContent(c);
        asticode.modaler.show();
    },
    init: function() {
        // Init
        asticode.loader.init();
        asticode.modaler.init();
        asticode.notifier.init();
		//asticode.calendar.init();
		
		if (window.isAdmin==='true'){
			$('#left').load("admin_control_panel.html");
			$(document).ready(function(){
				$('#main_content').load("notifications.html");
			});
		}
		else{
			$('#left').load("control_panel.html");
			$(document).ready(function(){
				$('#main_content').load("notifications.html");
			});
		}
		//Load HTML Login Page to left panel.
		//$('#left').load("login.html");
		
		// Wait for astilectron to be ready
        document.addEventListener('astilectron-ready', function() {
            // Listen
            index.listen();
        })
    },
    listen: function() {
        astilectron.onMessage(function(message) {
            switch (message.name) {
                case "about":
                    index.about(message.payload);
                    return {payload: "payload"};
                    break;
                case "check.out.menu":
                    asticode.notifier.info(message.payload);
                    break;
            }
        });
    }
};