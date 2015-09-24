'use strict';
/**
* Load local config to env
*/
try{
  const localConfig = require('./config.local.js');
  for (let entry in localConfig){
    if (process.env[entry]){
      console.log('%s found in process.env too, ignore the local config val\n\t env vars always have precedence', entry); 
    }
    else{
      process.env[entry] = localConfig[entry];
    }
  }
}
catch(e){
 console.log('No local config found'); 
  console.log(e);
}


const sseChannel = require('sse-channel');
let ssEventChannels = [];

const debug = require('debug')('sigfox-rfid-server:app');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
/* init */
const app = express();
const port = process.env.PORT || 34000;
const db = require('./modules/db');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:false}));
app.locals.moment = require('moment');


db.connect();

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});


app.get('/', function(req, res){
  debug('Looking for logs');
  db.find('calls', {path:'/sigfox', payload:{$exists:true}}, {sort:{time:-1}})
  .then(function(data){
    debug('%s items found', data.length);
    res.format({
        /* JSON first */
        json: function(){
            res.json({entries:data});
        },
        html: function(){
            res.render('logs', {title:'SIGFOX messages', entries:data});        
        },
        default:function(){
            res.status(406).send({err:'Invalid Accept header. This method only handles html & json'});
        }
    });
  })
  .catch(function(err){
    res.format({
      json: function(){
          return res.json({err:'An error occured while fetching messages', details:err});
      },
      html: function(){
            return res.status(500).render('error', {title:'An error occured while fetching messages', err:err});
        },
      default: function(){
        res.status(406).send({err:'Invalid Accept header. This method only handles html & json'});
      }
    });
  });
});


app.post('/sigfox', function(req, res){
  res.json({result:'♡'});
  
  logMessage(req);
  if (!req.body || !req.body.data || !req.body.deviceid){
    console.log(req.body);
    debug("Warning - invalid request");
    return;
  }
  
  broadcastEvent(req.body);
  
});

app.get('/device/:deviceid', function(req, res, next){
   if (!req.params.deviceid){
     return next(new Error('Missing device id'));
  }
  if (!/([0-9a-f]{4,8})/i.exec(req.params.deviceid)){
    return next(new Error('Invalid device id'));
  }
  res.render("device", {deviceid: req.params.deviceid});
});
app.get('/device/:deviceid/live', function(req, res, next){
  if (!req.params.deviceid){
    debug("Missing device id") ;
    return next(new Error('Missing device id'));
  }
  
  if (!ssEventChannels[req.params.deviceid]){
    initSSEChannel(req.params.deviceid);
  }
  addChannelClient(req.params.deviceid, req, res);
});

function logMessage(req){
  let entry = {
    method: req.method,
    path: req.url.replace(/\?(.*)$/, ''), 
    time: new Date().getTime(),
    payload:req.body||{}
  };
  
  
  //querystring ?
  if (req.query && Object.keys(req.query).length){
    Object.keys(req.query).forEach(function(key){
      if (!entry.payload[key]){
        entry.payload[key] = req.query[key];  
      }
      else{
        debug('WARN GET/POST conflict on %s', key);
        entry.payload['qry-'+key] = req.query[key];
      }
    });
    
  }
  
  db.insert('calls', entry)
  .then(function(obj){
    debug('Request log OK');
    debug(obj);
  })
  .catch(function(err){
    debug('Log err : %s', err);
    //return res.status(500).json({err:'Unable to log request', details:err.message});
  });
}


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});





function initSSEChannel(deviceid){
  deviceid = deviceid.toUpperCase();
  ssEventChannels[deviceid] = new sseChannel();
}
function addChannelClient(deviceid, req, res){
  ssEventChannels[deviceid.toUpperCase()].addClient(req, res);
}
function broadcastEvent(body){
  var data = {};
  if (!body || !body.deviceid){
    debug("Unable to broadcast message, no _deviceid_");
    return;
  }
  data.deviceid = body.deviceid.toUpperCase();
  data.date = (new Date()).toISOString();
  data.who = {
    tag : body.data,
    name : getTagInfo(body.data)
  };
  if (ssEventChannels[body.deviceid]){
    debug("Send Event to channel ~%s~", body.deviceid);
    ssEventChannels[body.deviceid].send(JSON.stringify(data));  
  }
  else{
    debug("No subscriber to %s", body.deviceid);
  }
}
function getTagInfo(id){
  var names = {
    "02d7befa":  "Nicolas L.",
    "d9b61a":  "Gaspard",
    "01a8306d":  "Friendly visitor",
    "03a80be5":  "Demo #1",
    "02d8792f":  "Demo #2",
    "02d8c4bf":  "Demo #3"
  };
  
  return names[id] || "Unknown badge";
}