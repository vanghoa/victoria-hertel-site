/** @type {import("prettier").Config} */
module.exports = {
    tabWidth: 4,
    singleQuote: true,
    trailingComma: 'es5', // or your default outside of /public
    printWidth: 80, // default for everything except public/
    overrides: [
        {
            files: 'public/**/*',
            options: {
                trailingComma: 'none',
                printWidth: 1000,
            },
        },
    ],
};
