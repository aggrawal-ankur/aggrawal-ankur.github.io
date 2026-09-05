# Relocations

There are 100s of procedures and sub-routines doing the ground work. But not all of them are available as frontend APIs. They are called internally by the frontend APIs. That's why only few symbols need relocation.

There are two relocation tables in our binary.
  - `.rela.dyn` is for symbols requiring eager binding.
  - `.rela.plt` is for symbols requiring lazy binding.

A relocation section references two other sections: a symbol table and a section to modify.

These two tables cover most of the general C binaries, but relocation tables aren't limited to them. There are edge cases when a different relocation table might be used.

This is how a RELA entry is structured:
```c
typedef struct {
  Elf32_Addr  r_offset;  /* Address */
  Elf32_Word  r_info;    /* Relocation type and symbol index */
  Elf32_Sword r_addend;  /* Addend */
} Elf32_Rela;

typedef struct {
  Elf64_Addr   r_offset;  /* Address */
  Elf64_Xword  r_info;    /* Relocation type and symbol index */
  Elf64_Sxword r_addend;  /* Addend */
} Elf64_Rela;
```

This is how a REL entry is structured:
```c
typedef struct {
  Elf32_Addr r_offset; /* Address */
  Elf32_Word r_info;   /* Relocation type and symbol index */
} Elf32_Rel;

typedef struct {
  Elf64_Addr  r_offset; /* Address */
  Elf64_Xword r_info;   /* Relocation type and symbol index */
} Elf64_Rel;
```

## r_offset

Specifies the location at which the relocation has to be applied.

The section header's `sh_info` and `sh_link` members, specify these relationships.

For a relocatable file, it is the offset in a section (from th beginning of the file) the relocation is required at.

For an executable file, or a shared object, the value is the virtual address that needs relocation.

## r_info

It bit-masks the symbol index and the relocation type.

The symbol index can be subscripted in the appropriate symbol table (.symtab/.dynsym) to find the entry for that symbol.

Relocation type specifies how to apply the relocation.

## r_addend

It specifies a constant value used to compute the final runtime address of a symbol.

For most of symbols, it is 0.