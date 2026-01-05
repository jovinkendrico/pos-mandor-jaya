export default {
    plugins: {
        '@tailwindcss/postcss': {},
        'postcss-preset-env': {
            stage: 1,
            features: {
                'oklch-function': true,
                'custom-properties': true,
            },
            browsers: 'chrome 50',
        },
        autoprefixer: {},
        cssnano: {
            preset: 'default',
        },
    },
};
