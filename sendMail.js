import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { Base64 } from "js-base64";
import { google } from "googleapis";
import { CLIENTID, CLIENTSECRET, CLIENTEMAIL } from "./serverConfig.js";

async function sendEmail(mailTo, mailFrom, subject, body, id, threadId, gmail) {
    try {
        const mail = new MailComposer({
            to: mailTo,
            text: body,
            subject: subject,
            from: mailFrom,
            inReplyTo: id
        });

        mail.compile().build(async (err, message) => {
            if (err) {
                console.error("Error compiling email:", err);
                return;
            }

            const encodedMessage = Base64.encodeURI(message);
            const res = await gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw: encodedMessage,
                    threadId: threadId
                }
            });

            console.log("Message Details:", res.data);
        });
    } catch (err) {
        console.error("Error sending email:", err);
    }
}

export {sendEmail};
