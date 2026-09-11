// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Agent worktrees (Claude Code, Cursor) live under .claude/ and bring
  // their own copy of the repo; lint the project once, not per worktree.
  { ignores: ['.claude/**'] },
)
