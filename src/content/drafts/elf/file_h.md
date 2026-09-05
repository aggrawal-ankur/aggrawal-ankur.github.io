# File Header

***It is the first thing present in the raw form of an object file.***

This is the elf file header:
```c
#define EI_NIDENT (16)

typedef struct{
  unsigned char	e_ident[EI_NIDENT];	/* Magic number and other info */
  Elf32_Half  e_type;     /* Object file type */
  Elf32_Half  e_machine;  /* Architecture */
  Elf32_Word  e_version;  /* Object file version */
  Elf32_Addr  e_entry;    /* Entry point virtual address */
  Elf32_Off   e_phoff;    /* Program header table file offset */
  Elf32_Off   e_shoff;    /* Section header table file offset */
  Elf32_Word  e_flags;    /* Processor-specific flags */
  Elf32_Half  e_ehsize;   /* ELF header size in bytes */
  Elf32_Half  e_phentsize;  /* Program header table entry size */
  Elf32_Half  e_phnum;    /* Program header table entry count */
  Elf32_Half  e_shentsize;  /* Section header table entry size */
  Elf32_Half  e_shnum;    /* Section header table entry count */
  Elf32_Half  e_shstrndx;   /* Section header string table index */
} Elf32_Ehdr;

typedef struct{
  unsigned char	e_ident[EI_NIDENT];	/* Magic number and other info */
  Elf64_Half  e_type;     /* Object file type */
  Elf64_Half  e_machine;  /* Architecture */
  Elf64_Word  e_version;  /* Object file version */
  Elf64_Addr  e_entry;    /* Entry point virtual address */
  Elf64_Off   e_phoff;    /* Program header table file offset */
  Elf64_Off   e_shoff;    /* Section header table file offset */
  Elf64_Word  e_flags;    /* Processor-specific flags */
  Elf64_Half  e_ehsize;   /* ELF header size in bytes */
  Elf64_Half  e_phentsize;  /* Program header table entry size */
  Elf64_Half  e_phnum;    /* Program header table entry count */
  Elf64_Half  e_shentsize;  /* Section header table entry size */
  Elf64_Half  e_shnum;    /* Section header table entry count */
  Elf64_Half  e_shstrndx;   /* Section header string table index */
} Elf64_Ehdr;
```

## e_ident[]

These bytes mark the file as an object file and specify how to interpret the file, independent of the processor on which the inquiry is made and independent of the file's remaining contents.

The e_ident[] array has 16 values, not all of which are used. Values from 9th index onwards are not used.
```c
e_ident[] = {
  EI_MAG0, EI_MAG1, EI_MAG2, EI_MAG3, EI_CLASS, EI_DATA, EI_VERSION, EI_OSABI, EI_ABIVERSION, EI_PAD....EI_PAD
}
```

The first 4 bytes are for the magic number.

### Magic Number: e_ident[0, 1, 2, 3]
---

***`Magic` is a stream of characters used to identify a file format or protocol. [Wikipedia](https://en.wikipedia.org/wiki/Magic_number_\(programming\))***

It is placed at the beginning of a data stream and serves as a unique signature to indicate the type or origin of a data.

For example, a PNG file starts with `89 50 4E 47 0D 0A 1A 0A`.

For an ELF, it is `7f 45 4c 46`.
  - `7f` which is a non-printable ASCII character `DEL`, is reserved for ELF format.
  - `45 4c 46` translates to `E L F`.

Each binary file format (like PNG, JPEG etc) uses a non-printable ASCII character so the system can distinguish the file from a random text file as a random text file can't start with a `DEL` unless manipulated.

### EI_CLASS: e_ident[4]
---

Specifies the class of the ELF.

| Value  | Integer Equ.| Description |
| :----- | :---------- | :---------- |
| `ELFCLASSNONE` | 0 | Invalid class |
| `ELFCLASS32`   | 1 | 32-bit object |
| `ELFCLASS64`   | 2 | 64-bit object |

### EI_DATA: e_ident[5]
---

Specifies the data encoding: how to interpret basic objects in the file.

| Value  | Integer Equ.| Description |
| :----- | :---------- | :---------- |
| `ELFDATANONE` | 0 | Invalid data encoding |
| `ELFDATA2LSB` | 1 | 2's complement, little endian |
| `ELFDATA2MSB` | 2 | 2's complement, big endian |

### EI_VERSION: e_ident[6]
---

| Value  | Integer Equ.| Description |
| :----- | :---------- | :---------- |
| `EV_NONE`    | 0 | Invalid version |
| `EV_CURRENT` | 1 | Current version |


### EI_OSABI: e_ident[7]
---

Identifies the OS- or ABI-specific ELF extensions used by this file.

| Value  | Integer Equ.| Description |
| :----- | :---------- | :---------- |
| ELFOSABI_NONE, ELFOSABI_SYSV | 0 | No extension; UNIX System V ABI |
| ELFOSABI_HPUX | 1 | HP-UX |
| ELFOSABI_NETBSD | 2 | NetBSD |
| ELFOSABI_GNU, ELFOSABI_LINUX | 3 | Object uses GNU ELF extensions |
| ELFOSABI_FREEBSD | 9 | FreeBSD |
| ELFOSABI_OPENBSD | 12 | OpenBSD |
| ELFOSABI_ARM_AEABI | 64 | ARM EABI |
| ELFOSABI_ARM | 97 | ARM |

### EI_ABIVERSION: e_ident[8]
---

Identifies the version of the ABI to which the object is targeted.

It is used to distinguish among the incompatible versions of an ABI.

### EI_PAD
---

Marks the beginning of the unused bytes in e_ident. These bytes are reserved and set to zero.

## e_type

It specifies the type of the object file.

| Value  | Integer Equ.| Description |
| :----- | :---------- | :---------- |
| `ET_REL`  | 1 | Relocatable file: object code ready to be linked. |
| `ET_EXEC` | 2 | Executable file: can be loaded in memory for execution. |
| `ET_DYN`  | 3 | Shared object file: represents libraries. |
| `ET_CORE` | 4 | Core dump: a memory snapshot of a process. |

## e_machine

It specifies the architecture the object file is built for.

Commonly used values include:

| Value  | Integer Equ.| Description |
| :----- | :---------- | :---------- |
| `EM_NONE` | 0  | No machine  |
| `EM_386`  | 3  | Intel 80386 |
| `EM_860`  | 7  | Intel 80860 |
| `EM_ARM`  | 40 | Arm |
| `EM_SPARCV9` | 43 | SPARC V9 64-bit |
| `EM_X86_64`  |	62 | AMD x86-64  |
| `EM_AARCH64` | 183 | ARM AARCH64 |
| `EM_RISCV`   | 243 | RISC-V |

## e_version

It specifies the version of the object file.

| Value  | Integer Equ.| Description |
| :----- | :---------- | :---------- |
| `EV_NONE`    | 0 | Invalid version |
| `EV_CURRENT` | 1 | Current version |

## e_entry

It specifies the entry point which the system first transfers control, thus starting the process.

If the file has no program header table, this member holds zero. Ex: relocatable files.

## e_flags

Holds processor-specific flags associated with the file.

## e_ehsize

Holds the size of the ELF file header.

| Arch | Size |
| :--- | :--- |
| 32-bit | 52 bytes |
| 64-bit | 64 bytes |

## e_shstrndx

Holds the index of an entry in the section headers table associated with the section header string table.

If the file has no section name string table, it has `SHN_UNDEF`.

## Tables

| Entry | Description |
| :---- | :---------- |
| e_phoff  | The offset at which the program headers table is located inside the object file. |
| | Zero if absent. Ex: relocatable files. |
| e_phnum | The number of entries in the program headers table. |
| e_phentsize | The size of an entry in the program headers table. All entries have the same size. |
| e_shoff  | The offset at which the section headers table is located inside the object file. |
| | Zero if absent. Ex: relocatable files. |
| e_shnum | The number of entries in the section headers table. |
| e_shentsize | The size of an entry in the section headers table. All entries have the same size. |
