/*
 Copyright 2023 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

			https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as child_process from 'node:child_process';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),

    version: {
      name: child_process.execSync('git rev-parse HEAD').toString().trim(),
    },

    prerender: {
      handleHttpError: ({ path, message, stack }) => {
        // Handle the HTTP error here
        console.error(`HTTP error occurred: ${message}`);
        console.error(`Path: ${path}`);
        console.error(`Stack trace: ${stack}`);
        // Return a custom error page or fallback response
        return {
          message: 'An error occurred during prerendering.',
          // Add any other relevant properties
        };
      },
    },
  },
};

export default config;
