# Types Of Relocations (List)

Relocations are carried out differently on 32-bit and 64-bit systems.
  - Both architectures have different gABI and psABI so they support different relocation types as well.

## 32-bit

| Types | Value | Description |
| :---- | :---- | :---------- |
| R_386_NONE  | 0 |
| R_386_32    | 1 |
| R_386_PC32  | 2 |
| R_386_GOT32 | 3 |
| R_386_PLT32 | 4 |
| R_386_COPY  | 5 |
| R_386_GLOB_DAT | 6 |
| R_386_JMP_SLOT | 7 |
| R_386_RELATIVE | 8 |
| R_386_GOTOFF | 9  |
| R_386_GOTPC  | 10 |

# 64-bit

