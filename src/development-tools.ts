/** Production players have no editor entry points; special author builds can opt in. */
export const DEVELOPMENT_TOOLS=import.meta.env.DEV||import.meta.env.VITE_DEVELOPMENT_TOOLS==='1';
