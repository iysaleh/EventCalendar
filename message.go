package main

import (
	"encoding/json"
	//"io/ioutil"
	//"os"
	//"os/user"
	//"path/filepath"
	//"sort"
	//"strconv"

	//"github.com/asticode/go-astichartjs"
	"github.com/asticode/go-astilectron"
	"github.com/asticode/go-astilectron-bootstrap"
)

// handleMessages handles messages
func handleMessages(_ *astilectron.Window, m bootstrap.MessageIn) (payload interface{}, err error) {
	switch m.Name {
	case "explore":
		// Unmarshal payload
		var path string
		if len(m.Payload) > 0 {
			// Unmarshal payload
			if err = json.Unmarshal(m.Payload, &path); err != nil {
				payload = err.Error()
				return
			}
		}
	case "login":
		var user string
		var pass string
		if len (m.Payload) > 0 {
			if err = json.Unmarshal(m.Payload, &user); err != nil {
				payload = err.Error()
				return
			}
			if err = json.Unmarshal(m.Payload, &pass); err != nil {
				payload = err.Error()
				return
			}
		}

	}
	return
}