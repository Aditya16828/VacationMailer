import express from 'express';
import {google} from 'googleapis';
import request from "request";
import cors from 'cors';
import urlparse from 'url-parse';
import bodyParser from 'body-parser';
import queryParse from 'query-string';
import axios from 'axios';
import { Message } from 'emailjs'
import base64url from 'base64url';

import {PORT, CLIENTID, CLIENTSECRET} from './serverConfig.js';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get("/authentication", (req, res) => {
    const oauth2Client = new google.auth.OAuth2(
        CLIENTID,
        CLIENTSECRET,
        "http://localhost:3000/"
    )

    const scopes = ["https://www.googleapis.com/auth/gmail.send", 
                    "https://www.googleapis.com/auth/gmail.compose",
                    "https://www.googleapis.com/auth/userinfo.email", 
                    "https://www.googleapis.com/auth/userinfo.profile",
                    "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
                    "https://www.googleapis.com/auth/gmail.addons.current.message.action",
                    "https://www.googleapis.com/auth/gmail.readonly",
                    "https://www.googleapis.com/auth/gmail.labels",
                    "https://www.googleapis.com/auth/gmail.modify"];
    
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        state: JSON.stringify({
            callbackUrl: req.body.callbackUrl,
            userID: req.body.userid
        })
    });

    request(url, (err, response, body) => {
        console.log("error: ", err);
        console.log("statusCode: ", response && response.statusCode);
        res.send({url});
    })
})

app.get("/", async (req, res) => {
    const queryURL = new urlparse(req.url);
    const code = queryParse.parse(queryURL.query).code;


    const oauth2Client = new google.auth.OAuth2(
        CLIENTID,
        CLIENTSECRET,
        "http://localhost:3000/"
    );

    const tokens = await oauth2Client.getToken(code);


    try {
        let labels = (await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/labels', {headers: {
            authorization: "Bearer "+tokens.tokens.access_token 
        }})).data.labels;

        let labelNames = labels.map((ele) => ele.name);

        // console.log(labels);

        const customLabel = 'VACATION MAILS';
        let customLabelid;

        if(!labelNames.includes(customLabel)){
            // create a new label
            const response = (await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
                labelListVisibility: "labelShow",
                messageListVisibility: "show",
                name: customLabel
            }, {headers: {authorization: "Bearer "+tokens.tokens.access_token}})).data;

            console.log(response);
            customLabelid = response.id;
        } else {
            for(let i=0;i < labels.length;i++){
                if(labels[i].name==customLabel){
                    customLabelid = labels[i].id;
                    break;
                }
            }
        }


        const msgs = (await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {params: {
            q: "is:unread"
        }, headers: {
            authorization: "Bearer "+tokens.tokens.access_token
        }})).data.messages;

        let msgids = [];
        // console.log(msgs);

        msgs.forEach(async (element) => {
            if(element.id == element.threadId) {
                msgids.push(element.id);

                const msgDetails = (await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${element.id}`, {
                    headers: {authorization: "Bearer "+tokens.tokens.access_token}
                })).data;

                // send the messages
                // console.log(msgDetails.payload.headers);

                let sender, recipient;

                (msgDetails.payload.headers).forEach(async element => {
                    if(element.name == 'From'){
                        sender = element.value.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                    }

                    if(element.name == 'To'){
                        recipient = element.value.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                    }
                })


                const message = new Message({
                    text: "On Vacation",
                    to: [sender],
                    from: recipient,
                    subject: msgDetails.snippet
                });

                const encodedMessage = base64url(message.toString());

                const createMessage = {
                    raw: encodedMessage
                };

                const response = (await axios.post('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send', 
                                                    {message: createMessage}, 
                                                    {headers:  
                                                        {
                                                            Authorization: "Bearer "+tokens.tokens.access_token,
                                                            'Content-Type': 'message/rfc822'
                                                        }
                                })).data;
                console.log(response.id);

                // const gmail = google.gmail({ version: 'v1', auth });
                // const res = await gmail.users.messages.send({userId: 'me', requestBody: {raw: encodedMessage}});
            }
        });

        console.log(msgids);

        const response = (await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
            ids: msgids,
            addLabelIds: [customLabelid]
        }, {headers: {authorization: "Bearer "+tokens.tokens.access_token}})).data;

        console.log(response);

    } catch (error) {
        console.log(error.data);
        throw error;
    }

    res.send("Details sent to console");
});

app.listen(PORT, () => {
    console.log("Server started at ", PORT);
});