# R_X86_64_RELATIVE

R_X86_64_RELATIVE has no symbol reference.

```
  Offset          Info            Type         Sym. Value  Sym. Name + Addend
000000003dd0  000000000008  R_X86_64_RELATIVE                  1130
```

The symbol index is 0 and relocation type is 8, which is `R_X86_64_RELATIVE`.

Entries of this type doesn't require any symbol lookup, which is why this relocation type is the fastest.

The symbol's runtime address can be calculated as:
```
*(base_vaddr + r_offset) = base_addr + r_addend
```

It is used to adjust addresses baked into data sections to reflect the object's actual load address.
