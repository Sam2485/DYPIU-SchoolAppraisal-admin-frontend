# DYPIU Faculty Appraisal - Agent Guidelines

## Token Optimization & Serena MCP Tools
To minimize token consumption and avoid context window exhaustion:
1. **Prioritize Serena MCP tools** (`find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `find_implementations`, `search_for_pattern`) for code exploration and symbol inspection instead of loading entire files into context.
2. **Read only necessary symbol bodies**: Retrieve only the specific method or class body needed (`find_symbol` with `include_body=True`), not whole files.
3. **Use Serena editing tools**: Use `replace_symbol_body` or targeted `replace_content` for surgical code modifications rather than rewriting whole files.
4. **Leverage Memories**: Access project architecture conventions and database schemas using `read_memory` (e.g., `core`, `databases`, `architecture`).