import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

import type {GetHtmlClientOptions} from './types';
import {META_TITLE, META_DESCRIPTION, EXPIRE_IN} from './constants';

export function getClientHtml(options: GetHtmlClientOptions) {
  let clientHtml = fs
    .readFileSync(path.resolve(__dirname, '../templates/index.html'))
    .toString()
    .replace(/{title_placeholder}/g, META_TITLE)
    .replace(/{title_no_markup_placeholder}/g, META_TITLE.replace(/[{}]/g, ''))
    .replace(/{app_name_placeholder}/g, process.env.APP_NAME)
    .replace(/{description_placeholder}/g, META_DESCRIPTION)
    .replace(/{expire_in_placeholder}/g, JSON.stringify(EXPIRE_IN))
    .replace(/{about_url_placeholder}/g, process.env.APP_ABOUT_URL)
    .replace(
      '{form_placeholder}',
      fs
        .readFileSync(path.resolve(__dirname, '../templates/form.html'))
        .toString(),
    )
    .replace(
      '{modal_placeholder}',
      fs
        .readFileSync(path.resolve(__dirname, '../templates/modal.html'))
        .toString(),
    );

  if (options.shouldReplace) {
    clientHtml = clientHtml.replace(
      'vue.esm-browser.js',
      'vue.esm-browser.prod.js',
    );
  }

  return clientHtml;
}
