import websocket from 'ws';
import { existsSync } from "fs";
import { IncomingMessage } from 'http';
import SessionsRepository from './Repository/SessionsRepository';
import BattleEyeSocketRelay from './Backend/BattleEyeSocketRelay';
import { NartConfig } from './NartConfig';
import WebRouter from './WebRouter';
import { Logger } from './Logger';

// input options
let args = process.argv.slice(2);
let socketsOnly = false;
let openBrowser = true;
let configPath = __dirname + '/../config.json';

if (args.includes('--help')) {
    console.log(
        `NART - Node Admin RCon Tool \n\n` +

        `Usage: node build/run_server.js [options] \n` +
        `Options: \n` +
        `    --help            | Show this help message \n` +
        `    --socket-only -s  | Runs the server sockets only, no webserver. \n` +
        `                      |     This is for running the server on a remote machine \n` +
        `                      |     Note you will need to serve the build directory yourself. \n` +
        `    --no-browser  -b  | Do not open the browser when running the server \n` +
        `    --config      -c  | [default: config.json] Sets the config file to use \n`
    );

    process.exit(0);
}

if (args.includes('--socket-only') || args.includes('-s')) {
    socketsOnly = true;
}

if (args.includes('--no-browser') || args.includes('-b')) {
    openBrowser = false;
}

if (args.includes('--config') || args.includes('-c')) {
    let index = args.indexOf('--config');
    if (index === -1) {
        index = args.indexOf('-c');
    }

    if (index !== -1) {
        let path = args[index + 1];

        if (path !== undefined && !existsSync(path)) {
            console.error('Config file not found: ' + path);
            process.exit(1);
        }

        if (path !== undefined) {
            configPath = path;
        }
    }
}

const config = NartConfig.config(configPath);

const wss = new websocket.Server({ port: config.port.websocket });

let router = new WebRouter();

router.app?.get('/',  router.onIndex.bind(router));
router.app?.get('/login',  router.onLoginGet.bind(router));
router.app?.post('/login', router.onLogin.bind(router));
router.app?.get('/logout', router.onLogout.bind(router));

router.app?.get('/invite/:id', router.onInviteGet.bind(router));
router.app?.post('/invite/:id', router.onInvitePost.bind(router));
router.app?.get('/reset/:id', router.onInviteGet.bind(router));
router.app?.post('/reset/:id', router.onInvitePost.bind(router));
router.app?.get('/resources/*', router.onResource.bind(router));

router.start(socketsOnly, openBrowser);

const logger = Logger.normalLogger('nart.log');
wss.on('connection', function connection(socket: websocket, req: IncomingMessage) {
    let token: string|null = null;

    logger.info('New websocket connection');

    let urlParams = new URLSearchParams(req.url?.replace(/^\/\?/, ''));

    token = urlParams.get('token') ?? null;

    if (token !== null) {
        let session = SessionsRepository.repo().getSessionByToken(token);

        if (session !== null) {
            try {
                (new BattleEyeSocketRelay(socket, session)).listenToWebsocket();
            } catch (error) {
                // log trace
                console.debug(error);
                logger.error(error as string);
                logger.error('Failed to create relay');
            }
        }
    }
});
