import * as convict from 'convict';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

interface Config {
  server: {
    port: number;
    runSeeders: boolean;
    debugMode: boolean;
    targetLanguage: string;
  };
  db: {
    url: string;
  };
}

export const config = convict<Config>({
  db: {
    url: {
      doc: 'The access url for mongodb',
      format: String,
      default: null,
      env: 'MONGO_DB_ACCESS_URL',
    },
  },
});

convict.addParser({ extension: ['yml', 'yaml'], parse: yaml.load });
const envFilePath = './.env.yml';
if (fs.existsSync(envFilePath)) {
  config.loadFile(envFilePath);
}
config.validate({ allowed: 'strict' });
