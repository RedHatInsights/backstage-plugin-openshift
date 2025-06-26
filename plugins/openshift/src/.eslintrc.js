module.exports = {
  rules: {
    'new-cap': ['error', { 
      capIsNewExceptions: ['QueryOpenshift', 'QueryQontract', 'ToolTipContent']
    }],
    'react-hooks/exhaustive-deps': 'warn', // Convert to warning instead of error
    '@typescript-eslint/no-use-before-define': ['error', { 
      functions: false,
      classes: true,
      variables: true 
    }]
  }
}; 