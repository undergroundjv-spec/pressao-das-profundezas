export default [
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        foundry: "readonly",
        game: "readonly",
        CONFIG: "readonly",
        canvas: "readonly",
        ui: "readonly",
        fromUuid: "readonly",
        ChatMessage: "readonly",
        Roll: "readonly",
        Dialog: "readonly",
        Hooks: "readonly",
        CONST: "readonly",
        document: "readonly",
        MutationObserver: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-undef": "error"
    }
  }
];
