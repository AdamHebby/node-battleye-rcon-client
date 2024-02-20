import websocket from 'ws';
import fs from "fs";
import { open } from 'openurl';
import { exec } from 'child_process';
import { Request, Response } from 'express';
import express from 'express';
import session, { Session } from 'express-session';
import bodyParser from 'body-parser';
import multer from 'multer';
import { NartUser, Permissions } from './Models/NartUser';
import NartRepository from './Repository/NartRepository';
// import BattleEyeSocketRelay from './Backend/BattleEyeSocketRelay';
import cookieParser from 'cookie-parser';
import { IncomingMessage } from 'http';
import Database from 'better-sqlite3';
import DatabaseManager from './Repository/DatabaseManager';
import SessionsRepository from './Repository/SessionsRepository';
import BattleEyeSocketRelay from './Backend/BattleEyeSocketRelay';
import { NartSession } from './Models/Session';

// input options
let args = process.argv.slice(2);
let socketsOnly = false;
let openBrowser = true;
let serverPort = 3000;

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
        `    --port        -p  | [default: 3000] Sets the port for the server to serve webpages`
    );

    process.exit(0);
}

if (args.includes('--socket-only') || args.includes('-s')) {
    socketsOnly = true;
}

if (args.includes('--no-browser') || args.includes('-b')) {
    openBrowser = false;
}

if (args.includes('--port') || args.includes('-p')) {
    let index = args.indexOf('--port');
    if (index === -1) {
        index = args.indexOf('-p');
    }

    if (index !== -1) {
        let port = args[index + 1];
        if (port !== undefined) {
            let portNumber = parseInt(port);
            if (portNumber > 0 && portNumber < 65535) {
                serverPort = portNumber;
            }
        }
    }
}

interface NartCookies {
    nart_socket_token: string;
}

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any())

const SqliteStore = require("better-sqlite3-session-store")(session)
let sessionStore = new SqliteStore({
    client: DatabaseManager.main(),
    expired: {
        clear: true,
        intervalMs: 900000 //ms = 15min
    }
});

// setup express sessions
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'nart_secret_on.' + (process.env.NAME ?? 'Unknown'),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
  store: sessionStore,
}))

let nartRepo = NartRepository.repo();

if (nartRepo.count() === 0) {
    console.log('No users found, generating default admin user');
    nartRepo.generate('admin', Permissions.ADMIN, 'admin');
}

const wss = new websocket.Server({ port: 12639 });

wss.on('connection', function connection(socket: websocket, req: IncomingMessage) {
    let headerCookies = req.headers['cookie'];
    let token: string|null = null;

    if (headerCookies !== undefined && headerCookies !== null) {
        let cookies: { [key: string]: string } = {}; // Add index signature
        headerCookies.split(';').forEach(function (cookie) {
            let parts = cookie.split('=', 2);

            if (parts.length === 2) {
                cookies[parts[0].trim()] = decodeURI(parts[1]);
            }
        });

        if (cookies.nart_socket_token !== undefined) {
            token = cookies.nart_socket_token;
        }
    }

    let session: NartSession|null = null;

    if (token !== null) {
        session = SessionsRepository.repo().getSessionByToken(token);

        if (token !== null && session !== null) {
            try {
                (new BattleEyeSocketRelay(socket, session)).listenToWebsocket();
            } catch (error) {
                console.error(error);
            }
        }
    }
});


app.get('/', (req: Request, res: Response) => {
    let session = req.session as NartSession;
    let cookies = req.cookies as NartCookies;

    if (session.isLoggedIn !== true) {
        res.redirect('/login');
        return;
    }

    res.sendFile(__dirname + '/index.html');
});

function jwt(length: number = 256) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
    }

    return password;
}

app.get('/login', (req: Request, res: Response) => {
    let session = req.session as NartSession;
    if (session.isLoggedIn === true && session.userId !== null) {
        let user = NartRepository.repo().getUserById(session.userId);

        if (user !== null) {
            res.redirect('/');
            return;
        }

        session.isLoggedIn = false;
        session.userId = null;
    }

    let socketToken = jwt(64);
    res.cookie('nart_socket_token', socketToken);
    session.socketToken = socketToken;
    session.save();

    res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req: Request, res: Response) => {
    let session = req.session as NartSession;
    let post    = req.body as { username: string, password: string };

    if (post.username === undefined || post.password === undefined || post.username.trim() === '' || post.password.trim() === '') {
        res.status(401).send('Invalid username or password');
        return;
    }

    let repo = NartRepository.repo();
    let user: NartUser|null = repo.login(post.username, post.password);

    if (user !== null) {
        session.userId = user.id;
        session.isLoggedIn = true;
        session.save();
        res.redirect('/');
        return;
    }

    res.status(401).redirect('/login');
});

app.get('/invite/:id', (req: Request, res: Response) => {
    let session = req.session as NartSession;

    if (session.isLoggedIn === true) {
        res.redirect('/');
        return;
    }

    let user = NartRepository.repo().getUserByInviteLink(req.params.id);

    if (user === null) {
        res.status(404).send('Not found');
        return;
    }

    res.sendFile(__dirname + '/invite.html');
    return;
});

app.post('/invite/:id', (req: Request, res: Response) => {
    let session = req.session as NartSession;
    let repo = NartRepository.repo();
    let user = repo.getUserByInviteLink(req.params.id);

    if (user === null) {
        res.status(404).send('Not found');
        return;
    }

    let post = req.body as { password: string };

    if (post.password === undefined || post.password.trim() === '') {
        res.status(401).send('Invalid username or password');
        return;
    }

    repo.takeInviteLink(user, post.password);

    session.isLoggedIn = true;
    session.userId = user.id;
    session.save();
    res.redirect('/');
});

app.get('/logout', (req: Request, res: Response) => {
    let session = req.session as NartSession;
    // @ts-ignore
    session.isLoggedIn = false;
    session.userId = null;
    session.save();
    res.redirect('/login');
});

app.get('/resources/*', (req: Request, res: Response) => {
    if (fs.existsSync(__dirname + '/..' + req.url) === false) {
        res.status(404).send('Not found');
        return;
    }

    let header: string = 'image/png';

    if (req.url.endsWith('.css')) header = 'text/css';
    if (req.url.endsWith('.js')) header = 'text/javascript';
    if (req.url.endsWith('.json')) header = 'application/json';
    if (req.url.endsWith('.html')) header = 'text/html';
    if (req.url.endsWith('.jpg')) header = 'image/jpg';
    if (req.url.endsWith('.png')) header = 'image/png';

    res.setHeader("Content-Type", header);
    res.status(200).send(
        fs.readFileSync(__dirname + '/..' + req.url)
    );
});

if (socketsOnly === false) {
    app.listen(serverPort, () => {
        console.log(`[server]: Server is running at http://localhost:${serverPort}`);
    });

    if (openBrowser === true) {
        if ('WSLENV' in process.env) {
            exec(`cmd.exe /C start http://localhost:${serverPort}`);
        } else {
            open(`http://localhost:${serverPort}`);
        }
    }
}
