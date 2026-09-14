/**
 * The no-restricted-imports rule below is a tenant-isolation guardrail, not style.
 * See docs/adr/0002-single-database-org-id.md.
 *
 * packages/db/src/unsafe.ts exports a Drizzle client with no org_id filtering.
 * Importing it anywhere outside packages/db/src is how one carrier's fiscal
 * documents end up visible to another carrier.
 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  ignorePatterns: ["node_modules/", "dist/", ".next/", "coverage/", ".turbo/"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/db/src/unsafe", "**/db/src/unsafe.ts", "@ai4l/db/unsafe"],
            message:
              "The unfiltered database client is off limits. Use forOrg(orgId) from @ai4l/db. See ADR 0002.",
          },
        ],
      },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
  overrides: [
    {
      // packages/db is the one place allowed to touch the raw client.
      files: ["packages/db/src/**"],
      rules: { "no-restricted-imports": "off" },
    },
  ],
};
