<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# Corsair integration

When writing code that uses Corsair:

1. Run `pnpm corsair list` to discover available operations.

   Examples:
   - `pnpm corsair list --plugin=slack`
   - `pnpm corsair list --type=db`

2. Run `pnpm corsair schema <path>` before calling any operation.

   Example:
   - `pnpm corsair schema slack.api.messages.post`

Never infer endpoint names or argument shapes from source files.

Always use the CLI commands as the source of truth.