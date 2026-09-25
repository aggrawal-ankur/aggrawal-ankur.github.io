---
title: "A Dump of My Findings in the Intel SDM Volume 3"
publishDate: "2026-09-24"
# updatedDate: "2026-M-D"
description: "A dump of my findings in the Intel SDM volume 3"
tags: [ intel-sdm ]
draft: true
---

# Chapter 2: System Architecture Overview

## System Level Architecture

System-level architecture consists of a set of registers, data structures, and instructions designed to support basic system-level operations such as memory management, interrupt and exception handling, task management, and control of multiple processors.

### Descriptor Tables (Global and Local)

When operating in protected mode, all memory accesses pass through either the global descriptor table (GDT) or an optional local descriptor table (LDT). The linear addresses of the base of these tables are contained in the `GDTR` and the `LDTR` registers, respectively.

These tables contain entries called ***segment descriptors*** that provide the base address of segments as well as access rights, type, and usage information.

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

---

### System Segments, Segment Descriptors, and Gates

Besides code, data, and stack segments that make up the execution environment of a program or procedure, the architecture defines two system segments: the ***task-state segment*** (`TSS`) and the ***LDT***.

The GDT is not considered a segment because it is not accessed by means of a segment selector and segment descriptor. TSSs and LDTs have segment descriptors defined for them.

---

The architecture also defines a set of special descriptors called ***gates***. There are call gates, interrupt gates, trap gates, and task gates.

They provide protected gateways to system procedures and handlers that may operate at a different privilege level than application programs and most procedures. They also facilitate transitions between 16-bit and 32-bit code segments, and vice versa.

For example, a `CALL` to a call gate can provide access to a procedure in a code segment that is at the same or a numerically lower privilege level (more privileged) than the current code segment.

To access a procedure through a call gate, the calling procedure supplies the selector for the call gate.

  - The processor then performs an access rights check on the call gate, comparing the CPL with the privilege level of the call gate and the destination code segment pointed to by the call gate.

  - If access to the destination code segment is allowed, the processor gets the segment selector for the destination code segment and an offset into that code segment from the call gate.

  - If the call requires a change in privilege level, the processor also switches to the stack for the targeted privilege level.

  - The segment selector for the new stack is obtained from the `TSS` for the currently running task.

---

In the IA-32e mode, the following descriptors are 16-byte descriptors, expanded to allow a 64-bit base: LDT descriptors, 64-bit TSSs, call gates, interrupt gates, and trap gates.

  - Call gates facilitate transitions between 64-bit mode and compatibility mode.
  - Task gates are not supported in the IA-32e mode.
  - On privilege level changes, stack segment selectors are not read from the TSS. Instead, they are set to NULL.

---

### Task-State Segments and Task Gates

The `TSS` defines the state of the execution environment for a task. It includes the state of 
  - general-purpose registers, 
  - segment registers, 
  - the `EFLAGS` register, 
  - the `EIP` register, and 
  - segment selectors with stack pointers for three stack segments (one stack for each privilege level). 

  The TSS also includes the segment selector for the `LDT` associated with the task and the base address of the paging-structure hierarchy.

---

All program execution in the protected mode happens within the context of a task, called ***the current task***.

The segment selector for the `TSS` for the current task is stored in the task register.

The simplest method for switching to a task is to make a call or jump to the new task. Here, the segment selector for the `TSS` of the new task is given in the `CALL` or `JMP` instruction.

The processor performs the following actions while switching tasks:

  1. Stores the state of the current task in the current `TSS`.
  2. Loads the task register with the segment selector for the new task.
  3. Accesses the new `TSS` through a segment descriptor in the GDT.
  4. Loads the state of the new task from the new `TSS` into the general-purpose registers, the segment registers, the `LDTR`, control register `CR3` (base address of the paging-structure hierarchy), the `EFLAGS` register, and the `EIP` register.
  5. Begins execution of the new task.

A task can also be accessed through a *task gate*. A task gate is similar to a call gate, except that it provides access (through a segment selector) to a TSS rather than a code segment.

---

Hardware task switches are not supported in the IA-32e mode. However, TSSs continue to exist. The base address of a TSS is specified by its descriptor.

The task register is expanded to hold 64-bit base addresses in the IA-32e mode.

A 64-bit TSS holds the following information that is important to 64-bit operation:
  - Stack pointer addresses for each privilege level.
  - Pointer addresses for the interrupt stack table.
  - Offset address of the IO-permission bitmap (from the TSS base).

---

### Interrupt and Exception Handling

***`[Note]`: The material in this section does not apply when FRED transitions are enabled.***

---

External interrupts, software interrupts and exceptions are handled through the interrupt descriptor table (IDT). The IDT stores a collection of gate descriptors that provide access to interrupt and exception handlers.

Like the GDT, the IDT is not a segment. The linear address for the base of the IDT is contained in the IDT register (`IDTR`).

---

Gate descriptors in the IDT can be interrupt, trap, or task gate descriptors. To access an interrupt or exception handler,
  - the processor first receives an interrupt vector from internal hardware, an external interrupt controller, or from software by means of an `INT n`, `INTO`, `INT3`, `INT1`, or `BOUND` instruction. 
  - The interrupt vector provides an index into the IDT.
  - If the selected gate descriptor is an interrupt gate or a trap gate, the associated handler procedure is accessed in a manner similar to calling a procedure through a call gate.
  - If the descriptor is a task gate, the handler is accessed through a task switch.

---

In the IA-32e mode (both sub modes), interrupt gate descriptors are expanded to 16 bytes to support 64-bit base addresses.

The `IDTR` register is expanded to hold a 64-bit base address. Task gates are not supported.

---

### Memory Management

System architecture supports either direct physical addressing of memory or virtual memory (through paging).

When physical addressing is used, a linear address is treated as a physical address. When paging is used, all code, data, stack, and system segments (including the GDT and IDT) can be paged with only the most recently accessed pages being held in physical memory.

The location of pages (sometimes called page frames) in physical memory is contained in the paging structures. These structures reside in physical memory.

The base physical address of the paging-structure hierarchy is contained in the control register `CR3`. The entries in the paging structures determine the physical address of the base of a page frame, access rights and memory management information.

To use this paging mechanism, a linear address is broken into parts. The parts provide separate offsets into the paging structures and the page frame. A system can have a single hierarchy of paging structures or several.

---

In the IA-32e mode, physical memory pages are managed by a set of system data structures. In both sub modes, four or five levels of system data structures are used. These include the following.

***The page map level 5 (PML5)***: An entry in the `PML5` table contains the physical address of the base of a `PML4` table, access rights, and memory management information.
  - The base physical address of the PML5 table is stored in `CR3`.
  - The `PML5` table is used only with 5-level paging.

***A page map level 4 (PML4)***: An entry in a `PML4` table contains the physical address of the base of a page directory pointer table (`PDPT`), access rights, and memory management information. With 4-level paging, there is only one `PML4` table and its base physical address is stored in `CR3`.

A set of ***page directory pointer tables (PDPTs)***: An entry in a page directory pointer table contains the physical address of the base of a page directory table (`PD`), access rights, and memory management information.

Sets of ***page directories***: An entry in a page directory table contains the physical address of the base of a page table (PT), access rights, and memory management information.

Sets of ***page tables***: An entry in a page table contains the physical address of a page frame, access rights, and memory management information.

---

### System Registers

Discussed in volume 1

---

## Modes of Operation

Discussed in volume 1

---

### Extended Feature Enable Register (EFER)

The `IA32_EFER` MSR provides several fields related to IA-32e mode enabling and operation. It also provides one field that relates to page-access right modification.

| Bit Position(s) | Description | Access |
| --------------- | ----------- | ------ |
| 0 | Enable SYSCALL/SYSRET instructions in 64-bit mode. | R/W |
| 7:1 | Reserved |
| 8 | Enables IA-32e mode operation. | R/W |
| 9 | Reserved |
| 10 | Indicates that the IA-32e mode is active when set. | R |
| 11 | "Execute Disable Bit" Enable. Enables page access restriction by preventing instruction fetches from PAE pages with the XD bit set. | R/W |
| 63:12 | Reserved |

---

### System Flags and Fields in the EFLAGS Register

Discussed in volume 1

---

## Memory Management Registers

The processor provides four memory-management registers (`GDTR`, `LDTR`, `IDTR`, and `TR`) that specify the locations of the data structures which control segmented memory management. Special instructions are provided for loading and storing these registers.

### Global Descriptor Table Register (GDTR)

The `GDTR` register holds the base address (32 bits in protected mode; 64 bits in IA-32e mode) and the 16-bit table limit for the GDT.
  - The base address specifies the linear address of byte 0 of the GDT.
  - The table limit specifies the number of bytes in the table.

The `LGDT` and `SGDT` instructions load and store the `GDTR` register, respectively.

On power up or reset of the processor, the base address is set to the default value of 0 and the limit is set to `0x0FFFF`. A new base address must be loaded into the `GDTR` as part of the processor initialization process for protected-mode operation.

---

### Local Descriptor Table Register (LDTR)

The `LDTR` register holds the 16-bit segment selector, base address (32 bits in protected mode; 64 bits in IA-32e mode), segment limit, and descriptor attributes for the LDT.
  - The base address specifies the linear address of byte 0 of the LDT segment.
  - The segment limit specifies the number of bytes in the segment.

The `LLDT` and `SLDT` instructions load and store the segment selector part of the `LDTR` register, respectively. The segment that contains the LDT must have a segment descriptor in the GDT.

When the `LLDT` instruction loads a segment selector in the LDTR: the base address, limit, and descriptor attributes from the LDT descriptor are automatically loaded in the LDTR.

When a task switch occurs, the `LDTR` is automatically loaded with the segment selector and descriptor for the LDT for the new task. The contents of the `LDTR` are not automatically saved prior to writing the new LDT information into the register.

On power up or reset of the processor, the segment selector and base address are set to the default value of 0 and the limit is set to `0x0FFFF`.

---

### Interrupt Descriptor Table Register (IDTR)

The `IDTR` register holds the base address (32 bits in protected mode; 64 bits in IA-32e mode) and 16-bit table limit for the IDT.
  - The base address specifies the linear address of byte 0 of the IDT.
  - The table limit specifies the number of bytes in the table.

The `LIDT` and `SIDT` instructions load and store the `IDTR` register, respectively.

On power up or reset of the processor, the base address is set to the default value of 0 and the limit is set to `0x0FFFF`. The base address and limit in the register can then be changed as part of the processor initialization process.

---

### Task Register (TR)

The task register holds the 16-bit segment selector, base address (32 bits in protected mode; 64 bits in IA-32e mode), segment limit, and descriptor attributes for the `TSS` of the current task.

  - The selector references the TSS descriptor in the GDT.
  - The base address specifies the linear address of byte 0 of the TSS.
  - The segment limit specifies the number of bytes in the TSS.

The `LTR` and `STR` instructions load and store the segment selector part of the task register, respectively.

When the `LTR` instruction loads a segment selector in the task register, the base address, limit, and descriptor attributes from the TSS descriptor are automatically loaded into the task register.

On power up or reset of the processor, the base address is set to the default value of 0 and the limit is set to `xFFFF`.

When a task switch occurs, the task register is automatically loaded with the segment selector and descriptor for the `TSS` for the new task. The contents of the task register are not automatically saved prior to writing the new `TSS` information into the register.

---

## Control Registers