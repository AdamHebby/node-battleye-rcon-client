import { existsSync, writeFileSync } from 'fs';
import { NartConfig } from '../NartConfig';

if (existsSync(__dirname + '/../../config.json')) {
    process.exit(0);
}

let schema = NartConfig.schema();
let defaultConfig = NartConfig.default();

defaultConfig['$schema'] = './config.schema.json';

writeFileSync(__dirname + '/../../config.json', JSON.stringify(defaultConfig, undefined, 4));
writeFileSync(__dirname + '/../../config.schema.json', JSON.stringify(schema, undefined, 4));
