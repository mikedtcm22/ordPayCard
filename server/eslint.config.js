import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  {
    ignores: ['dist/', 'node_modules/', '*.js', '**/__tests__/**', '**/*.test.*', '**/*.spec.*'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: true,
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // General rules
      'no-console': 'off', // Allow console for logging
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
]); 