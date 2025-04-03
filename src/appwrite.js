import { Client, Account,Storage , OAuthProvider } from 'appwrite';

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;


if (!endpoint || !projectId) {
    throw new Error('Appwrite endpoint or project ID is not defined');
}

client
    .setEndpoint(endpoint)
    .setProject(projectId);


export { OAuthProvider }
export const account = new Account(client);
export const  storage = new Storage(client);
export const ID = { unique: () => crypto.randomUUID() };