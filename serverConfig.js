import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;
const CLIENTID = process.env.CLIENTID;
const CLIENTSECRET = process.env.CLIENTSECRET;
const CLIENTEMAIL = process.env.CLIENTEMAIL;
const REDIRECTURI = process.env.REDIRECTURI;

export {PORT, CLIENTID, CLIENTSECRET, CLIENTEMAIL, REDIRECTURI};