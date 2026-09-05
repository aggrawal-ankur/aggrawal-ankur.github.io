# Section Header Entry

***Sections are used to organize our code/data/symbols etc.***

A section header entry is made up of:
```c
typedef struct{
  Elf32_Word  sh_name;    /* Section name (offset in .shstrtab) */
  Elf32_Word  sh_type;    /* Section type */
  Elf32_Word  sh_flags;   /* Section flags */
  Elf32_Addr  sh_addr;    /* Section virtual addr at execution */
  Elf32_Off   sh_offset;  /* The offset at which this section is located in the object file */
  Elf32_Word  sh_size;    /* Section size in bytes */
  Elf32_Word  sh_link;    /* Link to another section */
  Elf32_Word  sh_info;    /* Additional section information */
  Elf32_Word  sh_addralign;    /* Section alignment */
  Elf32_Word  sh_entsize;   /* Entry size if section holds table */
} Elf32_Shdr;

typedef struct{
  Elf64_Word   sh_name;    /* Section name (offset in .shstrtab) */
  Elf64_Word   sh_type;    /* Section type */
  Elf64_Xword  sh_flags;   /* Section flags */
  Elf64_Addr   sh_addr;    /* Section virtual addr at execution */
  Elf64_Off    sh_offset;  /* The offset at which this section is located in the object file */
  Elf64_Xword  sh_size;    /* Section size in bytes */
  Elf64_Word   sh_link;    /* Link to another section */
  Elf64_Word   sh_info;    /* Additional section information */
  Elf64_Xword  sh_addralign;    /* Section alignment */
  Elf64_Xword  sh_entsize;   /* Entry size if section holds table */
} Elf64_Shdr;
```

# Section Types

| Type | Value | Description |
| :--- | :---- | :---------- |
| SHT_NULL     | 0 | Unused section header entry. |
| SHT_PROGBITS | 1 | Program data: information defined by the program. |
| SHT_SYMTAB   | 2 | Global symbol table; Includes every symbol in the combined object files; Used in link-editing, though it may also be used for dynamic linking. |
| SHT_STRTAB   | 3 | String table (.shstrtab, .strtab and .dynstr); An object file can have multiple entries of this type. |
| SHT_RELA     | 4 | Relocation entries with explicit addends. |
| SHT_HASH     | 5 | Symbol hash table. |
| SHT_DYNAMIC  | 6 | Dynamic linking information. |
| SHT_NOTE     | 7 | Notes |
| SHT_NOBITS   | 8 | Program space but occupies no space in the file. |
| SHT_REL      | 9 | Relocation entries without explicit addends. |
| SHT_SHLIB    | 10 | Reserved. |
| SHT_DYNSYM   | 11 | Dynamic linker symbol table. |
| SHT_INIT_ARRAY | 14 | Array of pointers to initialization functions. Each pointer in the array is taken as a parameterless procedure with a void return. |
| SHT_FINI_ARRAY | 15 | Array of pointers to termination functions. Each pointer in the array is taken as a parameterless procedure with a void return. |
| SHT_PREINIT_ARRAY | 16 | Array of pointers to functions that are invoked before all other initialization functions. |
| SHT_GROUP | 17 | This section defines a section group. A section group is a set of sections that are related and that must be treated specially by the linker; They may appear only in relocatable objects;  The section header table entry for a group section must appear in the section header table before the entries for any of the sections that are members of the group. |
| SHT_SYMTAB_SHNDX | 18 | It is associated with a section of type SHT_SYMTAB and is required if any of the section header indexes referenced by that symbol table contain the escape value SHN_XINDEX. The section is an array of Elf32_Word values. Each value corresponds one to one with a symbol table entry and appear in the same order as those entries. The values represent the section header indexes against which the symbol table entries are defined. Only if corresponding symbol table entry's st_shndx field contains the escape value SHN_XINDEX will the matching Elf32_Word hold the actual section header index; otherwise, the entry must be SHN_UNDEF (0). |
| SHT_GNU_verdef  | 0x6ffffffd | Version definition section. |
| SHT_GNU_verneed | 0x6ffffffe | Version needs section. |
| SHT_GNU_versym  | 0x6fffffff | Version symbol table.  |

# Section Attribute Flags

| Type | Value | Description |
| :--- | :---- | :---------- |
| SHF_WRITE      | 0x1 (1 << 0) | The section contains data that should be writable during process execution. |
| SHF_ALLOC      | 0x2 (1 << 1) | The section (is allocated or) occupies memory during execution. |
| SHF_EXECINSTR  | 0x4 (1 << 2) | The section contains executable machine instruction. |
| SHF_MERGE      | 0x10 (1 << 4) | The data in the section may be merged to eliminate duplication. |
| SHF_STRINGS    | 0x20 (1 << 5) | The section contains null-terminated strings. |
| SHF_INFO_LINK  | 0x40 (1 << 6) | The sh_info field of this section header holds a section header table index. |
| SHF_LINK_ORDER | 0x80 (1 << 7) | Adds special ordering requirements for link editors. |
| SHF_GROUP | 0x200 (1 << 9) | The section is member of a group. The section must be referenced by a section of type SHT_GROUP. The SHF_GROUP flag may be set only for sections contained in relocatable objects. |
| SHF_TLS   | 0x400 (1 << 10) | Section hold thread-local data. |
| SHF_COMPRESSED | (1 << 11) | Section with compressed data. |

# Section Headers

***The section headers table lets you locate all the sections in an object file.***

It is is an array of Elf32_Shdr or Elf64_Shdr structures. A section header table index is a subscript into this array.

The ELF header's `e_shoff` member gives the byte offset from the beginning of the file to the section header table, `e_shnum` tells how many entries the section header table contains and `e_shentsize` gives the size a section header entry in bytes. 

Every section in an object file has exactly one section header describing it.

Each section occupies one contiguous (possibly empty) sequence of bytes within a file.

No byte in a file resides in more than one section.

| Name | Type | Description | Flags |
| :--- | :--- | :---------- | :---- |
| Section 0  | SHT_NULL  | An empty to align the rest of the section from 1. | NA |
| .note.gnu.property | SHT_NOTE | Metadata for hardware/ABI features.    | None |
| .note.gnu.build-id | SHT_NOTE | Unique hash/fingerprint of the binary. | None |
| .interp    | SHT_PROGBITS | Path of the dynamic interpreter program.   | SHF_ALLOC |
| .hash | SHT_HASH | Old hash table. | SHF_ALLOC |
| .gnu.hash  | SHT_GNU_HASH | GNU-style Hash table used by the dynamic linker to speed up symbol lookup. | SHF_ALLOC | SHF_ALLOC |
| .dynsym    | SHT_DYNSYM   | Dynamic symbol table used by the interpreter program (ld-linux). | SHF_ALLOC |
| .dynstr    | SHT_STRTAB   | String table for names in .dynsym.    | SHF_ALLOC |
| .gnu.version | SHT_VERSYM | Version info for each dynamic symbol. | SHF_ALLOC |
| .gnu.version_r | SHT_VERNEED | Declares required versions of shared libraries. | SHF_ALLOC |
| .rela.dyn  | SHT_RELA     | Relocation entries for global data and non-PLT addresses. | SHF_ALLOC |
| .rela.plt  | SHT_RELA     | Relocation entries via PLT. | SHF_ALLOC |
| .init      | SHT_PROGBITS | Code that runs before main() to initialize stuff. | SHF_ALLOC + SHF_EXECINSTR |
| .preinit_array | SHT_PREINIT_ARRAY | | SHF_ALLOC + SHF_WRITE |
| .plt       | SHT_PROGBITS | Procedure Linkage Table — stubs for external function calls. | SHF_ALLOC + SHF_EXECINSTR |
| .plt.got   | SHT_PROGBITS | Used in lazy binding (jump to GOT entries). | SHF_ALLOC + SHF_EXECINSTR |
| .text      | SHT_PROGBITS | Our source code. | SHF_ALLOC + SHF_EXECINSTR |
| .fini      | SHT_PROGBITS | Code that runs after main() returns. | SHF_ALLOC + SHF_EXECINSTR |
| .rodata    | SHT_PROGBITS | Read-only static data (e.g., strings, constants). | SHF_ALLOC |
| .rodata1   | SHT_PROGBITS | Read-only data. | SHF_ALLOC | SHF_ALLOC |
| .eh_frame_hdr | SHT_PROGBITS | Header for exception handling frames. | SHF_ALLOC |
| .eh_frame     | SHT_PROGBITS | Stack unwinding info for exceptions/debugging. | SHF_ALLOC |
| .note.ABI-tag | SHT_NOTE     | Identifies the target OS/ABI version. | None |
| .init_array | SHT_INIT_ARRAY | List of constructor function pointers to run before main(). | SHF_ALLOC + SHF_WRITE |
| .fini_array | SHT_FINI_ARRAY | List of destructor function pointers to run after main(). | SHF_ALLOC + SHF_WRITE |
| .dynamic    | SHT_DYNAMIC  | Used by the dynamic linker to. | SHF_ALLOC(mandatory) + SHF_WRITE(processor-specific) |
| .got        | SHT_PROGBITS | Global Offset Table to store resolved addresses. | SHF_ALLOC + SHF_WRITE |
| .got.plt    | SHT_PROGBITS | GOT entries for lazy binding through PLT. | SHF_ALLOC + SHF_WRITE |
| .data  | SHT_PROGBITS | Initialized global/static data that contributes to the program's memory image. | SHF_ALLOC + SHF_WRITE + SHF_WRITE |
| .data1 | SHT_PROGBITS | Initialized global/static data that contributes to the program's memory image. | SHF_ALLOC + SHF_WRITE + SHF_WRITE |
| .debug | SHT_PROGBITS | Holds information for symbolic debugging. | None |
| .line  | SHT_PROGBITS | Holds line number information for symbolic debugging, which describes the correspondence between the source program and the machine code. |
| .bss        | SHT_NOBITS   | Uninitialized global/static data. | SHF_ALLOC + SHF_WRITE |
| .comment    | SHT_PROGBITS | Compiler version or build metadata (ignored at runtime).  | None |
| .symtab     | SYMTAB | Symbol table for static linking/debugging. | If the file has a loadable segment that includes the symbol table, SHF_ALLOC |
| .strtab     | STRTAB | String table for names in .symtab. | If the file has a loadable segment that includes the symbol string table, SHF_ALLOC |
| .shstrtab   | STRTAB | String table for section names. | None |
| .symtab_shndx | SHT_SYMTAB_SHNDX |
| .tbss | SHT_NOBITS | Holds uninitialized thread-local data. Zero-initialized at runtime. | SHF_ALLOC+SHF_WRITE+SHF_TLS |
| .tdata | SHT_PROGBITS | Holds initialized thread-local data. | SHF_ALLOC+SHF_WRITE+SHF_TLS |
| .tdata1 | SHT_PROGBITS | Holds initialized thread-local data. | SHF_ALLOC+SHF_WRITE+SHF_TLS |
