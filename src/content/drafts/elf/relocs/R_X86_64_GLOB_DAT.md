# R_X86_64_GLOB_DAT

Let's take this relocation entry as an example:
```
  Offset          Info            Type            Sym. Value     Sym. Name + Addend
000000003fc0  000100000006  R_X86_64_GLOB_DAT  0000000000000000  __libc_start_main@GLIBC_2.34 + 0
```

The symbol index is 1 and the relocation type is 6, which is `R_X86_64_GLOB_DAT`.

R_X86_64_GLOB_DAT instructs the dynamic linker to write the resolved symbol's absolute runtime address into its GOT entry.

The relocation logic is:
```
*(base_vaddr + r_offset) = address_of(__libc_start_main)
```
  - ***At the offset, write the final runtime address of __libc_start_main.***

The symbol index is subscripted in the .dynsym table to find the st_name entry. The st_name entry gives the offset in the .dynstr table, which resolves to the symbol's name.

The symbol is searched in the runtime link map (all the shared objects mapped in the address space). Version info is verified using `DT_VERSYM`, `DT_VERDEF`, and `DT_VERNEED`.

The final address is computed and written on the corresponding global offset table entry.

Relocation completed.
