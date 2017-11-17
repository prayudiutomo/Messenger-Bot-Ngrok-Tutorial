'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const crypto = require('crypto')
const AppSecret = 'APP_YOUR_SECRET'
const token = 'PAGE_ACCESS_TOKEN'

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

app.use(bodyParser.json({verify: verifyRequestSignature}))

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

// Index route
app.get('/', function (req, res) {
  res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'make_indonesian_great_again') {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
});

app.post('/webhook/', function (req, res) {
  let data = req.body
  if(data.object == 'page'){
    data.entry.forEach(function(pageEntry) {
      pageEntry.messaging.forEach(function(messagingEvent) {
        if(messagingEvent.message.text){
          sendTextMessage(messagingEvent.sender.id,messagingEvent.message.text);
        } else if (messagingEvent.message.attachments){
          let attachment_url = messagingEvent.message.attachments[0].payload.url;
          let response = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": "Is this the right picture?",
                  "subtitle": "Tap a button to answer.",
                  "image_url": attachment_url,
                  "buttons": [
                    {
                      "type": "postback",
                      "title": "Yes!",
                      "payload": "yes",
                    },
                    {
                      "type": "postback",
                      "title": "No!",
                      "payload": "no",
                    }
                  ],
                }]
              }
            }
          }

          let request_body = {
            "recipient": {
              "id": messagingEvent.sender.id
            },
            "message": response
          }

          // Send the HTTP request to the Messenger Platform
          request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": { "access_token": token },
            "method": "POST",
            "json": request_body
          }, (err, res, body) => {
            if (!err) {
              console.log('message sent!')
            } else {
              console.error("Unable to send message:" + err);
            }
          });
        } else {
          sendTextMessage(messagingEvent.sender.id,'Service Belum Support Untuk Mendeteksi Hal ini');
        }
      });
    });
    res.sendStatus(200)
  }
})


function sendTextMessage(sender, text) {
  let url = `https://graph.facebook.com/v2.6/${sender}?fields=first_name,last_name,profile_pic,gender,fieldname_of_type_Location&access_token=${token}`;

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      let parseData = JSON.parse(body);
      let messageData = {
        text: `Hi ${parseData.first_name} ${parseData.last_name} (${parseData.gender}), you send message : ${text}`
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

// Spin up the server
app.listen(app.get('port'), function() {
  console.log('running on port', app.get('port'))
});