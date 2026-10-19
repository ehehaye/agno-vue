import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.claude/**'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/vue2-recommended'],
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      semi: ['error', 'never'],
      'sort-imports': [
        'error',
        { ignoreDeclarationSort: true, ignoreMemberSort: false },
      ],
      indent: ['error', 2],
      'vue/script-indent': ['error', 2, { switchCase: 1 }],
      'object-curly-spacing': ['error', 'always'],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      indent: 'off',
    },
  },
]
