import axios from 'axios';

async function getlabels(access_token) {
    try {
        let labels = (await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
            headers: {
                authorization: "Bearer " + access_token
            }
        })).data.labels;
        
        return labels;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export {getlabels};