if (typeof asticode === "undefined") {
    var asticode = {};
}
asticode.calendar = {
    hide: function() {
        document.getElementById("asticalendar").style.display = "none";
    },
    init: function() {
        document.body.innerHTML = `
        <div class="asticalendar" id="asticalendar">
            <div class="astiloader-background"></div>
            <div class="asticalendar-calendar-frame"><div class="calendar" id="calendar">CALENDAR_PLACEHOLDER</div></div>
        </div>
        ` + document.body.innerHTML
    },
    show: function() {
        document.getElementById("asticalendar").style.display = "block";
    }
};