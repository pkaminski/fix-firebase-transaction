# fix-firebase-transaction

[![Project Status: Inactive - The project has reached a stable, usable state but is no longer being actively developed; support/maintenance will be provided as time allows.](http://www.repostatus.org/badges/latest/inactive.svg)](http://www.repostatus.org/#inactive)

Monkeypatch some broken semantics of Firebase transactions:

1. Transactions will no longer get aborted by a stray `set` or `update` that happens to overlap them.

2. When aborting the transaction (by returning undefined), the original value will be returned instead to force the server to check that the value wasn't stale, and retry if it was.  If you really want to abort immediately then return `Firebase.ABORT_TRANSACTION_NOW` instead.

3. Errors thrown by the update function will be caught and passed through to the completion callback and promise.

A standard `Promise` class must be defined, either natively or via a polyfill.
