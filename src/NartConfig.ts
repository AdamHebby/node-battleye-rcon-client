import { S } from 'fluent-json-schema';
import ajv from 'ajv';
import { existsSync, readFileSync } from 'fs';

declare type TNartConfigStoragePath = {
    path: string,
    dbKey: {
        path: string,
        regKey?: false|undefined|null
    }
}
declare type TNartConfigStorageReg = {
    path: string,
    dbKey: {
        path?: undefined|null,
        regKey: true
    }
}

declare type TNartConfig = {
    $schema?: string,
    hostname: string,
    port: {
        http: number;
        https?: number|undefined;
        websocket: number;
    },
    storage: {
        windows: TNartConfigStoragePath|TNartConfigStorageReg,
        unix: TNartConfigStoragePath
    },
    auth: {
        enabled: boolean,
        defaultAdmin: {
            username: string,
            password?: string|null|undefined,
            enabled: boolean
        },
        dbKeyLength: number,
        sessionSecret: string,
        secureCookie: boolean,
        jwt: {
            length: number,
            name: string
        }
    },
    logging: {
        level: string,
        path: string
    },
};

const defaultConfig: TNartConfig = {
    hostname: 'localhost',
    port: {
        http: 80,
        https: 443,
        websocket: 12639
    },
    storage: {
        windows: {
            path: "%APPDATA%/.nart/",
            dbKey: {
                regKey: true
            }
        },
        unix: {
            path: "%HOME%/.nart/",
            dbKey: {
                path: "%HOME%/.nart/.nart",
                regKey: false
            }
        }
    },
    auth: {
        enabled: true,
        defaultAdmin: {
            username: 'admin',
            enabled: false
        },
        dbKeyLength: 256,
        sessionSecret: 'nart_secret_on.' + (process.env.NAME ?? 'Unknown'),
        secureCookie: false,
        jwt: {
            length: 64,
            name: 'nart_socket_token'
        }
    },
    logging: {
        level: 'info',
        path: '/var/log/nart.log'
    }
};

const NartConfigSchema = S
    .object()
    .id('nart-config')
    .additionalProperties(false)
    .title('NartConfig')
    .description('Nart configuration')
    .prop('hostname', S.string())
    .prop('$schema', S.string().format('uri-reference').default('./config.schema.json'))
    .prop('port', S.object().required(['http', 'websocket'])
        .prop('http', S.number().minimum(1).maximum(65535))
        .prop('https', S.number().minimum(1).maximum(65535))
        .prop('websocket', S.number().minimum(1).maximum(65535))
    )
    .definition('storage-conf-win', S.object().id('#storage-conf-win').required(['path', 'dbKey'])
        .prop('path', S.string().format('uri-reference'))
        .prop('dbKey', S.oneOf([
            S.object().required(['path'])
                .prop('path', S.string().format('uri-reference'))
                .prop('regKey', S.oneOf([S.null(), S.const(false)])),
            S.object().required(['regKey'])
                .prop('path', S.oneOf([S.null(), S.string().format('uri-reference')]))
                .prop('regKey', S.const(true))
        ]))
    )
    .definition('storage-conf-unix', S.object().id('#storage-conf-unix').required(['path', 'dbKey'])
        .prop('path', S.string().format('uri-reference'))
        .prop('dbKey',
            S.object().required(['path'])
                .prop('path', S.string().format('uri-reference'))
                .prop('regKey', S.oneOf([S.null(), S.const(false)])),
        )
    )
    .prop('storage', S.object().required(['windows', 'unix'])
        .prop('windows', S.ref('#storage-conf-win'))
        .prop('unix', S.ref('#storage-conf-unix'))
    )
    .prop('auth', S.object().required(['enabled', 'defaultAdmin', 'dbKeyLength', 'sessionSecret', 'secureCookie', 'jwt'])
        .prop('enabled', S.boolean())
        .prop('defaultAdmin', S.object().required(['username', 'enabled'])
            .prop('username', S.string())
            .prop('password', S.oneOf([S.string(), S.null()]))
            .prop('enabled', S.boolean())
        )
        .prop('dbKeyLength', S.number().minimum(8).maximum(4096))
        .prop('sessionSecret', S.string())
        .prop('secureCookie', S.boolean())
        .prop('jwt', S.object().required(['length', 'name'])
            .prop('length', S.number().minimum(8).maximum(512))
            .prop('name', S.string())
        )
    )
    .prop('logging', S.object().required(['level', 'path'])
        .prop('level', S.string())
        .prop('path', S.string())
    )
    .required(['hostname', 'port', 'storage', 'auth', 'logging']);

class NartConfig {
    private static _instance: NartConfig;
    private config: TNartConfig;

    constructor(public path: string = __dirname + '/../config.json') {
        if (!existsSync(this.path)) {
            throw new Error('Config file not found: ' + this.path);
        }

        let config = JSON.parse(readFileSync(this.path).toString());
        let validator = new ajv();
        let valid = validator.validate(NartConfigSchema.valueOf(), config);

        if (!valid) {
            throw new Error('Invalid config.json: ' + validator.errorsText());
        }

        this.config = config;

        this.config.storage.windows.dbKey.path = this.cleanPath(this.config.storage.windows.dbKey.path);
        this.config.storage.windows.path       = this.cleanPath(this.config.storage.windows.path) as string;
        this.config.storage.unix.path          = this.cleanPath(this.config.storage.unix.path) as string;
        this.config.storage.unix.dbKey.path    = this.cleanPath(this.config.storage.unix.dbKey.path) as string;

        if (this.config.storage.unix.path.trim() === '') {
            throw new Error('Invalid storage path');
        }

        if (this.config.storage.windows.path.trim() === '') {
            throw new Error('Invalid storage path');
        }

        if (this.config.storage.windows.dbKey.path !== undefined && this.config.storage.windows.dbKey.path !== null && this.config.storage.windows.dbKey.path.trim() === '') {
            throw new Error('Invalid storage path');
        }

        if (this.config.storage.unix.dbKey.path !== undefined && this.config.storage.unix.dbKey.path !== null && this.config.storage.unix.dbKey.path.trim() === '') {
            throw new Error('Invalid storage path');
        }
    }

    public static config(path?: string): TNartConfig {
        if (NartConfig._instance === undefined || (path !== undefined && path !== NartConfig._instance.path)) {
            NartConfig._instance = new NartConfig(path);
        }

        return NartConfig._instance.config;
    }

    public static instance(): NartConfig {
        if (NartConfig._instance === undefined) {
            NartConfig._instance = new NartConfig();
        }

        return NartConfig._instance;
    }

    public getStorage(): TNartConfigStoragePath|TNartConfigStorageReg {
        if (process.platform === 'win32') {
            return NartConfig.config().storage.windows as TNartConfigStoragePath|TNartConfigStorageReg;
        }

        return NartConfig.config().storage.unix as TNartConfigStoragePath;
    }

    public static schema(): object {
        return NartConfigSchema.valueOf() as object;
    }

    public static default(): TNartConfig {
        return defaultConfig;
    }

    public get(): TNartConfig {
        return this.config;
    }

    private cleanPath(path: string|null|undefined): string|null|undefined {
        return path === undefined || path === null ? path : path
            .replace(/%(.*?)%/g, (match: string, p1: string) => process.env[p1] ?? '')
            .replace(/\/{2,}/g, '/')
            .trimEnd()
            .replace(/\/$/, '');
    }
}

export {
    NartConfig,
    TNartConfig,
    defaultConfig as DefaultNartConfig,
    TNartConfigStoragePath,
    TNartConfigStorageReg
};
