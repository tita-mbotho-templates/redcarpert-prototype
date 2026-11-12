import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['dist/**','.generated/**','public/**']}, ...tseslint.configs.recommended, {files:['src/client/**/*.js'],rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]} });
