import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;
const CLIENTID = process.env.CLIENTID;
const CLIENTSECRET = process.env.CLIENTSECRET;

export {PORT, CLIENTID, CLIENTSECRET};