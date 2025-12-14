import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettierConfig from 'eslint-config-prettier'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // Allow any types - needed for API responses, error handlers, etc.
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow setState in effects for hydration and initialization patterns
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      // Relax exhaustive-deps - Zustand selectors are stable
      'react-hooks/exhaustive-deps': 'warn',
      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Allow img tags - used intentionally for external images
      '@next/next/no-img-element': 'warn',
      // Allow empty interfaces/types
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow anonymous default exports
      'import/no-anonymous-default-export': 'off',
    },
  },
]

export default eslintConfig
