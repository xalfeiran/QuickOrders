// connect-pg-simple ships no type declarations. We use it only in main.ts to
// build a session store, so an ambient module declaration is enough to satisfy
// the compiler without pulling in a (non-existent) @types package.
declare module 'connect-pg-simple';
