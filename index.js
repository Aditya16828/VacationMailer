import express from 'express';
import { google } from 'googleapis';
import request from "request";
import cors from 'cors';
import urlparse from 'url-parse';
import bodyParser from 'body-parser';
import queryParse from 'query-string';


import { PORT, CLIENTID, CLIENTSECRET, REDIRECTURI } from './serverConfig.js';
import { sendEmail } from './sendMail.js';
import { getlabels } from './getLabels.js';
import { createLabel } from './createLabel.js';
import { getUnreadmsgs } from './getunreadmsgs.js';
import { getMsgDetails } from './getmsgDetails.js';
import { transferLabel } from './transferToLabel.js';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const scopes = ["https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.addons.current.action.compose",
        "https://www.googleapis.com/auth/gmail.addons.current.message.action",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.labels",
        "https://www.googleapis.com/auth/gmail.modify"];

const oauth2Client = new google.auth.OAuth2(
    CLIENTID,
    CLIENTSECRET,
    REDIRECTURI
);

app.get("/authentication", (req, res) => {

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
        res.send({ url });
    });
});

app.get("/", async (req, res) => {
    const queryURL = new urlparse(req.url);
    const code = queryParse.parse(queryURL.query).code;

    const tokens = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens.tokens);

    const gmail = await google.gmail({version: 'v1', auth: oauth2Client});

    try {
        const labels = await getlabels(tokens.tokens.access_token);

        const customLabel = 'VACATION MAILS';
        let customLabelid;

        const labelNames = labels.map((ele) => ele.name);

        if (!labelNames.includes(customLabel)) {
            const response = await createLabel(tokens.tokens.access_token, customLabel);
            customLabelid = response.id;
        } else {
            for (let i = 0; i < labels.length; i++) {
                if (labels[i].name == customLabel) {
                    customLabelid = labels[i].id;
                    break;
                }
            }
        }

        const msgs = await getUnreadmsgs(tokens.tokens.access_token);

        let msgids = [];

        msgs.forEach(async (element) => {
            if (element.id == element.threadId) {
                msgids.push(element.id);

                const msgDetails = await getMsgDetails(tokens.tokens.access_token, element.id);

                let sender, recipient, subject;

                (msgDetails.payload.headers).forEach(async element => {
                    if (element.name == 'From') {
                        sender = element.value.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)[0];
                    }

                    if (element.name == 'To') {
                        recipient = element.value.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)[0];
                    }

                    if(element.name == 'Subject'){
                        subject = element.value;
                    }
                });

                sendEmail(sender, recipient, subject, "On Vacation", element.id, element.threadId, gmail);
            }
        });

        const response = await transferLabel(tokens.tokens.access_token, msgids, [customLabelid]);

        console.log(response);

    } catch (error) {
        throw error;
    }

    res.send("Details sent to console");
});

app.listen(PORT, () => {
    console.log("Server started at ", PORT);
});