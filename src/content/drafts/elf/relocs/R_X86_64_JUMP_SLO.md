# R_X86_64_JUMP_SLO

Let's take this as an example:
```
000000004008  000600000007 R_X86_64_JUMP_SLO 0000000000000000 sleep@GLIBC_2.2.5 + 0
```

The JUMP_SLO symbols often belong to the .rela.plt table, which is for lazy relocations.

When an instruction from the .text section calls this symbol for the first time, it goes to the PLT stub for this symbol, i.e `sleep@plt`. It looks like this:
```bash
sleep@plt
+----------------------+
| jump .got.plt[sleep] |
| push sleep_symidx    |
| jmp plt[0]           |
+----------------------+
```

The first instruction points to the corresponding entry in .got.plt section. Since this is the first time it is called, the .got.plt entry points back to the second instruction in the plt stub, like this:
```bash
.got.plt[sleep] = addr_of(push sleep_symidx)
```

The next instruction pushes the symbol index on the stack. **Note: the value in disassembly is garbage.**

Next the cpu jumps to the first instruction in the plt[0] stub. It looks like this:
```bash
+-------------------------+
| push *(.got.plt + 8)    |
| jmp _dl_runtime_resolve |
+-------------------------+

*(.got.plt + 8) = *(link_map)
```

The `*(.got.plt + 8)` entry holds a pointer to the `link_map`. It is pushed on the stack. And the next instruction transfers the control to the dynamic linker.

The dynamic linker resolves the symbol's name, searches it in the link map, verifies the version, computes its final runtime address and patch the corresponding .got.plt entry.

Since sleep@plt jumped on __dl_runtime_resolve, not called it, there is no call frame for it. So, __dl_runtime_resolve patches the .got.plt entry and jumps to it.

That's how the first lazy call for a symbol is resolved. After this, a call to sleep goes to its plt stub, whose first instruction points to its .got.plt entry, which has the runtime address of sleep().
