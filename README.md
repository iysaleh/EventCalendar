# EventCalendar
CS580 Event Calendar Implementation using Golang, Node.js, Mongodb and fullcalendar.io

Development Environment Setup Instructions
-------------------------------------------
* Install Golang (https://golang.org/)

  * Add the go binaries to your path

  * Install the External Library Dependencies
  
    *    go get -u github.com/asticode/go-astilectron
    *    go get -u github.com/asticode/go-astilectron-bootstrap
    *    go get -u github.com/asticode/go-astilog
    *    go get -u github.com/pkg/errors
    *    go get -u github.com/asticode/go-astilectron-bundler/...
    
* Checkout this repository into %USERPROFILE%\go\src\EventCalendar
    
* Using CLI, cd into the checkout directory

* Run the bundler for your platform

    `astilectron-bundler -v`

* Build EventCalendar

    `go build EventCalendar`

* Run EventCalendar

    `EventCalendar`

MongoDB/NodeJS Server Setup Instructions
-------------------------------------------
* Setup a Linux server (RaspberryPi used here)
* Install MongoDB for your OS (`sudo apt-get install mongodb`)
* Install Node.js and NPM for your platform (https://nodejs.org/en/)
* Setup Node.js service and point it to the server application.
* `npm install mongodb@2.2 -save`
* `npm install connect --save`
* `npm install moment --save`
