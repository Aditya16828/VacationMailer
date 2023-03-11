import axios from 'axios';

async function getUnreadmsgs(access_token) {
    try {
        const msgs = (await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
            params: {
                q: "is:unread"
            }, headers: {
                authorization: "Bearer " + access_token
            }
        })).data.messages;

        return msgs;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export {getUnreadmsgs};