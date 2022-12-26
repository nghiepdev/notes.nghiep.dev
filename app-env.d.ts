declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'production' | 'development';
    APP_NAME: string;
    APP_DETA_PROJECT_KEY: string;
  }
}
