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

Control registers determine the operating mode of the processor and the characteristics of the currently executing task.

There are 5 control registers named `CR0`, `CR1`, `CR2`, `CR3` and `CR4`. They are 32 bits wide in legacy modes and IA-32e compatibility mode and are expanded to to 64 bits in IA-32e 64-bit mode.

There is a sixth control register named `CR8` available in the IA-32e 64-bit mode only.

| Control Register | Description |
| ---------------- | ----------- |
| `CR0` | Contains system control flags that control operating mode and states of the processor. |
| `CR1` | Reserved. |
| `CR2` | Contains the page-fault linear address (the linear address that caused a page fault). |
| `CR3` | Contains the physical address of the base of the paging-structure hierarchy and four flags (`PWT`, `PCD`, `LAM_U57`, and `LAM_U48`). |
| | When using the physical address extension (PAE), it contains the base address of the page-directory-pointer table. |
| | With 4-level paging and 5-level paging, it contains the base address of the `PML4` and `PML5` tables, respectively. If PCIDs are enabled, CR3 has a different format. |
| `CR4` | Contains a group of flags that enable several architectural extensions, and indicate operating system or executive support for specific processor capabilities. |
| `CR8` | CR8 can be accessed only in 64-bit mode, but the value of the TPR blocks interrupts regardless of mode. |


The `MOV CRn` instructions are used to manipulate the register bits. In protected mode, the `MOV` instructions allow the control registers to be read or loaded at privilege level 0 only. Operand-size prefixes for these instructions are ignored.

Some of the bits in the control registers are reserved and must be written with zeros.
  - Attempting to set any reserved bits in CR0[31:0] is ignored. Attempting to set any reserved bits in CR0[63:32] results in a general-protection exception, #GP(0).
  - Attempting to set any reserved bits in `CR4` results in a general-protection exception, #GP(0).
  - All 64 bits of `CR2` are writable by software.
  - Bits in `CR3` in the range `63:MAXPHYADDR` that are reserved must be zero. Attempting to set any of them results in #GP(0).
  - The `MOV CR2` instruction does not check that address written to `CR2` is canonical.
  - A 64-bit capable processor will retain the upper 32 bits of each control register when transitioning out of IA-32e mode.
  - On a 64-bit capable processor, an execution of MOV to CR outside of 64-bit mode zeros the upper 32 bits of the control register.

---

### CR0 Flags

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (`PE`) Protection Enable Bit. | Enables protected mode when set; enables real-address mode when clear. |
| | | This flag does not enable paging directly. It only enables segment-level protection. To enable paging, both the `PE` and `PG` flags must be set. |
| 1 | (`MP`) Monitor Coprocessor | Controls the interaction of the `WAIT` or `FWAIT) instruction with the TS flag. |
| | | When set, a `WAIT` instruction generates a device-not-available exception (`#NM`) if the TS flag is also set. |
| | | When clear, the `WAIT` instruction ignores the setting of the TS flag. |
| 2 | (`EM`) Emulation Bit |
| 3 | (`TS`) Task Switched Bit |
| 4 | (`ET`) Extension Type | Reserved in the Pentium 4, Intel Xeon, P6 family, and Pentium processors. |
| | | In the Pentium 4, Intel Xeon, and P6 family processors, this flag is hardcoded to 1. |
| | | In the Intel386 and Intel486 processors, this flag indicates support of Intel 387 DX math coprocessor instructions when set. |
| 5 | (`NE`) Numeric Error |
| 15:6 | Reserved |
| 16 | (`WP`) Write Protect Bit | When set, inhibits supervisor-level procedures from writing into read-only pages; when clear, allows supervisor-level procedures to write into read-only pages regardless of the `U/S` bit. |
| | | It facilitates the implementation of the copy-on-write (CoW) method of creating a new process (forking) used by operating systems such as UNIX. This flag must be set before software can set `CR4.CET`, and it cannot be cleared as long as `CR4.CET` remains set. |
| 17 | Reserved |
| 18 | (`AM`) Alignment Mask | Enables automatic alignment checking when set; disables when clear. |
| | | Alignment checking is performed only when the `CR0.AM` bit is set, the `EFLAGS.AC` bit is set, the CPL is 3, and the processor is operating in either protected mode or virtual-8086 mode. |
| 28:19 | Reserved |
| 29 | (`NW`) Not Write-Through Bit |
| 30 | (`CD`) Cache Disable Bit |
| 31 | (`PG`) Paging Enable Bit | Enables paging when set; disables paging when clear |
| | | It has no effect if the `CR0.PE` bit is not set. Setting the PG bit when the PE bit is clear causes a `#GP`. |
| | | On Intel 64 processors, enabling and disabling IA-32e mode also requires modifying this bit. |


### CR3 Flags

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 2:0 | Reserved |
| 3 | (`PWD`) Page-level Write-Through | Controls the memory type used to access the first paging structure of the current paging-structure hierarchy. |
| | | This bit is not used if paging is disabled, with PAE paging, or with 4-level paging or 5-level paging if `CR4.PCIDE` is set. |
| 4 | (`PCD`) Page-level Cache Disable Bit | Controls the memory type used to access the first paging structure of the current paging-structure hierarchy. |
| | | This bit is not used if paging is disabled, with PAE paging, or with 4-level paging or 5-level paging if `CR4.PCIDE` is set. |
| 11:5 | Reserved |
| 60:12 | Page Directory Base |
| 61 | (`LAM_U57`) User LAM57 Enable Bit | When set and `CR3.LAM_U48` is clear, enables LAM57 (masking of linear-address bits 62:57) for user pointers. |
| 62 | (`LAM_U48`) User LAM48 Enable Bit | When set and `CR3.LAM_U57` is clear, enables LAM48 (masking of linear-address bits 62:48) for user pointers. |
| 63 | |


### CR4 Flags

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0  | (`VME`) Virtual-8086 Mode Extensions | Enables interrupt- and exception-handling extensions in virtual-8086 mode when set; disables the extensions when clear. |
| | | Use of the VME can improve the performance of virtual-8086 applications by eliminating the overhead of calling the virtual-8086 monitor to handle interrupts and exceptions that occur while executing an 8086 program and, instead, redirecting the interrupts and exceptions back to the 8086 program's handlers.
| | | It also provides hardware support for a virtual interrupt flag (`VIF`) to improve the reliability of running 8086 programs in multi-tasking and multiple-processor environments. |
| 1  | (`PVI`) Protected-Mode Virtual Interrupts | When set, enables hardware support for a virtual interrupt flag (`VIF`) in protected mode. When clear, disables the `VIF` flag in protected mode. |
| 2  | (`TSD`) Time-Stamp Disable Bit | When set, restricts the execution of the `RDTSC` instruction to procedures running at privilege level 0. Allows `RDTSC` instruction to be executed at any privilege level when clear. This bit also applies to the `RDTSCP` instruction if supported (if `CPUID.80000001H:EDX[27]` is set). |
| 3  | (`DE`) Debugging Exceptions | When set, references to debug registers `DR4` and `DR5` cause an undefined opcode (`#UD`) exception to be generated. |
| | | When clear, processor aliases references to registers `DR4` and `DR5` for compatibility with software written to run on earlier IA-32 processors. |
| 4  | (`PSE`) Page Size Extension | Enables 4 MiB pages with 32-bit paging when set; restricts 32-bit paging to pages of 4 KBytes when clear. |
| 5  | (`PAE`) Physical Address Extension | When set, enables paging to produce physical addresses with more than 32 bits. When clear, restricts physical addresses to 32 bits. |
| | | PAE must be set before entering IA-32e mode. |
| 6  | (`MCE`) Machine Check Enable | Enables the machine-check exception when set. |
| 7  | (`PGE`) Page Global | Enables the global page feature when set, disables when clear. |
| | | The global page feature allows frequently used or shared pages to be marked as global to all users (done with the global flag, bit 8, in a page directory pointer table entry, a page directory entry, or a page-table entry). |
| | | Global pages are not flushed from the translation-lookaside buffer (TLB) on a task switch or a write to `CR3`. |
| | | Paging must be enabled before setting this bit. Reversing this sequence may affect program correctness, and processor performance will be impacted. |
| 8  | (`PCE`) Performance-Monitoring Counter | Enables the execution of the `RDPMC` instruction for programs or procedures running at any protection level when set; The `RDPMC` instruction can be executed only at protection level 0 when clear. |
| 9  | (`OSFXSR`) |
| 10 | (`OSXMMEXCPT`) |
| 11 | (`UMIP`) User-Mode Instruction Prevention | When set, the following instructions cannot be executed if CPL > 0: `SGDT`, `SIDT`, `SLDT`, `SMSW`, and `STR`. An attempt at such execution causes a `#GP`. |
| 12 | (`LA57`) 57-bit linear addresses | The IA-32e mode receives this bit when a transition is made to it. It cannot modify the bit. |
| | | When set in IA-32e mode, the processor uses 5-level paging to translate 57-bit linear addresses. |
| | | When clear in IA-32e mode, the processor uses 4-level paging to translate 48-bit linear addresses. 
| 13 | (`VMXE`) VMX operation Enable Bit | Enables VMX operation when set. |
| 14 | (`SMXE`) SMX Enable Bit | Enables SMX operation when set. |
| 15 | Reserved |
| 16 | (`FSGSBASE`) FSGSBASE Enable Bit | Enables the instructions `RDFSBASE`, `RDGSBASE`, `WRFSBASE`, and `WRGSBASE`. |
| 17 | (`PCIDE`) PCID Enable Bit | Enables process-context identifiers (PCIDs) when set. Applies only in IA-32e mode (if `IA32_EFER.LMA` is set). |
| 18 | (`OSXSAVE`) |
| 19 | (`KL`) Key-Locker-Enable Bit |
| 20 | (`SMEP`) SMEP Enable Bit | Enables supervisor-mode execution prevention (SMEP) when set. |
| 21 | (`SMAP`) SMAP Enable Bit | Enables supervisor-mode access prevention (SMAP) when set. |
| 22 | (`PKE`) Enable protection keys for user-mode page | 4-level paging and 5-level paging associate each user-mode linear address with a protection key. |
| | | When set, this flag indicates (via `CPUID.07H.00H:ECX.OSPKE[4]`) that the operating system supports use of the `PKRU` register to specify, for each protection key, whether user-mode linear addresses with that protection key can be read or written. |
| | | This bit also enables access to the `PKRU` register using the `RDPKRU` and `WRPKRU` instructions. |
| 23 | (`CET`) Control-flow Enforcement Technology | Enables control-flow enforcement technology when set. |
| | | This flag can be set only if CR0.WP is set, and it must be cleared before CR0.WP can be cleared. |
| 24 | (`PKS`) Enable protection keys for supervisor-mode pages. | 4-level paging and 5-level paging associate each supervisor-mode linear address with a protection key. |
| | | When set, this flag allows the use of the `IA32_PKRS` MSR to specify, for each protection key, whether supervisor-mode linear addresses with that protection key can be read or written. |
| 25 | (`UINTR`) User Interrupt Enable Bit | Enables user interrupts when set, including user-interrupt delivery, user-interrupt notification identification, and the user-interrupt instructions. |
| 26 | Reserved |
| 27 | (`LASS`) Linear-address-space Separation | When set, enables LASS. |
| 28 | (`LAM_SUP`) Supervisor LAM Enable Bit. | When set, enables LAM (linear-address masking) for supervisor pointers. |
| 31:29 | Reserved |
| 32 | (`FRED`) Enable FRED | When set, enables FRED transitions. |
| 63:33 | Reserved |


***[NOTE]: Not all the flags in `CR4` are implemented on all processors. With the exception of the `PCE` flag, they can be qualified with the `CPUID` instruction to determine if they are implemented on the processor before they are used.***

---

### CR8 Flags

| Bit Position(s) | Description |
| --------------- | ----------- |
| 0 |
| 1 |
| 2 |
| 3 |
| 63:4 | Reserved |


## Extended Control Registers

If `CPUID.01H:ECX.XSAVE[26]` is 1, the processor supports one or more extended control registers (XCRs).

Currently, the only such register defined is `XCR0`. This register specifies the set of processor state components for which the operating system provides context management, e.g., x87 FPU state, SSE state, AVX state. The OS programs `XCR0` to reflect the features for which it provides context management.

---

## Protection-Key Rights Registers

Processors may support either or both of two protection-key rights registers:
  - `PKRU` for user-mode pages and
  - `IA32_PKRS` MSR for supervisor-mode pages.

4-level paging and 5-level paging associate a 4-bit protection key with each page. The protection-key rights registers determine accessibility based on a page's protection key.

If `CPUID.07H.00H:ECX.PKU[3]` is 1, the processor supports the protection-key feature for user-mode pages. When `CR4.PKE` is 1, software can use the protection-key rights register for user pages (`PKRU`) to specify the access rights for user-mode pages for each protection key.

If `CPUID.07H.00H:ECX.PKS[31]` is 1, the processor supports the protection-key feature for supervisor-mode pages. `When CR4.PKS` is 1, software can use the protection-key rights register for supervisor pages (the `IA32_PKRS` MSR) to specify the access rights for supervisor-mode pages for each protection key.

---

# Chapter 3: Protected-Mode Memory Management

The memory management facilities of the IA-32 architecture are divided into two parts: segmentation and paging.

Segmentation provides a mechanism of isolating individual code, data, and stack modules so that multiple programs (or tasks) can run on the same processor without interfering with one another.

Paging provides a mechanism for implementing a conventional demand-paged, virtual-memory system where sections of a program's execution environment are mapped into physical memory as needed. Paging can also be used to provide isolation between multiple tasks.

When operating in protected mode, some form of segmentation must be used. There is no mode bit to disable segmentation. The use of paging, however, is optional.

---

Segmentation provides a mechanism for dividing the processor's addressable memory space called, ***the linear address space*** into smaller protected address spaces called segments.

Segments can be used to hold the code, data, and stack for a program or to hold system data structures (such as a TSS or LDT).

If more than one program (or task) is running on a processor, each program can be assigned its own set of segments. The processor then enforces the boundaries between these segments and ensures that one program does not interfere with the execution of another program by writing into the other program's segments.

The segmentation mechanism also allows typing of segments so that the operations that may be performed on a particular type of segment can be restricted.

---

The segmentation mechanism supported by the IA-32 architecture can be used to implement a wide variety of system designs. These designs range from flat models that make only minimal use of segmentation to protect programs to multi-segmented models that employ segmentation to create a robust operating environment in which multiple programs and tasks can be executed reliably.

The following sections give several examples of how segmentation can be employed in a system to improve memory management performance and reliability.

## Using Segments

### Basic Flat Model

It is the simplest memory model for a system. The operating system and application programs get access to a continuous, unsegmented address space.

To the greatest extent possible, the basic flat model hides the segmentation mechanism of the architecture from both the system designer and the application programmer.

To implement a basic flat memory model with the IA-32 architecture, at least two segment descriptors must be created, one for referencing a code segment and one for referencing a data segment.
  - Both of these segments, however, are mapped to the entire linear address space. Both segment descriptors have the same base address value of 0 and the same segment limit of 4 GiB.
  - By setting the segment limit to 4 GiB, the segmentation mechanism is kept from generating exceptions for out of limit memory references, even if no physical memory resides at a particular address.
  - ROM (EPROM) is generally located at the top of the physical address space, because the processor begins execution at `0xFFFF_FFF0`.
  - RAM (DRAM) is placed at the bottom of the address space because the initial base address for the `DS` data segment after reset initialization is 0.

---

### Protected Flat Model

The protected flat model is similar to the basic flat model, except the segment limits are set to include only the range of addresses for which physical memory actually exists. 

A general-protection exception (`#GP`) is then generated on any attempt to access nonexistent memory. This model provides a minimum level of hardware protection against some kinds of program bugs.

More complexity can be added to this protected flat model to provide more protection. For example, for the paging mechanism to provide isolation between user and supervisor code and data, four segments need to be defined:
  - code and data segments at privilege level 3 for the user, and 
  - code and data segments at privilege level 0 for the supervisor.

  Usually these segments all overlay each other and start at address 0 in the linear address space.

This flat segmentation model along with a simple paging structure can protect the operating system from applications, and by adding a separate paging structure for each task or process, it can also protect applications from each other.

---

### Multi-Segment Model

A multi-segment model uses the full capabilities of the segmentation mechanism to provide hardware enforced protection of code, data structures, and programs and tasks.

Here, each program (or task) is given its own table of segment descriptors and its own segments. The segments can be completely private to their assigned programs or shared among programs. Access to all segments and to the execution environments of individual programs running on the system is controlled by hardware.

Access checks can be used to protect not only against referencing an address outside the limit of a segment, but also against performing disallowed operations in certain segments. For example, since code segments are designated as read-only segments, hardware can be used to prevent writes into code segments.

The access rights information created for segments can also be used to set up protection rings or levels. Protection levels can be used to protect operating-system procedures from unauthorized access by application programs.

---

### Segmentation In IA-32e Mode

In IA-32e mode of Intel 64 architecture, the effects of segmentation depend on whether the processor is running in compatibility mode or 64-bit mode. In compatibility mode, segmentation functions just as it does using legacy 16-bit or 32-bit protected mode semantics.

In 64-bit mode, segmentation is generally (but not completely) disabled, creating a flat 64-bit linear-address space.
  - The processor treats the segment base of `CS`, `DS`, `ES`, `SS` as zero, creating a linear address that is equal to the effective address.
  - The `FS` and `GS` segments are exceptions. These segment registers can be used as additional base registers in linear address calculations. They facilitate addressing local data and certain operating system data structures.

Note that the processor does not perform segment limit checks at runtime in 64-bit mode.

---

### Paging and Segmentation

Paging can be used with any of the segmentation models described above.

The processor's paging mechanism divides the linear address space (into which segments are mapped) into pages. These  linear-address-space pages are then mapped to pages in the physical address space.

The paging mechanism offers several page-level protection facilities that can be used with or instead of the segment-protection facilities. For example, it lets read-write protection be enforced on a page-by-page basis.

The paging mechanism also provides two-level user-supervisor protection that can also be specified on a page-by-page basis.

---

## Physical Address Space

In protected mode, the IA-32 architecture provides a normal physical address space of 4 GiB (2<sup>32</sup> bytes). This is the address space that the processor can address on its address bus. This address space is flat (unsegmented), with the address range `[0, 0xFFFFFFFF]`. This physical address space can be mapped to read-write memory, read-only memory, and memory mapped I/O.

Starting with the Pentium Pro processor, the IA-32 architecture also supports an extension of the physical address space to 2<sup>36</sup> bytes (64 GiB), with a maximum physical address of `0xFFFFFFFFF`. This extension is invoked in either of the two ways:

  - Using the physical address extension `CR4.PAE` flag.
  - Using the 36-bit page size extension (PSE-36) feature (introduced in the Pentium III processors).

Physical address support has since been extended beyond 36 bits.

On processors that support the Intel 64 architecture (`CPUID.80000001H:EDX[29]` is 1), the size of the physical address range is implementation-specific and indicated by `CPUID.80000008H:EAX[7:0]`.

---

## Logical and Linear Address

At the system-architecture level in protected mode, the processor uses two stages of address translation to arrive at a physical address: logical-address translation and linear address space paging.

Even with the minimum use of segments, every byte in the processor's address space is accessed with a logical address.
  - ***A logical address*** consists of a 16-bit segment selector and a 32-bit offset.
  - The segment selector identifies the segment the byte is located in and the offset specifies the location of the byte in the segment relative to the base address of the segment.

The processor translates every logical address into a linear address.
  - ***A linear address*** is a 32-bit address in the processor's linear address space. Like the physical address space, the linear address space is a flat (unsegmented), 2<sup>32</sup> byte address space, with an address range of `[0 to 0xFFFFFFFF]`.
  - The linear address space contains all the segments and system tables defined for a system.

---

To translate a logical address into a linear address, the processor does the following:

  1. Uses the offset in the segment selector to locate the segment descriptor for the segment in the GDT or LDT and reads it into the processor. (This step is needed only when a new segment selector is loaded into a segment register.)

  2. Examines the segment descriptor to check the access rights and range of the segment to ensure that the segment is accessible and that the offset is within the limits of the segment.

  3. Adds the base address of the segment from the segment descriptor to the offset to form a linear address.

---

If paging is not used, the processor maps the linear address directly to a physical address, that is, the linear address goes out on the processor's address bus.

If the linear address space is paged, a second level of address translation is used to translate the linear address into a physical address.

---

In the IA-32e mode, an Intel 64 processor uses the steps described above to translate a logical address to a linear address. In 64-bit mode, the offset and base address of the segment are 64-bits instead of 32 bits. The linear address format is also 64 bits wide and is subject to ***linear-address pre-processing***.

Each code segment descriptor provides an `L` bit. This bit allows a code segment to execute 64-bit code or legacy 32-bit code by code segment.

---

### Segment Selectors

A segment selector is a 16-bit identifier for a segment. It does not point directly to the segment, but instead points to the segment descriptor that defines the segment.

A segment selector contains the following items:

***Index*** selects one of the 8192 descriptors in the GDT or LDT.
  - It is a 13 bit value specified by the bits 15:3.
  - The processor multiplies the index value by 8 (the number of bytes in a segment descriptor) and adds the result to the base address of the GDT or LDT (from the GDTR or LDTR register, respectively).

***Table Indicator (TI) Flag*** is the bit 2 in a segment selector that specifies the descriptor table to use.
  - Clearing this flag selects the GDT.
  - Setting this flag selects the current LDT.

***Request Privilege Level (RPL)***: The bits 1:0 specify the privilege level of the selector. The privilege level can range from 0 to 3, with 0 being the most privileged level.

---

The first entry of the GDT is not used by the processor.
  - A segment selector that points to this entry of the GDT (that is, a segment selector with an index of 0 and the TI flag set to 0) is used as a "null segment selector."
  - The processor does not generate an exception when a segment register (other than the `CS` or `SS` registers) is loaded with a null selector. It does, however, generate an exception when a segment register holding a null selector is used to access memory.
  - A null selector can be used to initialize unused segment registers. Loading the `CS` or `SS` register with a null segment selector causes a `#GP` to be generated.

Segment selectors are visible to application programs as part of a pointer variable, but the values of selectors are usually assigned or modified by link editors or linking loaders, not application programs.

---

### Segment Registers

To reduce address translation time and coding complexity, the processor provides registers for holding up to 6 segment selectors. Each of these segment registers support a specific kind of memory reference (code, stack, or data).

For virtually any kind of program execution to take place, at least the code-segment (`CS`), data-segment (`DS`), and stack-segment (`SS`) registers must be loaded with valid segment selectors.

The processor also provides three additional data-segment registers (`ES`, `FS`, and `GS`), which can be used to make additional data segments available to the currently executing program (or task).

For a program to access a segment, the segment selector for the segment must have been loaded in one of the segment registers. So, although a system can define thousands of segments, only 6 can be available for immediate use. Other segments can be made available by loading their segment selectors into these registers during program execution.

---

Every segment register has a "visible" part and a "hidden" part. The hidden part is sometimes referred to as a "descriptor cache" or a "shadow register".

When a segment selector is loaded into the visible part of a segment register, the processor also loads the hidden part of the segment register with the base address, segment limit, and access control information from the segment descriptor pointed to by the segment selector.

The information cached in the segment register (visible and hidden) allows the processor to translate addresses without taking extra bus cycles to read the base address and limit from the segment descriptor.

In systems in which multiple processors have access to the same descriptor tables, it is the responsibility of software to reload the segment registers when the descriptor tables are modified. If this is not done, an old segment descriptor cached in a segment register might be used after its memory-resident version has been modified.

---

Two kinds of load instructions are provided for loading the segment registers:

  1. Direct load instructions such as the `MOV`, `POP`, `LDS`, `LES`, `LSS`, `LGS`, and `LFS` instructions. These instructions explicitly reference the segment registers.

  2. Implied load instructions such as the far pointer versions of the `CALL`, `JMP`, and `RET` instructions, the `SYSENTER` and `SYSEXIT` instructions, and the `IRET`, `INT n`, `INTO`, `INT3`, and `INT1` instructions. These instructions change the contents of the CS register (and sometimes other segment registers) as an incidental part of their operation.

The `MOV` instruction can also be used to store the visible part of a segment register in a general-purpose register.

---

### Segment Loading Instructions in IA-32e Mode

Because `ES`, `DS`, and `SS` segment registers are not used in 64-bit mode, their fields (base, limit, and attribute) in segment descriptor registers are ignored.
  - Some forms of segment load instructions are also invalid (for example, `LDS`, `POP ES`).
  - Address calculations that reference the `ES`, `DS`, or `SS` segments are treated as if the segment base is zero.

The processor performs ***linear-address pre-processing*** instead of performing limit checks. Mode switching does not change the contents of the segment registers or the associated descriptor registers. These registers are also not changed during 64-bit mode execution, unless explicit segment loads are performed.

In order to set up compatibility mode for an application, segment-load instructions (MOV to Sreg, POP Sreg) work normally in 64-bit mode. An entry is read from the system descriptor table (GDT or LDT) and is loaded in the hidden portion of the segment register. The descriptor-register base, limit, and attribute fields are all loaded. However, the contents of the data and stack segment selector and the descriptor registers are ignored.

When `FS` and `GS` segment overrides are used in 64-bit mode, their respective base addresses are used in the linear address calculation: (`FS` or `GS`).base + index + displacement. `FS.base` and `GS.base` are then expanded to the full linear-address size supported by the implementation. The resulting effective address calculation can wrap across positive and negative addresses; the resulting address is subject to linear-address pre-processing.

In 64-bit mode, memory accesses using `FS`-segment and `GS`-segment overrides are not checked for a runtime limit nor subjected to attribute-checking. Normal segment loads (MOV to Sreg and POP Sreg) into `FS` and `GS` load a standard 32-bit base value in the hidden portion of the segment register. The base address bits above the standard 32 bits are cleared to 0 to allow consistency for implementations that use less than 64 bits.

The hidden descriptor register fields for `FS.base` and `GS.base` are physically mapped to MSRs in order to load all address bits supported by a 64-bit implementation. Software with CPL = 0 (privileged software) can load all supported linear-address bits into `FS.base` or `GS.base` using `WRMSR`. Addresses written into the 64-bit `FS.base` and `GS.base` registers must be in canonical form. A `WRMSR` instruction that attempts to write a non-canonical address to those registers causes a `#GP` fault.

When in compatibility mode, `FS` and `GS` overrides operate as defined by 32-bit mode behavior regardless of the value loaded into the upper 32 linear-address bits of the hidden descriptor register base field. Compatibility mode ignores the upper 32 bits when calculating an effective address.

A new 64-bit mode instruction, `SWAPGS`, can be used to load `GS` base. `SWAPGS` exchanges the kernel data structure pointer from the `IA32_KERNEL_GS_BASE` MSR with the `GS` base register. The kernel can then use the `GS` prefix on normal memory references to access the kernel data structures. An attempt to write a non-canonical value (using `WRMSR`) to the `IA32_KERNEL_GS_BASE` MSR causes a `#GP` fault.

---

### Segment Descriptors

A segment descriptor is a data structure in a GDT or LDT that provides the processor with the size and location of a segment, as well as access control and status information.

Segment descriptors are typically created by compilers, linkers, loaders, or the operating system or executive, but not application programs.

Below is a description of a segment descriptor's format.