import express from 'express';
import {google} from 'googleapis';
import request from "request";
import cors from 'cors';
import urlparse from 'url-parse';
import bodyParser from 'body-parser';
import queryParse from 'query-string';
import axios from 'axios';

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
                    "https://www.googleapis.com/auth/gmail.addons.current.message.action"];
    
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

    // console.log(code);

    const oauth2Client = new google.auth.OAuth2(
        CLIENTID,
        CLIENTSECRET,
        "http://localhost:3000/"
    );

    const tokens = await oauth2Client.getToken(code);

    console.log(tokens);

    res.send("Details sent to console");

    
})

app.listen(PORT, () => {
    console.log("Server started at ", PORT);
});