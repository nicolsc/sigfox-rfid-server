#SIGFOX RFID demo server

Nodejs server that does the following
* Receive the Sigfox callbacks from demo devices
* Store the data in a db
* Expose the data, using Server sent events to update the display

##Install

* Install [NodeJS](http://nodejs.org)
* Install dependencies : `$ npm install``


##Slack set-up

###Set-up webhook

Got to [Slack website](https://slack.com/services/new/incoming-webhook) to set-up a new incoming-webhook

###Set env vars

####Local file

**Use with caution**

First, create a `config.local.js` file

Then, put your credentials using this syntax :

```
module.exports = {
  DEBUG: '*',
  SLACK_URL: '_{{webhook url provided by slack}}_',
  SLACK_CHANNEL: '_{{channel name}}_'
};
```

####Environment variables

You need to manually set up these two env vars :

* `SLACK_URL`
* `SLACK_CHANNEL`


##Run

```
$ npm start
```

Then open in your browser [http://localhost:34000](http://localhost:34000)

##Test

You can simulate a SIGFOX call by POSTing to /sigfox :

```
 $ curl -X POST http://localhost:34000/sigfox -d "deviceid={deviceid}" -d "data={tagID}"
```
