import axios from "axios";

async function transferLabel(access_token, msgids, labelids){
    try {
        const response = (await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify', {
            ids: msgids,
            addLabelIds: labelids
        }, { headers: { authorization: "Bearer " + access_token } })).data;
        return response;
    } catch (error) {
        
    }
}

export {transferLabel};