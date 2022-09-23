import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import EventsCredential from "../templates/events-credential";
import HtmlCredentialCreatedSuccessful from "../templates/html/credential-created-successful";
import { Credential } from '@kaytrust/ethereum';
import { verifyData } from "../utils/credentials";
import { uuid } from 'uuidv4';
import { io, Socket } from 'socket.io-client';

import fs = require('fs');

dotenv.config();

class Issuer {

    public express: express.Application;
    public socket: Socket;

    constructor() {
        this.express = express();
        this.socket = io(process.env.WS_SERVER as string);
        this.routes();
    }

    private routes(): void {

        this.express.get("/event", async (req, res, next) => {
            const { query } = req;
            let html;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;
            const credentialTemplate = new EventsCredential(sub);
            const newCredential = await Credential.createFromClaims(credentialTemplate);
            const verifyDataResult = await verifyData(newCredential.verifiableObject);
            if (!verifyDataResult.state) { res.status(400).send('<h1>can`t created credential</h1>'); return; }
            const newCredentialWithProof = verifyDataResult.verifiableObjectWithProof;
            const fileName = uuid();
            try {
                fs.writeFileSync(process.env.NODE_PATH + `/public/${fileName}.json`, newCredentialWithProof, 'utf8');
                logger.info(`Create credential: ${newCredentialWithProof} - ${fileName}`);
            } catch (err) { 
                res.status(400).send('<h1>can`t created credential</h1>'); 
                return; 
            }
            this.socket.emit('shared-identity', { content: fileName, to: query.state });
            html = HtmlCredentialCreatedSuccessful.replace('{filename}', fileName);
            res.status(200).send(html);
        });

        this.express.get("/download-credential", async (req, res, next) => {
            const { query } = req;
            if (!query.fileName) { res.status(401).send('<h1>fileName not satisfied</h1>'); return; }
            const file = `${process.env.NODE_PATH}/public/${query.fileName}.json`;
            res.setHeader('Content-type', 'application/vp+json');
            res.download(file, `${query.fileName}.vp`);
        });
    }
}

export default new Issuer().express;