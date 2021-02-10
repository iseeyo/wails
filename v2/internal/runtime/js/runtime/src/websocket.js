/*
 _       __      _ __
| |     / /___ _(_) /____
| | /| / / __ `/ / / ___/
| |/ |/ / /_/ / / (__  )
|__/|__/\__,_/_/_/____/
The lightweight framework for web-like apps
(c) Lea Anthony 2019-present
*/
/* jshint esversion: 6 */


import {setTray, hideOverlay, showOverlay} from "./store";

let websocket = null;
let callback = null;
let connectTimer;

function log(message) {
    // eslint-disable-next-line
    console.log(
        '%c wails bridge %c ' + message + ' ',
        'background: #aa0000; color: #fff; border-radius: 3px 0px 0px 3px; padding: 1px; font-size: 0.7rem',
        'background: #009900; color: #fff; border-radius: 0px 3px 3px 0px; padding: 1px; font-size: 0.7rem'
    );
}

export function StartWebsocket(userCallback) {

    callback = userCallback;

    window.onbeforeunload = function() {
        if( websocket ) {
            websocket.onclose = function () { };
            websocket.close();
            websocket = null;
        }
    }

    // ...and attempt to connect
    connect();

}

function setupIPCBridge() {
    // darwin
    window.webkit = {
        messageHandlers: {
            external: {
                postMessage: (message) => {
                    websocket.send(message);
                }
            },
            windowDrag: {
                postMessage: () => {
                    // Ignore window drag events
                }
            }
        }
    };
}

// Handles incoming websocket connections
function handleConnect() {
    log('Connected to backend');
    setupIPCBridge();
    hideOverlay();
    clearInterval(connectTimer);
    websocket.onclose = handleDisconnect;
    websocket.onmessage = handleMessage;
}

// Handles websocket disconnects
function handleDisconnect() {
    log('Disconnected from backend');
    websocket = null;
    showOverlay();
    connect();
}

// Try to connect to the backend every 1s (default value).
function connect() {
    connectTimer = setInterval(function () {
        if (websocket == null) {
            websocket = new WebSocket('ws://' + window.location.hostname + ':34115/bridge');
            websocket.onopen = handleConnect;
            websocket.onerror = function (e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                websocket = null;
                return false;
            };
        }
    }, 1000);
}

// Adds a script to the Dom.
// Removes it if second parameter is true.
function addScript(script, remove) {
    const s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.textContent = script;
    document.head.appendChild(s);

    // Remove internal messages from the DOM
    if (remove) {
        s.parentNode.removeChild(s);
    }
}

function handleMessage(message) {
    // As a bridge we ignore js and css injections
    switch (message.data[0]) {
        // Wails library - inject!
        case 'b':
            message = message.data.slice(1)
            addScript(message);
            log('Loaded Wails Runtime');

            // We need to now send a message to the backend telling it
            // we have loaded (System Start)
            window.webkit.messageHandlers.external.postMessage("SS");

            // Now wails runtime is loaded, wails for the ready event
            // and callback to the main app
            // window.wails.Events.On('wails:loaded', function () {
            if (callback) {
                log('Notifying application');
                callback(window.wails);
            }
            // });
            break;
        // 	// Notifications
        // case 'n':
        // 	addScript(message.data.slice(1), true);
        // 	break;
        // 	// Binding
        // case 'b':
        // 	const binding = message.data.slice(1);
        // 	//log("Binding: " + binding)
        // 	window.wails._.NewBinding(binding);
        // 	break;
        // 	// Call back
        case 'c':
            const callbackData = message.data.slice(1);
            window.wails._.Callback(callbackData);
            break;
        // Tray
        case 'T':
            const trayMessage = message.data.slice(1);
            switch (trayMessage[0]) {
                case 'S':
                    // Set tray
                    const trayJSON = trayMessage.slice(1);
                    let tray = JSON.parse(trayJSON)
                    setTray(tray)
                    break
                default:
                    log('Unknown tray message: ' + message.data);
            }
            break;

        default:
            log('Unknown message: ' + message.data);
    }
}