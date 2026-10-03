---
title: "Accessing Segments"
publishDate: "2026-10-03"
# updatedDate: "2026-M-D"
description: "Accessing Segments"
tags: [ intel-sdm ]
draft: true
---

# Descriptor Tables (Global and Local)

When operating in protected mode, all memory accesses pass through either the ***global descriptor table (GDT)*** or an optional ***local descriptor table (LDT)***. The linear addresses of the base of these tables are contained in the `GDTR` and the `LDTR` registers, respectively.
  - What about read-address mode?

These tables contain entries called ***segment descriptors*** that provide the base address of the segments as well as access rights, type, and usage information.

Each segment descriptor has an associated ***segment selector*** that provides the software that uses it with
  - an ***index*** into the GDT or LDT (the offset of its associated segment descriptor),
  - a global/local flag that determines whether the selector points to the GDT or the LDT, and 
  - access rights information.

---

To access a byte in a segment, a segment selector and an offset must be supplied.
  - The segment selector provides access to the segment descriptor for the segment (in the GDT or LDT).
  - From the segment descriptor, the processor obtains the base address of the segment in the linear address space.
  - The offset provides the location of the byte relative to the base address.

This mechanism can be used to access any valid code, data, or stack segment, provided the segment is accessible from the current privilege level (CPL) at which the processor is operating. The CPL is defined as the protection level of the currently executing code segment.

---

`GDTR` and `LDTR` registers are expanded to 64-bits in both the IA-32e sub-modes.

Global and local descriptor tables are expanded in 64-bit mode to support 64-bit base addresses. In compatibility mode, descriptors are not expanded.

# Data Segment (DS) Descriptor

The following is a description of the data segment descriptor.

| Bit Position(s) | Description |
| --------------- | ----------- |
| 15:0  | Bits 15:0 of the segment limit. |
| 31:16 | Bits 15:0 of the segment's base address. |
| 39:32 | Bits 23:16 of the segment's base address. |
| 43:40 | Type Information. |
| | Bit 40 is the accessed (A) bit. |
| | Bit 41 is the writable (W) bit. |
| | Bit 42 is the expansion direction (E) bit. |
| | Bit 43 is reserved; must be 0. |
| 44 | Reserved; Hardcoded to 1. |
| 46:45 | (DPL) Descriptor Privilege Level |
| 47 | Present Bit |
| 51:48 | Bits 19:16 of the segment limit. |
| 52 | Available to the system programmers. |
| 53 | Reserved; must be 0. |
| 54 | (B) |
| 55 | (G) |
| 63:56 | Bits 31:24 of the segment's base address. |

```
                                                             [     TYPE    ]
[ BASE 31:24 ] [G] [B] [0] [AVL] [LIMIT 19:16] [P] [DPL] [1] [0] [E] [W] [A] [BASE 23:16]
31          24  23  22  21  20   19         16  15 14 13  12  11  10  9   8  7          0


[BASE Addr 15:00] [Segment Limit 15:00]
31             16 15                  0
```
  - (A): Accessed
  - (W): Writable
  - (E): Expansion Direction
  - (DPL): Descriptor Privilege Level
  - (P): Present
  - (LIMIT): Segment Limit
  - (AVL): Available to system programmers
  - (B): Big
  - (G): Granularity

---

# Code Segment (CS) Descriptor

```
                                                             [     TYPE    ]
[ BASE 31:24 ] [G] [D] [0] [AVL] [LIMIT 19:16] [P] [DPL] [1] [1] [C] [R] [A] [BASE 23:16]
31          24  23  22  21  20   19         16  15 14 13  12  11  10  9   8  7          0


[BASE Addr 15:00] [Segment Limit 15:00]
31             16 15                  0
```
  - (D): Default
  - (C): Conforming
  - (R): Readable

Code segments continue to exist in 64-bit mode even though, for address calculations, the segment base is treated as zero.

Some code-segment (CS) descriptor content (the base address and limit fields) is ignored; the remaining fields function normally (except for the readable bit in the type field).

Code segment descriptors and selectors are needed in IA-32e mode to establish the processor's operating mode and execution privilege-level. The usage is as follows.

The IA-32e mode uses a previously unused bit in the CS descriptor. Bit 53 is defined as the 64-bit (`L`) flag and is used to select between 64-bit mode and compatibility mode when IA-32e mode is active.

  - If `CS.L` is 0 and IA-32e mode is active, the processor is running in compatibility mode. In this case, `CS.D` selects the default size for data and addresses. If `CS.D` is 0, the default data and address size is 16 bits. If `CS.D` is 1, the default data and address size is 32 bits.

  - If `CS.L` is 1 and IA-32e mode is active, the only valid setting is `CS.D` is 0. This setting indicates a default operand size of 32 bits and a default address size of 64 bits. The `CS.L` is 1 and `CS.D` is 1 bit combination is reserved for future use and a `#GP` fault will be generated on an attempt to use a code segment with these bits set in IA-32e mode.

In IA-32e mode, the CS descriptor’s DPL is used for execution privilege checks.

---

# System-Segment Descriptor

```
                                                         [     TYPE    ]
[ BASE 31:24 ] [G] [] [0] [] [LIMIT 19:16] [P] [DPL] [0] [TYPE] [BASE 23:16]
31          24  23 22  21 20 19         16  15 14 13  12 11   8 7          0


[BASE Addr 15:00] [Segment Limit 15:00]
31             16 15                  0
```
  - Bits 22 and 20 are reserved.

---
