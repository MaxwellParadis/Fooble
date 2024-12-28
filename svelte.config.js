// import adapter from '@sveltejs/adapter-auto';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
// 	// Consult https://svelte.dev/docs/kit/integrations
// 	// for more information about preprocessors
// 	preprocess: vitePreprocess(),

// 	kit: {
// 		adapter: adapter({
// 			pages: 'foobleServer/dist', // Specify the output directory
// 		}),
// 	},
// };

// export default config;

import adapter from '@sveltejs/adapter-static';

export default {
    kit: {
        adapter: adapter({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'foobleServer/dist',
            assets: 'foobleServer/dist',
            fallback: null,
            precompress: false,
            strict: true
        })
    }
};
