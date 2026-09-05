# Symbol Tables

***Symbol table holds information needed to locate and relocate a program's symbolic definitions and references.***

The first entry in the symbol table array is an empty entry.

A symbol table entry is made up of:
```c
typedef struct {
  Elf32_Word st_name;      /* Symbol name (offset in .strtab/.dynstr) */
  Elf32_Addr st_value;     /* Symbol value */
  Elf32_Word st_size;      /* Symbol size */
  unsigned char st_info;   /* Symbol type and binding */
  unsigned char st_other;  /* Symbol visibility */
  Elf32_Section st_shndx;  /* Section index */
} Elf32_Sym;

typedef struct {
  Elf64_Word    st_name;    /* Symbol name (offset in .strtab/.dynstr) */
  unsigned char st_info;    /* Symbol type and binding */
  unsigned char st_other;   /* Symbol visibility */
  Elf64_Section st_shndx;   /* Section index */
  Elf64_Addr    st_value;   /* Symbol value */
  Elf64_Xword   st_size;    /* Symbol size */
} Elf64_Sym;
```

There are two major symbol tables:
  1. .symtab is the global symbol table.
  2. .dynsym is the dynamic symbol table.

## st_info

st_info bit-masks symbol type and binding, like this:
```bash
st_info = (bind << 4) + (type & 0xf)
```

To obtain the symbol type from st_info:
```bash
st_info >> 4
```

To obtain the symbol binding from st_info:
```bash
st_info & Oxf
```

## st_other

Every symbol table entry is defined in relation to some section. This member holds the relevant section header table index.

If this member contains SHN_XINDEX, then the actual section header index is too large to fit in this field. The actual value is contained in the associated section of type SHT_SYMTAB_SHNDX. 

# Symbol Types

| Type | Value | Description |
| :--- | :---- | :---------- |
| STT_NOTYPE  | 0 | Symbol type is unspecified. |
| STT_OBJECT  | 1 | Symbol is a data object (like a variable). |
| STT_FUNC    | 2 | Symbol is a function or other executable object. |
| STT_SECTION | 3 | Symbol is associated with a section. Symbol table entries of this type exist primarily for relocation and normally have STB_LOCAL binding. |
| STT_FILE    | 4 | Symbol represents file name. A file symbol has STB_LOCAL binding, its section index is SHN_ABS, and it precedes the other STB_LOCAL symbols for the file, if it is present. |
| STT_COMMON  | 5 | Symbol is a common data object. |
| STT_TLS     | 6 | Symbol is thread-local storage entity. When defined, it gives the assigned offset for the symbol, not the actual address. |

# Symbol Binding

| Type | Value | Description |
| :--- | :---- | :---------- |
| STB_LOCAL  | 0 | **Local symbol**: not visible outside the object file containing their definition. Local symbols of the same name may exist in multiple files without interfering with each other. |
| STB_GLOBAL | 1 | **Global symbol**: visible to all object files being combined. One file's definition of a global symbol will satisfy another file's undefined reference to the same global symbol. |
| STB_WEAK   | 2 | **Weak symbols** resemble global symbols, but their definitions have lower precedence. |

# Symbol Value

Symbol table entries for different object file types have slightly different interpretations for the st_value member.

In **relocatable files**, st_value holds alignment constraints for a symbol whose section index is SHN_COMMON.

In **relocatable files**, st_value holds a section offset for a defined symbol. That is, st_value is an offset from the beginning of the section that st_shndx identifies.

In executable and shared object files, st_value holds a virtual address. To make these files' symbols more useful for the dynamic linker, the section offset (file interpretation) gives way to a virtual address (memory interpretation) for which the section number is irrelevant.

# Symbol Visibility

| Type | Value | Description |
| :--- | :---- | :---------- |
| STV_DEFAULT   | The visibility of such symbols is specified by the symbol's binding type. That is, global and weak symbols are visible outside of their defining component (executable file or shared object). Local symbols are hidden. |
| STV_PROTECTED | A symbol defined in the current component is protected if it is visible in other components but not preemptable, meaning that any reference to such a symbol from within the defining component must be resolved to the definition in that component, even if there is a definition in another component that would preempt by the default rules.
| STV_HIDDEN    | A symbol defined in the current component is hidden if its name is not visible to other components. A hidden symbol contained in a relocatable object must be either removed or converted to STB_LOCAL binding by the link-editor when the relocatable object is included in an executable file or shared object. |
| STV_INTERNAL | An internal symbol contained in a relocatable object must be either removed or converted to STB_LOCAL binding by the link-editor when the relocatable object is included in an executable file or shared object. 