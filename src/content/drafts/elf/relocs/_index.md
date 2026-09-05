# Relocations

As the shared library dependency is resolved, now the dynamic linker can relocate the external references in our code.

The interpreter utilizes these entries in the .dynamic array for these purposes:

| Entry | Purpose |
| :---- | :------ |
| DT_RELA   | To find the .rela.dyn section. |
| DT_RELASZ | To find the size of the .rela.dyn section. |
| DT_RELACOUNT | To find the number of entries in the .rela.dyn section. |
| DT_RELAENT   | To find the size of each relocation entry. |
| DT_SYMTAB | To find the dynamic symbol table (.dynsym).   |
| DT_SYMENT | To find the size of a symbol table entry.  |
| DT_STRTAB | To find the string table (.dynstr). |
| DT_STRSZ  | To find the size of string table in bytes. |

---

A relocation entry can be read as: ***at offset in the section, replace the placeholder value with the runtime address.***

The .text section contains instructions, which is why it is immutable.

The build-time linker tries to patch as many references as it can. But it fails for extern symbols present in shared dependencies, like `libc.so.6`.

The build-time linker has the final list of unresolved symbols.
  - It ensures that each symbol has an entry in the global offset table, which is a purposefully writeable section at runtime.
  - The .got entry for the corresponding symbol is updated at runtime by the dynamic linker.

Therefore, the idea is to point the immutable instruction to a fixed address in the global offset table (.got), which is updated at runtime with the runtime address of that symbol.

This works for eager relocations. For lazy relocations, we use procedure linkage table along with a global offset table specific to lazy relocations.

---

After processing non-PLT relocations (.rela.dyn), the dynamic linker configures the PLT/GOT mechanism for deferred symbol resolution. That setup enables lazy relocations to occur only when a PLT entry is first invoked.

The dynamic linker uses these entries in the .dynamic array:

| Entry | Purpose |
| :---- | :------ |
| DT_JMPREL   | Address of relocation entries using lazy binding via plt (.rela.plt). |
| DT_PLTRELSZ | Size of the .rela.plt section in bytes. |
| DT_RELAENT  | Size of a DT_RELA entry in bytes. |
| DT_PLTREL   | Type of relocation entries the PLT uses (RELA or REL, as appropriate). |
