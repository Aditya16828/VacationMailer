import axios from 'axios';

async function createLabel(access_token, labelname) {
    try {
        const response = (await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
                labelListVisibility: "labelShow",
                messageListVisibility: "show",
                name: labelname
            }, { headers: { authorization: "Bearer " + access_token } })).data;
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export {createLabel};