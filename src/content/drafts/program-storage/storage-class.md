# Storage Class

There are 4 things associated with a variable.

**Storage Location:** Where in the memory the variable would be stored?

**Lifetime:** How long the variable should exist (or be accessible)?

**Scope:** Where that variable can be accessed from?

**Default State:** Whether the variable has a default initial value when left uninitialized?

---

A storage class guides the compiler for the above 4 values associated with a variable.

| Storage Class | Scope && Lifetime | Default Value (if uninitialized) | Storage Location |
| :------------ | :---------------- | :------------------------------- | :------- |
| auto     | Block scope, until the block lives | Garbage (undefined) | Stack |
| register | Block scope, until the block lives | Garbage (undefined) | CPU register (if available) |
| static   | File scope, until the program exists in the memory | 0 | .data(if initialized) |
| | | | .bss(if zero-initialized; or left uninitialized) |
| extern   | Program scope, until the program exists in the memory | 0 | .data(if initialized) |
| | | | .bss(if zero-initialized; or left uninitialized) |

Every variable has a storage class associated with it, but usually it is not visible.
