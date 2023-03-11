import axios from "axios";

async function getMsgDetails(access_token, id){
    try {
        const msgDetails = (await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
                    headers: { authorization: "Bearer " + access_token }
                })).data;
        return msgDetails;
    } catch (error) {
        
    }
}

export {getMsgDetails};