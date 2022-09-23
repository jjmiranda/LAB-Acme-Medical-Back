import express from "express";
import logger from "../logger";
import Issuer from "./issuer";
import Verifier from "./verifier";

// import Identifiers from "./identifiers";

class Routes {

    public express: express.Application;

    constructor() {
        this.express = express();
        this.routes();
    }

    private routes(): void {
        logger.info('Register routes');
        this.express.use("/issuer", Issuer);
        this.express.use("/verifier", Verifier);
    }
}

export default new Routes().express;