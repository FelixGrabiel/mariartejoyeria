import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "supabase/functions/**", "tests/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
  {
    // Reglas pensadas para el React Compiler (que este proyecto no usa). Leer localStorage dentro de un efecto
    // es intencional: evita diferencias entre el HTML del servidor y el del navegador.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
    },
  },
];
export default config;
