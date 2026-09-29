import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'src-tauri/**', 'node_modules/**'],
  },
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': 'warn',
    },
  }
);
