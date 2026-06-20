Prompt 1: Fixing the Template Engine (Phase 1.1)

Context: Give the AI your current project-templates.ts and index.ts.

Prompt:
"I am refactoring my Bun-based CLI 'qwykz'. Currently, my templates are hardcoded strings in project-templates.ts. I want to move these to a new templates/ folder as actual .ts files so I can get syntax highlighting. We are using [ESM / CJS — specify which].


Write a utility function using Bun.file(path).text() to read a file from the templates/ directory. Throw a clear, specific error if the file doesn't exist — don't let it crash the CLI with a raw stack trace.
Write a function called injectVariables(templateText, variables) that replaces placeholders like {{PROJECT_NAME}} in the text. If a placeholder has no matching variable, throw an error naming the missing key rather than leaving the literal placeholder text in the output.
Show me how to update my main CLI flow to use this new file-reading approach instead of importing strings."



Prompt 2: Dynamic NPM Versions (Phase 1.2)

Context: None needed.

Prompt:
"In my Bun CLI, I want to ensure the generated package.json always uses the latest dependency versions (like express, zod, prisma) without me having to manually update a hardcoded file every week.

Write a TypeScript utility for Bun that fetches the latest version of an array of npm packages by calling the npm registry HTTP API directly (https://registry.npmjs.org/<pkg>/latest) via fetch — do not shell out to npm view, since that requires npm installed alongside Bun and is slower.


Fetch all packages in parallel with Promise.all, with a reasonable per-request timeout.
Cache successful results to a local JSON file so repeated CLI runs the same day don't re-fetch.
On any network failure, fall back first to the cache, then to a hardcoded stable version list — never let a failed fetch crash the CLI."



Prompt 3: Error Handling & Verbose Flag (Phase 1.3)

Context: Give the AI the part of your code that runs bun install.

Prompt:
"Update this CLI execution block. I want graceful error handling for the bun install command.


Check if a --verbose flag is present in process.argv. If it is NOT present, suppress the standard output of the install process so the terminal stays clean.
Wrap the execution in a try/catch. If it fails, print a friendly, colorized error message (use picocolors — don't introduce a new dependency for this) suggesting they check their internet connection or ensure Bun is installed, rather than throwing a raw stack trace.
Exit with code 1 on failure and 0 on success — be explicit about this rather than letting it fall through."



Prompt 4: Building the Auth Module (Phase 3)

Context: Remind the AI of your architecture (Express, TS, Zod, Prisma).

Prompt:
"I need to create the template files for the 'Auth Module' of my Express/TypeScript boilerplate. Please write the raw, production-ready code for the following three files. Focus on security, using argon2 for hashing and zod for validation.


auth.controller.ts: Needs a register function (validates email/password, hashes, saves to Prisma) and a login function (verifies hash, returns signed JWT).
auth.middleware.ts: An Express middleware that verifies the JWT from the Authorization: Bearer header and attaches the user ID to req.user.
schema.prisma snippet: The Prisma User model required for this to work.


Constraints — don't go beyond these:


JWT secret must be read from process.env.JWT_SECRET; throw at startup if it's unset.
Tokens expire in 15 minutes. No refresh-token logic — that's a separate module, don't add it here.
No rate limiting here — that's also a separate module."



Prompt 5: Automated Testing for the CLI (Phase 1.4)

Context: Tell the AI you are using bun test.

Prompt:
"First: tell me whether my CLI already supports a non-interactive mode via flags (e.g. qwykz create test-app --yes). If not, suggest the minimal change to add one — this is standard practice for CLI tools (npm, create-react-app, etc.) and makes automated testing far more reliable than mocking stdin.

Then, using that non-interactive mode, write an automated integration test suite with bun test that:


Programmatically executes my CLI binary into a temporary directory (e.g. /tmp/qwykz-test).
Avoids stdin/prompt mocking (via node-pty or similar) unless truly unavoidable — prefer flags.
After execution, uses Bun's filesystem API to assert that package.json and src/index.ts were created successfully, and that package.json contains the name test-app.
Cleans up the temp directory after each test, even on failure."
