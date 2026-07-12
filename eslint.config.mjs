// Flat ESLint config (ESLint 9). Focused on real correctness bugs, not style —
// type errors are caught by `pnpm typecheck`, formatting is not linted here.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
  {
    ignores: [
      'node_modules/**', '.next/**', 'drizzle/**', 'mobile/**',
      'next-env.d.ts', '**/*.config.*', 'scripts/**',
    ],
  },
  // Unknown disable-directives (from before this config) must not be hard errors.
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn',
      // Style / covered by tsc — off to keep the signal on real bugs.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],

      // Real-bug rules — keep as errors.
      'no-cond-assign': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-fallthrough': 'error',
      'no-constant-binary-expression': 'error',
      'no-self-compare': 'error',
      'no-unsafe-negation': 'error',
      'require-atomic-updates': 'off',
      'eqeqeq': ['warn', 'smart'],
      // Opinionated best-practice (attach `cause` on rethrow) — surface as a
      // warning, don't fail the build on it.
      'preserve-caught-error': 'warn',
    },
  },
)
