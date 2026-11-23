/**
 * Spacing grid checks for app code. `spacing-grid` is core
 * `no-restricted-syntax` under this plugin's name, so its selectors in
 * eslint.config.mjs do not replace the `no-restricted-syntax` bans that
 * .eslintrc.js applies to the same files.
 */
'use strict';

module.exports = {
  meta: {
    name: 'design-system',
    version: '1.0.0',
  },
  rules: {
    'spacing-grid': require('eslint/use-at-your-own-risk').builtinRules.get(
      'no-restricted-syntax',
    ),
  },
};
