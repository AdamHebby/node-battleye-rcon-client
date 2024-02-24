import https from 'https';
import fs from "fs";
import { open } from 'openurl';
import { exec } from 'child_process';
import { Request, Response } from 'express';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import multer from 'multer';
import { NartUser, Permissions } from './Models/NartUser';
import NartRepository from './Repository/NartRepository';
import cookieParser from 'cookie-parser';
import DatabaseManager from './Repository/DatabaseManager';
import { NartSession } from './Models/Session';
import { NartConfig } from './NartConfig';
import winston from 'winston';
import { Logger } from './Logger';

class WebRouter
{
    public app: express.Application | undefined;
    private adminStartLink: string | null = null;
    private logger: winston.Logger;

    constructor() {
        this.logger = Logger.normalLogger('nart.log');
        this.setup();
        this.buildDefaultUser();
    }

    public start(socketsOnly: boolean = false, openBrowser: boolean = true): void
    {
        let config = NartConfig.config();

        if (socketsOnly) {
            return;
        }

        let launchUrl = `http://${config.hostname}:${config.port.http}`;

        if (config.port.https !== undefined) {
            launchUrl = `https://${config.hostname}:${config.port.https}`;

            https.createServer({
                key: fs.readFileSync(__dirname + '/ssl.key'),
                cert: fs.readFileSync(__dirname + '/ssl.crt')
            }, this.app).listen(config.port.https, () => {
                this.logger.info(`[server ${config.port.https}]: Server is running at ${launchUrl}`);
            });
        }

        this.app?.listen(config.port.http, () => {
            this.logger.info(`[server]: Server is running at http://${config.hostname}:${config.port.http}`);
        });

        if (this.adminStartLink !== null) {
            launchUrl = launchUrl + '/reset/' + this.adminStartLink;
        }

        if (!openBrowser) {
            return;
        }

        if ('WSLENV' in process.env) {
            exec(`cmd.exe /C start ${launchUrl}`);
        } else {
            open(`${launchUrl}`);
        }
    }

    private setup(): void
    {
        const app = express();
        let config = NartConfig.config();

        app.use(cookieParser());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(multer().any());

        // TODO: Fix this
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const SqliteStore = require("better-sqlite3-session-store")(session);
        let sessionStore = new SqliteStore({
            client: DatabaseManager.main(),
            expired: {
                clear: true,
                intervalMs: 900000 //ms = 15min
            }
        });

        // setup express sessions
        app.set('trust proxy', 1); // trust first proxy
        app.use(session({
            secret: config.auth.sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: config.auth.secureCookie },
            store: sessionStore,
        }));

        app.use(this.authMiddleware);

        app.use(Logger.winstonHttpErrorLogger());
        app.use(Logger.winstonHttpLogger());

        app.use(this.onAny);
        app.use(this.onError);

        this.app = app;
    }

    private authMiddleware(req: Request, res: Response, next: () => void): void
    {
        let session = req.session as NartSession;

        if (session.isLoggedIn === false || session.userId === null || session.userId === undefined) {
            next();
            return;
        }

        let user = NartRepository.repo().getUserById(session.userId);

        if (user === null) {
            session.isLoggedIn = false;
            session.userId = null;
            session.save();
            next();
            return;
        }

        next();
    }

    public onIndex(req: Request, res: Response): void
    {
        if (this.checkAuth(req) !== true) {
            res.redirect('/login');
            return;
        }

        this.loadHtml(res, 'index');
    }

    public onLogin(req: Request, res: Response): void
    {
        let username = req.body.username ?? null;
        let password = req.body.password ?? null;

        if (username === null || password === null) {
            res.status(400);
            this.loadHtml(res, 'login');
            return;
        }

        let user = NartRepository.repo().login(username, password);

        if (user === null) {
            res.status(401);
            this.loadHtml(res, 'login');
            return;
        }

        this.loginUser(req, res, user);
        res.redirect('/');
    }

    public onLogout(req: Request, res: Response): void
    {
        let session = req.session as NartSession;
        session.isLoggedIn = false;
        session.userId = null;
        session.save();
        res.redirect('/login');
    }

    public onLoginGet(req: Request, res: Response): void
    {
        if (this.checkAuth(req) === true) {
            res.redirect('/');
            return;
        }

        this.loadHtml(res, 'login');
    }

    public onInviteGet(req: Request, res: Response): void
    {
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

        this.loadHtml(res, 'invite');
    }

    public onInvitePost(req: Request, res: Response): void
    {
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

        this.loginUser(req, res, user);

        res.redirect('/');
    }

    public onError(err: string, req: Request, res: Response, next: () => void): void
    {
        next();
    }

    public onAny(req: Request, res: Response, next: () => void): void
    {
        if (next) {
            next();
        }
    }

    private checkAuth(req: Request): boolean
    {
        let session = req.session as NartSession;

        return session.isLoggedIn === true &&
            session.userId !== null &&
            session.userId !== undefined &&
            session.socketToken !== null &&
            session.socketToken !== undefined &&
            req.cookies.hasOwnProperty(NartConfig.config().auth.jwt.name) &&
            session.socketToken === req.cookies[NartConfig.config().auth.jwt.name] &&
            session.cookie !== undefined;
    }

    public onResource(req: Request, res: Response): void
    {
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
    }

    private loginUser(req: Request, res: Response, user: NartUser): void
    {
        let config  = NartConfig.config();
        let session = req.session as NartSession;
        session.userId = user.id;
        session.isLoggedIn = true;

        let socketToken = this.token(config.auth.jwt.length);
        res.cookie(config.auth.jwt.name, socketToken);
        session.socketToken = socketToken;

        session.save();
    }

    private token(length: number = 256) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }

        return password;
    }


    private loadHtml(res: Response, filename: string): void
    {
        res.sendFile(__dirname + `/pages/${filename}.html`);
    }

    private buildDefaultUser(): void
    {
        let config = NartConfig.config();

        if (!config.auth.enabled || !config.auth.defaultAdmin.enabled) {
            return;
        }

        let nartRepo = NartRepository.repo();
        if (nartRepo.count() > 0) {
            return;
        }

        this.logger.info(`No users found, generating default "${config.auth.defaultAdmin.username}" user`);

        let admin = nartRepo.generate(
            config.auth.defaultAdmin.username,
            Permissions.ADMIN,
            config.auth.defaultAdmin.password ?? null
        );

        if (config.auth.defaultAdmin.password === null || config.auth.defaultAdmin.password === '' || config.auth.defaultAdmin.password === undefined) {
            this.adminStartLink = nartRepo.getInviteLinkByUser(admin);
        }
    }
}

export default WebRouter;
