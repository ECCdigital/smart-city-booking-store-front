// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // JS files were linted with the bare `no-unused-vars`, so the leading
  // underscore that marks a deliberately unused binding, and the rest-sibling
  // idiom that drops a key from an object, both counted as errors there while
  // the TypeScript rule already allowed them. Same options, same convention.
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        vars: 'all',
        varsIgnorePattern: '^_',
      }],
    },
  },
)
