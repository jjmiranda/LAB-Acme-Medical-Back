import express from "express";
import logger from "../logger";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import CustomCredential from "../templates/custom-credential";
import EventsCredential from "../templates/events-credential";
import MedicalCredential from "../templates/medical-credential";
import StatementCredential from "../templates/statement-credential";
import HtmlCredentialCreatedSuccessful from "../templates/html/credential-created-successful";
import DIDReceivedNext from "../templates/html/DID-received-next";
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

        this.express.get("/custom-step1", async (req, res, next) => {
            let html: string = '';
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;

            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            this.socket.emit('shared-identity-custom', { content: sub, to: query.state });
            html = DIDReceivedNext.replace('{subject_did}', sub);
            res.status(200).send(html);
        });

        this.express.get("/custom-step2", async (req, res, next) => {

            logger.info(`El req claims: ${req.query.claims} `);
            logger.info(`El req sub: ${req.query.sub} `);

            const sub = req.query.sub as string;
            const claims = req.query.claims;
            const socket_id = req.query.state;
            console.log(typeof(claims));

            let html: string = '';
            const { query } = req;
            //const claims = {llave: 'Valor de la llave 1', llave2: 'Valor de la llave 2'};
            const credentialTemplate = new CustomCredential(sub, JSON.parse(claims as string));
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
            this.socket.emit('shared-identity-custom-2', { content: fileName, to: socket_id });
            html = HtmlCredentialCreatedSuccessful.replace('{filename}', fileName);
            res.status(200).send(html);
        });

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

        this.express.get("/medical", async (req, res, next) => {
            let html: string = '';
            // let allClaims: any = {};
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;

            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            // const verifiableCredentials = decodedJWT.presentation.verifiableCredential;
            // for (const credential of verifiableCredentials) {
            //     for (const claim in credential.credentialSubject) {
            //         if (claim === '@id' || claim === '@type') continue;
            //         allClaims[claim] = credential.credentialSubject[claim];
            //     }
            // }

            const name = decodedJWT.presentation.verifiableCredential[0].credentialSubject.name;
            const credentialTemplate = new MedicalCredential(sub, name);
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

        this.express.get("/statement", async (req, res, next) => {
            let html: string = '';
            const { query } = req;
            if (!query.access_token) { res.status(401).send('<h1>access_token not satisfied</h1>'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const sub = decodedJWT?.sub;

            logger.info(`Lo que llega del decodedJWT: ${JSON.stringify(decodedJWT)} `);

            const statement = 'La empresa con el DID del subjectc indicado autoriza a esta identidad a acceder a nuestras instalaciones sin ningún problema';
            const credentialTemplate = new StatementCredential(sub, statement);
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
            this.socket.emit('vc-downloaded', { content: 'hola', to: query.state });
            const file = `${process.env.NODE_PATH}/public/${query.fileName}.json`;
            res.setHeader('Content-type', 'application/vp+json');
            res.download(file, `${query.fileName}.vp`);
        });
    }
}

export default new Issuer().express;