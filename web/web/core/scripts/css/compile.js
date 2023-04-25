const log = require('./log');
const fs = require('fs');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const postcssHeader = require('postcss-header');
const postcssUrl = require('postcss-url');
const postcssPresetEnv = require('postcss-preset-env');
// cspell:ignore pxtorem
const postcssPixelsToRem = require('postcss-pxtorem');
const stylelint = require('stylelint');

module.exports = (filePath, callback) => {
  // Transform the file.
  fs.readFile(filePath, (err, css) => {
    postcss([
      postcssImport({
       plugins: [
         // On import, remove the comments from variables.pcss.css so they don't
         // appear as useless comments at the top files that import these
         // variables.
         postcss.plugin('remove-unwanted-comments-from-variables', (options) => {
           return css => {
             if (css.source.input.file.indexOf('variables.pcss.css') !== -1) {
               css.walk(node => {
                 if (node.type === 'comment') {
                   node.remove();
                 }
               });
             }
           };
         }),
       ],
      }),
      postcssPresetEnv({
        stage: 1,
        preserve: false,
        autoprefixer: {
          cascade: false,
          grid: 'no-autoplace',
        },
        features: {
          'blank-pseudo-class': false,
          'focus-visible-pseudo-class': false,
          'focus-within-pseudo-class': false,
          'has-pseudo-class': false,
          'image-set-function': false,
          'prefers-color-scheme-query': false,
        }
      }),
      postcssPixelsToRem({
          propList: [
            '*',
            '!background-position',
            '!border',
            '!border-width',
            '!box-shadow',
            '!border-top*',
            '!border-right*',
            '!border-bottom*',
            '!border-left*',
            '!border-start*',
            '!border-end*',
            '!outline*',
          ],
          mediaQuery: true,
          minPixelValue: 3,
      }),
      postcssHeader({
        header: `/*\n * DO NOT EDIT THIS FILE.\n * See the following change record for more information,\n * https://www.drupal.org/node/3084859\n * @preserve\n */\n`,
      }),
      postcssUrl({
        filter: '**/*.svg',
        url: 'inline',
        optimizeSvgEncode: true,
      })
    ])
    .process(css, { from: filePath })
    .then(result => {
        return stylelint.lint({
          code: result.css,
          fix: true
        });
    })
    .then(result => {
      callback(result.output);
    })
    .catch(error => {
      log(error);
      process.exitCode = 1;
    });
  });
};
