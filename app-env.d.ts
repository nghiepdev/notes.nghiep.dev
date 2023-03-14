declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'production' | 'development';
    PORT: number;
    APP_NAME: string;
    DETA_PROJECT_KEY: string;
  }
}
