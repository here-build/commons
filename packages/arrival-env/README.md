# @here.build/arrival-env

This is minimal package to provide Symbol.SExpr and symbol.toSExpr definition.

It is intended to provide arrival compatibility for cases when definitions are used in multi-environments
where only some of them needs arrival runtime.

This allows to write arrival serialization definitions without actually importing full arrival runtime.
