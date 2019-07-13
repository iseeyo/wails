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
import * as Log from './log';
import { On, Emit, Notify, Heartbeat, Acknowledge } from './events';
import { NewBinding } from './bindings';
import { Callback } from './calls';
import { AddScript, InjectCSS } from './utils';

// Initialise global if not already
window.wails = window.wails || {};
window.backend = {};

// Setup internal calls
var internal = {
  NewBinding,
  Callback,
  Notify,
  AddScript,
  InjectCSS
}

// Setup runtime structure
var runtime = {
  Log,
  Events: {
    On,
    Emit,
    Heartbeat,
    Acknowledge,
  },
  _: internal,
}

// Augment global
Object.assign(window.wails, runtime);

// Emit loaded event
Emit('wails:loaded');