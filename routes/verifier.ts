import express from "express";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from "../logger";
import { io, Socket } from 'socket.io-client';

dotenv.config();

class Verifier {

    public express: express.Application;
    public socket: Socket;

    constructor() {
        this.express = express();
        this.socket = io(process.env.WS_SERVER as string);
        this.routes();
    }

    private routes(): void {

        this.express.get("/share", async (req, res, next) => {
            const { query } = req;
            if (!query.access_token) { res.status(401).send('access_token not satisfied'); return; }
            const decodedJWT: any = jwt.decode(query.access_token as string);
            const credential = decodedJWT.presentation.verifiableCredential;
            this.socket.emit('shared-credential', { content: credential, to: query.state });
            res.status(200).send('<h1>Gracias. Acabas de compartir tu credencial</h1>');
        });
    }
}

export default new Verifier().express;