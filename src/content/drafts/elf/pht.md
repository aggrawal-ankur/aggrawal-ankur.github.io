# Program Headers

***The program header table is an array of structures, each describing a segment or other information the system needs to prepare the program for execution.***

***A segment contains/organizes one or more sections purposefully.***

Program headers are only meaningful for executable and shared object files as they are used to map an executable file into virtual memory for execution.

A program header entry is made up of:
```c
typedef struct {
  Elf32_Word  p_type;     /* Segment type */
  Elf32_Off   p_offset;   /* The offset at which this Segment lives in the object file */
  Elf32_Addr  p_vaddr;    /* Segment virtual address */
  Elf32_Addr  p_paddr;    /* Segment physical address */
  Elf32_Word  p_filesz;   /* Segment size in file */
  Elf32_Word  p_memsz;    /* Segment size in memory */
  Elf32_Word  p_flags;    /* Segment flags */
  Elf32_Word  p_align;    /* Segment alignment */
} Elf32_Phdr;

typedef struct {
  Elf64_Word  p_type;    /* Segment type */
  Elf64_Word  p_flags;   /* The offset at which this Segment lives in the object file */
  Elf64_Off   p_offset;  /* Segment virtual address */
  Elf64_Addr  p_vaddr;   /* Segment physical address */
  Elf64_Addr  p_paddr;   /* Segment size in file */
  Elf64_Xword p_filesz;  /* Segment size in memory */
  Elf64_Xword p_memsz;   /* Segment flags */
  Elf64_Xword p_align;   /* Segment alignment */
} Elf64_Phdr;
```

# Program Header Types

| Name | Value | Description |
| :--- | :---- | :---------- |
| PT_NULL    | 0  | Program header table entry unused. |
| PT_LOAD    | 1  | A loadable program segment. |
| PT_DYNAMIC | 2  | The address of the .dynamic section. |
| PT_INTERP  | 3  | Path to dynamic linker/interpreter (ld-linux.so). |
| PT_NOTE    | 4  | Auxiliary information |
| PT_SHLIB   | 5  | Reserved. Programs that contain this do not conform to the ABI. |
| PT_PHDR    | 6  | Specifies where the program headers themselves are located. |
| PT_TLS     | 7  | Thread-local storage segment |
| PT_GNU_EH_FRAME | 0x6474e550 | GCC .eh_frame_hdr segment |
| PT_GNU_STACK    | 0x6474e551 | Stack permissions. |
| PT_GNU_RELRO    | 0x6474e552 | Read-only after relocation. |
| PT_GNU_PROPERTY | 0x6474e553 | GNU property. |
| PT_GNU_SFRAME   | 0x6474e554 | SFrame segment. |

***A program to be loaded by the system must have at least one loadable segment.***

# Segment Flags

| Name | Value | Description |
| :--- | :---- | :---------- |
| PF_X | (1 << 0) | Segment is executable |
| PF_W | (1 << 1) | Segment is writable |
| PF_W + PF_X | 3 | Segment is writable and executable |
| PF_R | (1 << 2) | Segment is readable |
| PF_R + PR_X | 5 | Segment is readable and executable |
| PF_R + PR_W | 6 | Segment is readable and writable |
| PF_R + PR_W + PF_X | 7 | Segment is readable, writable and executable |
