# PT_DYNAMIC

***If an object undergoes dynamic linking, it's program headers table has an entry for the PT_DYNAMIC segment. This segment contains the .dynamic section, which holds important information to carry out relocations and transfer the control to the main program.***

A dynamic section entry is made up of:
```c
typedef struct {
  Elf32_Sword	d_tag;    /* Dynamic entry type */
  union
    {
      Elf32_Word d_val;   /* Integer value */
      Elf32_Addr d_ptr;   /* Address value */
    } d_un;
} Elf32_Dyn;

typedef struct {
  Elf64_Sxword d_tag;      /* Dynamic entry type */
  union
    {
      Elf64_Xword d_val;   /* Integer value */
      Elf64_Addr  d_ptr;   /* Address value */
    } d_un;
} Elf64_Dyn;
```

# .dynamic Array Entries

| Tag    | Value | d_un | Description | In executable? | In shared object? |
| :----  | :---- | :--- | :---------- | :------------- | :---------------- |
| DT_NULL   | 0 | Ignored | Marks the end of the dynamic section. No entries are processed after this. | Mandatory | Mandatory |
| DT_NEEDED | 1 | d_val | Tells the linker a shared library is needed; The value is an offset in the .dynstr table pointing to the library's name (e.g. libc.so.6); There can be multiple entries of this type. | Optional | Optional |
| DT_PLTRELSZ | 2  | d_val | Size of the .rela.plt section in bytes. | Optional | Optional |
| DT_PLTGOT   | 3  | d_ptr | Address of the PLT specific global offset table (GOT) used for dynamic symbol resolution via PLT. | Optional | Optional |
| DT_HASH     | 4  | d_ptr | Old hash table. Refers to the symbol table referenced by the DT_SYMTAB element. | Mandatory | Mandatory |
| DT_STRTAB   | 5  | d_ptr | Address of the string table (used for global symbols). | Mandatory | Mandatory |
| DT_SYMTAB   | 6  | d_ptr | Address of the dynamic symbol table. | Mandatory | Mandatory |
| DT_RELA     | 7  | d_ptr | Address of relocation entries using eager binding (.rela.dyn). | Mandatory | Optional |
| DT_RELASZ   | 8  | d_val | Size of the .rela.dyn section in bytes. | Mandatory | Optional |
| DT_RELAENT  | 9  | d_val | Size of a DT_RELA entry in bytes. | Mandatory | Optional |
| DT_STRSZ    | 10 | d_val | Size of string table in bytes.   | Mandatory | Mandatory |
| DT_SYMENT   | 11 | d_val | Size of a symbol table entry. | Mandatory | Mandatory |
| DT_INIT     | 12 | d_ptr | Address of the function to run before the main() from the source program runs. | Optional | Optional |
| DT_FINI     | 13 | d_ptr | Address of the function to run after the main() has returned. | Optional | Optional |
| DT_SONAME   | 14 | d_val | Gives the string table offset of a null-terminated string, giving the name of the shared object. The offset is an index into the table recorded in the DT_STRTAB entry | Ignored | Optional |
| DT_RPATH    | 15 | d_val | This element holds the string table offset of a null-terminated search library search path string.  Its use has been superseded by DT_RUNPATH. | Optional | Ignored |
| DT_SYMBOLIC | 16 | Ignored | This element's presence in a shared object library alters the dynamic linker's symbol resolution algorithm for references within the library. Instead of starting a symbol search with the executable file, the dynamic linker starts from the shared object itself. If the shared object fails to supply the referenced symbol, the dynamic linker then searches the executable file and other shared objects as usual.  Its use has been superseded by the DF_SYMBOLIC flag. | Ignored | Optional |
| DT_REL      | 17 | d_ptr | Address of REL relocation entries. A 32-bit construct. | Mandatory | Optional |
| DT_RELSZ    | 18 | d_val | Size of the REL table in bytes. A 32-bit construct. | Mandatory | Optional |
| DT_RELENT   | 19 | d_val | Size of a DT_REL entry In bytes. A 32-bit construct. | Mandatory | Optional |
| DT_PLTREL   | 20 | d_val | Type of relocation entries the PLT uses (RELA or REL, as appropriate). | Optional | Optional |
| DT_DEBUG    | 21 | d_ptr | Reserved for debugger use; ignored at runtime. | Optional | Optional |
| DT_TEXTREL  | 22 | Ignored | This member's absence signifies that no relocation entry should cause a modification to a non-writable segment, as specified by the segment permissions in the program header table. If this member is present, one or more relocation entries might request modifications to a non-writable segment, and the dynamic linker can prepare accordingly. | Optional | Optional |
| DT_JMPREL   | 23 | d_ptr | Address of relocation entries using lazy binding via plt (.rela.plt). | Optional | Optional |
| DT_BIND_NOW | 24 | Ignored | If present in a shared object or executable, this entry instructs the dynamic linker to process all relocations for the object containing this entry before transferring control to the program. The presence of this entry takes precedence over a directive to use lazy binding for this object when specified through the environment or via dlopen(BA_LIB).  Its use has been superseded by the DF_BIND_NOW flag. | Optional | Optional |
| DT_INIT_ARRAY   | 25 | d_ptr | Address of an array of constructor function pointers to run before the main() runs (more flexible than INIT). | Optional |  Optional |
| DT_FINI_ARRAY   | 26 | d_ptr | Address of an array of destructor function pointers to run after the main() has returned (more flexible than FINI_ARRAY). | Optional |  Optional |
| DT_INIT_ARRAYSZ | 27 | d_val | Size of the INIT_ARRAY in bytes. | Optional |  Optional |
| DT_FINI_ARRAYSZ | 28 | d_val | Size of the FINI_ARRAY in bytes. | Optional |  Optional |
| DT_RUNPATH | 29 | d_val | This element holds the string table offset of a null-terminated library search path string. | Optional |  Optional |
| DT_FLAGS | 30 | d_val | This element holds flag values specific to the object being loaded. Each flag value will have the name DF_flag_name. | Optional |  Optional |
| DT_ENCODING | 32 | Unspecified | Unspecified | Unspecified |
| DT_PREINIT_ARRAY | 32 | | d_ptr | Optional | Ignored |
| DT_PREINIT_ARRAYSZ | 33 | | d_val | Optional | Ignored |
| DT_GNU_HASH | | | Address of the GNU-style hash table used to speed symbol lookup. |
| DT_FLAGS_1  | | | Flags for the dynamic linker. |
| DT_VERNEED  | | | Address of version dependency table (defines symbol versions). |
| DT_VERNEEDNUM | | | Number of entries in the version dependency table. |
| DT_VERSYM     | | | Address of the version symbol table — gives the version of each symbol in the symbol table. |
| DT_RELACOUNT  | | | Number of RELA relocations not part of PLT — for optimization. |

# DT_FLAGS

| Name | Value | Description |
| :--- | :---- | :---------- |
| DF_ORIGIN   | 0x1 | This flag signifies that the object being loaded may make reference to the $ORIGIN substitution string. The dynamic linker must determine the pathname of the object containing this entry when the object is loaded. |
| DF_SYMBOLIC | 0x2 | If this flag is set in a shared object library, the dynamic linker's symbol resolution algorithm for references within the library is changed. Instead of starting a symbol search with the executable file, the dynamic linker starts from the shared object itself. If the shared object fails to supply the referenced symbol, the dynamic linker then searches the executable file and other shared objects as usual. 
| DF_TEXTREL  | 0x4 | If this flag is not set, no relocation entry should cause a modification to a non-writable segment, as specified by the segment permissions in the program header table. If this flag is set, one or more relocation entries might request modifications to a non-writable segment, and the dynamic linker can prepare accordingly. |
| DF_BIND_NOW | 0x8 | If set in a shared object or executable, this flag instructs the dynamic linker to process all relocations for the object containing this entry before transferring control to the program. The presence of this entry takes precedence over a directive to use lazy binding for this object when specified through the environment or via dlopen(BA_LIB). |
| DF_STATIC_TLS | 0x10 | If set in a shared object or executable, this flag instructs the dynamic linker to reject attempts to load this file dynamically. It indicates that the shared object or executable contains code using a static thread-local storage scheme. |

---

We can classify the entries in .dynamic section based on **when and how** the interpreter processes them.

| Phase (When) | Task (How) | Entries |
| :----------- | :--------- | :------ |
| 0  | Control linker behavior; Affects later phases | FLAGS_1 |
| 0  | Let debuggers (e.g. gdb) hook into the internal state of dynamic linker. | DEBUG |
| 1  | Load shared libraries | NEEDED |
| 2  | Perform immediate relocation | RELA, RELAENT, RELASZ, RELACOUNT |
| 3  | Setup for delayed relocation | JMPREL, PLTREL, PLTRELSZ, PLTGOT |
| 4  | Setup before main  | INIT, INIT_ARRAY, INIT_ARRAYSZ |
| 5  | Cleanup after main | FINI, FINI_ARRAY, FINI_ARRAYSZ |
| NA | Section terminator | NULL |

  - GNU_HASH, STRTAB, SYMTAB, STRSZ, SYMENT, VERNEED, VERNEEDNUM, VERSYM are used in resolving external references (symbol resolution + relocation).

Based on the classification above, we can map the purpose of the interpreter as:
  - Load shared libraries.
  - Perform immediate relocations.
  - Set up environment for delayed relocations.
  - Initialize the environment and transfer control to our C program.
  - Do cleanup after main has returned.
  - Initiate exit.
