import { unlinkSync, writeFileSync } from 'fs';
import { NartConfig, DefaultNartConfig, TNartConfig } from '../../src/NartConfig';

describe('Test NartConfig', () => {
    test('NartConfig.default() returns the default config', () => {
        expect(JSON.parse(JSON.stringify(NartConfig.default()))).toEqual(DefaultNartConfig);
    });

    test('NartConfig.schema() returns the schema', () => {
        let schema = NartConfig.schema();
        expect(schema).toBeDefined();
        expect(schema.properties).toBeDefined();
        expect(schema.properties.auth).toBeDefined();
        expect(schema.properties.storage).toBeDefined();
        expect(schema.properties.logging).toBeDefined();
        expect(schema.properties.hostname).toBeDefined();
    });

    test('NartConfig.default() passes validation', () => {
        expect(() => {
            NartConfig.default();
        }).not.toThrow();
    });

    test('NartConfig loads the config from the file', () => {
        let config = JSON.parse(JSON.stringify(NartConfig.default()));
        config.storage.windows.path = 'test';

        writeFileSync('/tmp/nart.config.json', JSON.stringify(config));

        let config2 = new NartConfig('/tmp/nart.config.json').get();

        expect(config2.port).toEqual(config.port);
        expect(config2.auth).toEqual(config.auth);
        expect(config2.logging).toEqual(config.logging);

        expect(config2.storage.windows.path).toEqual('test');
    });

    test('NartConfig throws an error if the config is invalid', () => {
        let config = JSON.parse(JSON.stringify(NartConfig.default()));
        config.port.http = -1;

        writeFileSync('/tmp/nart.config.json', JSON.stringify(config));

        expect(() => {
            new NartConfig('/tmp/nart.config.json');
        }).toThrow('Invalid config.json: data.port.http should be >= 1');
    });

    test('NartConfig throws a required object is missing', () => {
        let config = JSON.parse(JSON.stringify(NartConfig.default()));

        delete config.auth;

        writeFileSync('/tmp/nart.config.json', JSON.stringify(config));

        expect(() => {
            new NartConfig('/tmp/nart.config.json');
        }).toThrow('Invalid config.json: data should have required property \'auth\'');
    });

    test('NartConfig throws if the file is missing', () => {
        expect(() => {
            new NartConfig('/tmp/nart.config.json');
        }).toThrow('Config file not found: /tmp/nart.config.json');
    });

    test('NartConfig.instance() returns the same instance', () => {
        writeFileSync('/tmp/nart.config.json', JSON.stringify(NartConfig.default()));
        let config = NartConfig.config('/tmp/nart.config.json');
        let config2 = NartConfig.instance().get();

        expect(config).toBe(config2);
    });

    test('NartConfig does not allow unix to have regKey set to true', () => {
        writeFileSync('/tmp/nart.config.json', JSON.stringify(NartConfig.default()));
        let config = NartConfig.config('/tmp/nart.config.json');
        let config2 = NartConfig.instance().get();

        expect(config).toBe(config2);
    });

    test('NartConfig cleans up paths', () => {
        let config = JSON.parse(JSON.stringify(NartConfig.default())) as TNartConfig;
        config.storage.windows.path = '//test/';
        config.storage.windows.dbKey.path = 'C:/test//.pw';
        config.storage.unix.path = '//test/';
        config.storage.unix.dbKey.path = '///test///.pw';

        writeFileSync('/tmp/nart.config.json', JSON.stringify(config));

        let config2 = new NartConfig('/tmp/nart.config.json').get();

        expect(config2.storage.windows.path).toEqual('/test');
        expect(config2.storage.unix.path).toEqual('/test');
        expect(config2.storage.windows.dbKey.path).toEqual('C:/test/.pw');
        expect(config2.storage.unix.dbKey.path).toEqual('/test/.pw');
    });

    test('NartConfig replaces variables from process.env', () => {
        process.env.TEST = 'nart_test';
        let config = JSON.parse(JSON.stringify(NartConfig.default())) as TNartConfig;
        config.storage.windows.path = '%TEST%';
        config.storage.unix.path = '%HOME%';

        writeFileSync('/tmp/nart.config.json', JSON.stringify(config));

        let config2 = new NartConfig('/tmp/nart.config.json').get();

        expect(config2.storage.windows.path).toEqual('nart_test');
        expect(config2.storage.unix.path).toEqual(process.env.HOME);
    });
});

// cleanup
afterEach(() => {
    try {
        unlinkSync('/tmp/nart.config.json');
    } catch (e) {
        // ignore
    }
});
