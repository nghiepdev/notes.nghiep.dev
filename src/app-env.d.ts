declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'production' | 'development';
    PORT: number;
    APP_DETA_PROJECT_KEY?: string;
    APP_NAME: string;
    APP_DETA_BASE: string;
    APP_ABOUT_URL: string;
  }
}
