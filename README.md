# How to build Facebook BOT Messenger with Ngrok

This repo is forked from [fb-masterclass-jakarta/step-create-bot-messenger](https://github.com/fb-masterclass-jakarta/step-create-bot-messenger)

## What is needed?

- NodeJS
- Facebook Page
- Facebook App
- Webhook Service
- Ngrok (*optional*)


## **Step 1**

### Install NodeJS, NPM and Express

1. Download and install **NodeJS** from official website: https://nodejs.org/.

2. Check version.
```sh
node -v
```

3. Create directory and create service with Express.
```sh
mkdir bot
cd bot
npm init
npm install express request body-parser --save
```

## **Step 2**

### Install and run Ngrok

1. Download and install **Ngrok** from official website: https://ngrok.com/

2. Unzip from a terminal to any directory. On Windows, just double click ngrok.zip.
```sh
unzip /path/to/ngrok.zip
```

## **Step 3**

### Create file **index.js**

```javascript
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.urlencoded({extended: false}))

app.use(bodyParser.json())

app.get('/', function (req, res) {
	res.send('Masterclass Facebook Jakarta - Example Webhook')
})

app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'make_indonesian_great_again') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

```


## **Step 4**

### Create Facebook Page

1. Click https://www.facebook.com/pages/create


## **Step 5**

### Create Facebook App

1. Click https://developers.facebook.com/apps/

2. Add Product **Facebook Messenger**


## **Step 6**

### Test connection

```
curl -X POST "https://graph.facebook.com/v2.10/me/subscribed_apps?access_token=<PAGE_ACCESS_TOKEN>"
```

## **Step 7**

### Add AccessToken 
```javascript
const token = "<PAGE_ACCESS_TOKEN>"
```

## **Step 8**

### Add bot sending message
```javascript
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
	    let sender = event.sender.id
	    if (event.message && event.message.text) {
		    let text = event.message.text
		    sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
	    }
    }
    res.sendStatus(200)
})
```


## **Step 9**

### Create function sendTextMessage()
```javascript
function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

```

## **Step 10**

### Restart node

```
node index.js
```

## **Step 11**

### Improve Authentication

1. Add crypto library
```javascript
const crypto = require('crypto')
```

2. Add APP Secret
```javascript
const AppSecret = 'APP_YOUR_SECRET';
```

3. Check first
```javascript
app.use(bodyParser.json({verify: verifyRequestSignature}))
```

4. Add function to verify
```javascript
function verifyRequestSignature(req, res, buf){
  let signature = req.headers["x-hub-signature"];
  
  if(!signature){
    console.error('You dont have signature')
  } else {
    let element = signature.split('=')
    let method = element[0]
    let signatureHash = element[1]
    let expectedHash = crypto.createHmac('sha1', AppSecret).update(buf).digest('hex')

    console.log('signatureHash = ', signatureHash)
    console.log('expectedHash = ', expectedHash)
    if(signatureHash != expectedHash){
      console.error('signature invalid, send message to email or save as log')
    }
  }
}

```


## **Step 12**

Improve code above!

```javascript
app.post('/webhook/', function (req, res) {
  let data = req.body
  if(data.object == 'page'){
    data.entry.forEach(function(pageEntry) {
      pageEntry.messaging.forEach(function(messagingEvent) {
        if(messagingEvent.message.text){
          sendTextMessage(messagingEvent.sender.id,messagingEvent.message.text);
        } else {
          sendTextMessage(messagingEvent.sender.id,'Service Belum Support Untuk Mendeteksi Hal ini');
        }
      }); 
    });
    res.sendStatus(200)
  }
})
```

## **Step 13**

Improve Again!

```javascript
function sendTextMessage(sender, text) {
  let url = `https://graph.facebook.com/v2.6/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`;
  
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let parseData = JSON.parse(body);
      let messageData = {
        text: `Hi ${parseData.first_name} ${parseData.last_name}, you send message : ${text}`
      }
      request({
        url: 'https://graph.facebook.com/v2.10/me/messages',
        qs: {
          access_token: token
        },
        method: 'POST',
        json: {
          recipient: {
            id: sender
          },
          message: messageData,
        }
      }, function (error, response, body) {
        if (error) {
          console.log('Error sending messages: ', error)
        } else if (response.body.error) {
          console.log('Error: ', response.body.error)
        }
      })
    }
  })
}
```
