---
title: "A Dump of My Findings"
publishDate: "2026-09-22"
# updatedDate: "2026-M-D"
description: "A dump of my findings in the Intel SDM"
tags: [ intel-sdm ]
draft: true
---

# Chapter 1: Addressing

The processor uses ***byte addressing***. The memory is organized and accessed as a sequence of bytes. The range of memory that can be addressed is called an **address space**.

---

The processor also supports ***segmented addressing***. This is a form of addressing where a program may have many independent address spaces, called ***segments***.

For example, a program can keep its code (instructions) and stack in separate segments. Code addresses would always refer to the code space, and stack addresses would always refer to the stack space.

The following notation is used to specify a byte address within a segment:
```
segment-register:byte-address
```

For example ~
  - `DS:FF79H` identifies the byte at address `FF79H` (0xFF79) in the data segment.
  - `CS:EIP` identifies an instruction address in the code segment.

---

# Chapter 2

## History of Intel 64 and IA-32 Architectures

### 16-Bit Processors and Segmentation (1978)

The 8086 processor has 16-bit registers and a 16-bit external data bus, with 20-bit addressing giving a 1-MByte address space. The 8088 is similar to the 8086, except it has an 8-bit external data bus.

The 8086/8088 processors introduced segmentation to the IA-32 architecture.
  - With segmentation, a 16-bit segment register contains a pointer to a memory segment of up to 64 KiB (65536 bytes).
  - Using four segment registers at a time, the 8086/8088 processors are able to address up to 256 KiB (256*1024 bytes) without switching between segments.
  - The 20-bit addresses that can be formed using a segment register and an additional 16-bit pointer provide a total address range of 1 MiB (1000 KiB).

---

### The Intel 286 Processor (1982)

The 80286 processor introduced ***protected mode operation***.

---

### The Intel 386 Processor (1985)

The 80386 processor was the first 32-bit processor in the IA-32 architecture family.
  - It introduced 32-bit registers for use both to hold operands and for addressing.
  - The lower half of each 32-bit register retains the properties of the 16-bit registers of earlier generations, permitting backward compatibility.

The 80386 processor also provides a virtual-8086 mode that allows for even greater efficiency when executing programs created for the 8086/8088 processors.

The 80386 processor also supported:
  - A 32-bit address bus that supports up to 4 GiB of physical memory.
  - A segmented-memory model and a flat memory model.
  - Paging, with a fixed 4 KiB page size providing a method for virtual memory management.
  - Support for parallel stages.

---

### The Intel 486 Processor (1989)

The 80486 processor added more parallel execution capability by expanding the 80386 processor's instruction decode and execution units into five pipelined stages. Each stage operates in parallel with the others on up to five instructions in different stages of execution.

The 80486 processor also added:
  - An 8 KiB on-chip first-level (L1) cache that increased the percent of instructions that could execute at the scalar rate of one per clock.
  - An integrated x87 FPU.
  - Power saving and system management capabilities.

---

### The Intel Pentium (80586) Processor (1993)

Among other things, the processor added:
  - extensions to make the virtual-8086 mode more efficient and allow for 4 MiB as well as 4 KiB pages.
  - internal data paths of 128 and 256 bits added speed to internal data transfers.
  - burstable external data bus was increased to 64 bits.
  - an APIC (advanced programmable interrupt controller) to support systems with multiple processors.
  - a dual processor mode to support glueless two processor systems.

---

### The Intel Pentium 4 Processor Family (2000—2006)

***Intel 64 architecture*** was introduced in the Intel Pentium 4 Processor Extreme Edition supporting Hyper-Threading Technology and in the Intel Pentium 4 Processor 6xx and 5xx sequences.

***Intel Virtualization Technology*** (Intel VT) was introduced in the Intel Pentium 4 processor 672 and 662.

---

### The Intel Core i7 Processor Family (2008)

Introduced the second generation Intel Virtualization Technology (Intel VT).

---

## Intel 64 Architecture

Intel 64 architecture increases the linear address space for software to 64 bits and supports physical address space up to 52 bits. The technology also introduces a new operating mode referred to as ***IA-32e mode***.

The IA-32e mode operates in one of the two sub-modes:
  - ***compatibility mode*** enables a 64-bit operating system to run most legacy 32-bit software unmodified, and
  - ***64-bit mode*** enables a 64-bit operating system to run applications written to access the 64-bit address space.

In the 64-bit mode, applications may access:
  - a 64-bit flat linear addressing.
  - 8 additional general-purpose registers (GPRs).
  - 8 additional registers for streaming SIMD extensions (Intel SSE, SSE2, and SSE3, and SSSE3).
  - 64-bit-wide GPRs and instruction pointers.
  - Uniform byte-register addressing.
  - Fast interrupt-prioritization mechanism.
  - A new instruction-pointer relative-addressing mode.

An Intel 64 architecture processor supports existing IA-32 software because it is able to run all non-64-bit legacy modes supported by the IA-32 architecture. Most existing IA-32 applications also run in compatibility mode.

---

## Intel Virtualization Technology (Intel VT)

Intel Virtualization Technology for Intel 64 and IA-32 architectures provide extensions that support virtualization. The extensions are referred to as Virtual Machine Extensions (VMX). 

An Intel 64 or IA-32 platform with VMX can function as multiple virtual systems (or virtual machines). Each virtual machine can run operating systems and applications in separate partitions.

VMX also provides programming interface for a new layer of system software (called the Virtual Machine Monitor (VMM)) used to manage the operation of virtual machines.

---

# Chapter 3: Basic Execution Environment

## Modes of Operation

The operating mode determines which instructions and architectural features are accessible.

### IA-32 Architecture

The IA-32 architecture supports three basic operating modes: protected mode, real-address mode, and system management mode.

***Real-address mode*** implements the programming environment of the Intel 8086 processor with extensions (such as the ability to switch to protected or system management mode). The processor is placed in real-address mode following power-up or a reset.

---

***Protected mode***, the native state of the processor.
  - Among the capabilities of protected mode is the ability to directly execute ***real-address mode*** 8086 software in a protected, multi-tasking environment.
  - This feature is called ***virtual-8086 mode***, although it is not actually a processor mode. Virtual-8086 mode is actually a protected mode attribute that can be enabled for any task.

---

***System management mode (SMM)*** provides an operating system or executive with a transparent mechanism for implementing platform-specific functions such as power management and system security.
  - The processor enters SMM when the external SMM interrupt pin (SMI#) is activated or an SMI is received from the advanced programmable interrupt controller (APIC).
  - The processor switches to a separate address space while saving the basic context of the currently running program or task. SMM-specific code may then be executed transparently.
  - Upon returning from SMM, the processor is placed back into its state prior to the system management interrupt.
  - SMM was introduced with the Intel386 SL and Intel486 SL processors and became a standard IA-32 feature with the Pentium processor family.

---

### Intel 64 Architecture

The Intel 64 architecture introduces the IA-32e mode, which has two sub modes: compatibility mode and 64-bit mode.

***Compatibility Mode*** permits most legacy 16-bit and 32-bit applications to run without re-compilation under a 64-bit operating system.
  - It supports all the privilege levels that are supported in the 64-bit and protected modes.
  - Legacy applications that run in Virtual 8086 mode or use hardware task management will not work in this mode.
  - It is enabled by the operating system (OS) on a code segment basis. This means that a single 64-bit OS can support 64-bit applications running in 64-bit mode and support legacy 32-bit applications (not recompiled for 64-bits) running in compatibility mode.
  - It is similar to 32-bit protected mode. Applications access only the first 4 GiB of linear-address space. Compatibility mode uses 16-bit and 32-bit address and operand sizes. Like protected mode, this mode allows applications to access physical memory greater than 4 GiB using PAE (Physical Address Extensions).

---

***64-bit Mode*** enables a 64-bit operating system to run applications written to access 64-bit linear address space.
  - 64-bit mode extends the number of general purpose registers and SIMD extension registers from 8 to 16.
  - General purpose registers are widened to 64 bits. It also introduces a new opcode prefix (REX) to access the register extensions.
  - It is enabled by the operating system on a code-segment basis. Its default address size is 64 bits and its default operand size is 32 bits. The default operand size can be overridden on an instruction-by-instruction basis using a REX opcode prefix in conjunction with an operand size override prefix.
  - REX prefixes allow a 64-bit operand to be specified when operating in 64-bit mode. By using this mechanism, many existing instructions have been promoted to allow the use of 64-bit registers and 64-bit addresses.

## Basic Execution Environment (32-Bit, or IA-32)

Any program or task running on an IA-32 processor is given a set of resources for executing instructions and for storing code, data, and state information. These resources make up the basic execution environment for an IA-32 processor.

An Intel 64 processor supports the basic execution environment of an IA-32 processor, and a similar environment under IA-32e mode that can execute 64-bit programs (64-bit sub-mode) and 32-bit programs (compatibility sub-mode).

1. ***Address Space***: Any task or program running on an IA-32 processor can address a linear address space of up to 4 GiB (2<sup>32</sup> bytes) and a physical address space of up to 64 GiB (2<sup>36</sup> bytes).

2. ***Basic program execution registers***: The registers below make up the basic execution environment in which general-purpose instructions can be executed.
   - The eight general-purpose registers.
   - The six segment registers.
   - The EFLAGS register.
   - The EIP (instruction pointer) register. 

   These instructions perform basic integer arithmetic on byte, word, and doubleword integers, handle program flow control, operate on bit and byte strings, and address memory.

3. ***x87 FPU registers***: The registers below provide an execution environment for operating on single precision, double precision, and double extended precision floating-point values, word integers, doubleword integers, quadword integers, and binary coded decimal (BCD) values.
   - The eight x87 FPU data registers.
   - The x87 FPU control register.
   - The status register.
   - The x87 FPU instruction pointer register.
   - The x87 FPU operand (data) pointer register.
   - The x87 FPU tag register.
   - The x87 FPU opcode register 

4. ***MMX registers***: The eight `MMX` registers support execution of single-instruction, multiple-data (SIMD) operations on 64-bit packed byte, word, and doubleword integers.

5. ***XMM registers***: The eight `XMM` data registers and the `MXCSR` register support execution of SIMD operations on 128-bit packed single precision and double precision floating-point values and on 128-bit packed byte, word, doubleword, and quadword integers.

6. ***YMM registers***: The YMM data registers support execution of 256-bit SIMD operations on 256-bit packed single precision and double precision floating-point values and on 256-bit packed byte, word, doubleword, and quadword integers.

7. ***Bounds registers***: Each of the `BND0-BND3` register stores the lower and upper bounds (64 bits each) associated with the pointer to a memory buffer. They support execution of the Intel MPX instructions.

8. `BNDCFGU` configures user mode MPX operations on bounds checking. `BNDSTATUS` provides additional information on the #BR caused by an MPX operation.

9. ***Stack***: To support procedure or subroutine calls and the passing of parameters between procedures or subroutines, a stack and stack management resources are included in the execution environment. It is located in memory.

---

In addition to the resources provided in the basic execution environment, the IA-32 architecture provides the following resources as part of its system-level architecture. They provide extensive support for operating-system and system-development software.

1. ***I/O ports***: The IA-32 architecture supports a transfer of data to/from input/output (I/O) ports.

2. ***Control registers***: The five control registers (`CR0` through `CR4`) determine the operating mode of the processor and the characteristics of the currently executing task.

3. ***Memory management registers***: The `GDTR`, `IDTR`, task register, and `LDTR` specify the locations of data structures used in protected mode memory management.

4. ***Debug registers***: The debug registers (`DR0` through `DR7`) control and allow monitoring of the processor's debugging operations.

5. ***Memory type range registers (MTRRs)***: The MTRRs are used to assign memory types to regions of memory.

6. ***Model-specific registers (MSRs)***: The processor provides a variety of model-specific registers that are used to control and report on processor performance.

7. ***Machine check registers***: The machine check registers consist of a set of control, status, and error-reporting MSRs that are used to detect and report on hardware (machine) errors.

8. ***Performance monitoring counters***: They allow processor performance events to be monitored.

---

## 64-Bit Mode Execution Environment (IA-32e)

The execution environment for 64-bit mode is similar to the basic execution environment. Below are the differences.

1. ***Address space***:
   - A program running in 64-bit mode on an IA-32 processor can address linear address space of up to 2<sup>64</sup> bytes, (subjected to the canonical addressing requirements) and physical address space of up to 2<sup>52</sup> bytes.
   - Software can query `CPUID` for the physical address size supported by a processor.

2. ***Basic program execution registers***:
   - The number of general-purpose registers (GPRs) available here is 16. GPRs are 64-bits wide and they support operations on byte, word, doubleword, and quadword integers.
   - Accessing byte registers is done uniformly to the lowest 8 bits.
   - The instruction pointer register becomes 64 bits.
   - The `EFLAGS` register is extended to 64 bits wide, and is referred to as the `RFLAGS` register. The upper 32 bits of RFLAGS are reserved. The lower 32 bits remains the same as EFLAGS.

3. ***XMM registers***: There are 16 `XMM` data registers for SIMD operations.
4. ***YMM registers***: There are 16 `YMM` data registers for SIMD operations.
5. `BND` registers, `BNDCFGU`, `BNDSTATUS`.

6. ***Stack***: The stack pointer size is 64 bits. Stack size is not controlled by a bit in the SS descriptor (as it is in non-64-bit modes) nor can the pointer size be overridden by an instruction prefix.

7. ***Control registers***: Control registers expand to 64 bits. A new control register (the task priority register: `CR8` or `TPR`) has been added.

8. ***Debug registers*** — Debug registers expand to 64 bits.

9. ***Descriptor table registers*** — The global descriptor table register (`GDTR`) and interrupt descriptor table register (`IDTR`) expand to 10 bytes so that they can hold a full 64-bit base address. The local descriptor table register (`LDTR`) and the task register (`TR`) also expand to hold a full 64-bit base address.

---

## Memory Organization

The memory that the processor addresses on its bus is called ***physical memory***, which is organized as a sequence of *8-bit* bytes. Each byte is assigned a unique address, called a ***physical address***.

The physical address space range is [0, 2<sup>36</sup>-1], a total of 64 GiB, on a 32-bit processor.

### IA-32 Memory Models

When employing the processor's memory management facilities, programs do not address the physical memory directly. Instead, they access memory using one of three memory models: flat, segmented, or real address mode.

In the ***flat memory model***, the memory is a single, continuous address space, called *a linear address space*.
  - Code, data, and stack are all contained in this address space.
  - Linear address space is byte addressable, with addresses running contiguously from [0 to 2<sup>32 </sup> - 1]. An address for any byte in linear address space is called *a linear address*.

---

In the ***segmented memory model***, memory appears to a program as a group of independent address spaces called *segments*. Code, data, and stacks are typically contained in separate segments.
  - To address a byte in a segment, a program issues a *logical address*. This consists of a segment selector and an offset. The segment selector identifies the segment to be accessed and the offset identifies a byte in the address space of the segment.
  - Programs running on an IA-32 processor can address up to 16,383 segments of different sizes and types, and each segment can be as large as 2<sup>32</sup> bytes.

Internally, all the segments that are defined for a system are mapped into the processor's linear address space. To access a memory location, the processor translates a logical address into a linear address. This translation is transparent to the application program.

The primary reason for using segmented memory is to increase the reliability of programs and systems. For example, placing a program's stack in a separate segment prevents the it from growing and overwriting other segments.

---

***The real-address mode memory model*** is used by the Intel 8086 processor. It is supported to provide compatibility with existing programs written to run on the Intel 8086 processor.
  - It uses a specific implementation of the segmented memory model in which the linear address space for the program and the operating system/executive consists of an array of segments of up to 64 KiB in size each.
  - The maximum size of the linear address space in real-address mode is 2<sup>20</sup> bytes.

---

### Paging and Virtual Memory

With the flat or the segmented memory model, linear address space is mapped into the processor's physical address space either directly or through paging.

When using ***direct mapping***, each linear address has a *one-to-one correspondence* with a physical address and linear addresses are sent out on the processor's address lines without translation.

When using the IA-32 architecture's ***paging*** mechanism, the linear address space is divided into pages which are mapped to virtual memory. The pages of virtual memory are then mapped as needed into physical memory. When an operating system or executive uses paging, the paging mechanism is transparent to an application program. All that the application sees is linear address space.

The IA-32 architecture's paging mechanism includes extensions that support:
  - Physical Address Extensions (PAE) to address physical address space greater than 4 GiB.
  - Page Size Extensions (PSE) to map linear address to physical address in 4 MiB pages.

---

### Memory Organization in 64-Bit Mode

In 64-bit mode, there is architectural support for 64-bit linear address space. However, the processors supporting Intel 64 architecture may implement less than 64-bits.

The linear address space is mapped into the processor physical address space through the ***PAE paging mechanism***.

---

### Modes of Operation vs. Memory Model

When writing code for an IA-32 or Intel 64 processor, a programmer needs to know the operating mode the processor is going to be in when executing the code and the memory model being used.

| Mode of Operation | Memory Model |
| ----------------- | ------------ |
| IA-32 Real Mode | Real-address mode memory model. |
| IA-32 Protected Mode | Any memory model can be used, except when the processor is in the virtual-8086 mode, that's when real-address mode memory model is used. |
| IA-32 System Management Mode | When in SMM, the processor switches to a separate address space, called the ***system management RAM (SMRAM)***. The memory model used to address bytes in this address space is similar to the real-address mode model. |
| IA-32e Compatibility Mode | The same as 32-bit protected mode. |
| IA-32e 64-bit Mode | Segmentation is generally (but not completely) disabled, creating a flat 64-bit linear-address space. Specifically, the processor treats the segment base of `CS`, `DS`, `ES`, and `SS` as zero in 64-bit mode (this makes a linear address equal an effective address). Segmented and real address modes are not available in 64-bit mode. |

---

### 32-Bit and 16-Bit Address and Operand Sizes

IA-32 processors in protected mode can be configured for 32-bit or 16-bit address and operand sizes.

With 32-bit address and operand sizes, the maximum linear address or segment offset is `0xFFFFFFFF`, i.e. 2<sup>32</sup>-1 and operand sizes are typically 8 bits or 32 bits.

With 16-bit address and operand sizes, the maximum linear address or segment offset is `0xFFFF`, i.e. 2<sup>16</sup>-1 and operand sizes are typically 8 bits or 16 bits.

When using 32-bit addressing, a logical address consists of a 16-bit segment selector and a 32-bit offset. In 16-bit addressing, an address consists of a 16-bit segment selector and a 16-bit offset.

Instruction prefixes allow temporary overrides of the default address and/or operand sizes from within a program.

---

When operating in protected mode, the segment descriptor for the currently executing code segment defines the default address and operand size.
  - ***A segment descriptor*** is a system data structure not normally visible to application code.
  - Assembler directives allow the default addressing and operand size to be chosen for a program. The assembler and other tools then set up the segment descriptor for the code segment appropriately.

When operating in real-address mode, the default addressing and operand size is 16 bits. An address-size override can be used in real-address mode to enable 32-bit addressing. However, the maximum allowable 32-bit linear address is still `0x000FFFFF`, i.e. 2<sup>20</sup>-1.

---

### Extended Physical Addressing in Protected Mode

Beginning with the P6 family processors, the IA-32 architecture supports addressing of up to 64 GiB (2<sup>36</sup> bytes) of physical memory.

A program or task could not address locations in this address space directly. Instead, it addresses individual linear address spaces of up to 4 GiB that are mapped to a 64 GiB physical address space
through a virtual memory management mechanism. Using this mechanism, an operating system can enable a
program to switch 4 GiB linear address spaces within 64 GiB physical address space.

The use of extended physical addressing requires the processor to operate in protected mode and the operating system to provide a virtual memory management system.

---

### Address Calculations in 64-Bit Mode

In most cases, 64-bit mode uses flat address space for code, data, and stacks. If there is no address-size override, the size of effective address calculations is 64 bits. An effective-address calculation uses a
64-bit base and index registers and sign-extend displacements to 64 bits.

In the flat address space of 64-bit mode, linear addresses are equal to effective addresses because the base address is zero. However, if `FS` or `GS` segments are used with a non-zero base, this rule does not hold.

In 64-bit mode, the effective address components are added and the effective address is truncated before adding the full 64-bit segment base. The base is never truncated, regardless of addressing mode in 64-bit mode.

The instruction pointer (RIP) is extended to 64 bits to support 64-bit code offsets.

Generally, displacements and immediates in 64-bit mode are not extended to 64 bits. They are still limited to 32 bits and sign-extended during effective-address calculations. However, support is provided for 64-
bit displacement and immediate forms of the MOV instruction.

All 16-bit and 32-bit address calculations are zero-extended in IA-32e mode to form 64-bit addresses. 
  - Address calculations are first truncated to the effective address size of the current mode (64-bit mode or compatibility mode), as overridden by any address-size prefix. The result is then zero-extended to the full 64-bit address width.
  - Because of this, 16-bit and 32-bit applications running in compatibility mode can access only the low 4 GiB of the 64-bit mode effective addresses. Likewise, a 32-bit address generated in 64-bit mode can access only the low 4 GiB of the 64-bit mode effective addresses.

---

### Canonical Addressing

In 64-bit mode, an address is considered to be in canonical form if address bits 63 through to the most-significant implemented bit by the microarchitecture are set to either all ones or all zeros.

Intel 64 architecture defines a 64-bit linear address, but implementations can support less. The first implementation of IA-32 processors with Intel 64 architecture supports a 48-bit linear address. This means a canonical address must have bits 63 through 48 set to zeros or ones (depending on whether bit 47 is a zero or one).

Although implementations may not use all 64 bits of the linear address, they should check bits 63 through the most-significant implemented bit to see if the address is in the canonical form.
  - If a linear-memory reference is not in the canonical form, the implementation should generate an exception. In most cases, a general-protection exception (`#GP`) is generated.
  - Instructions that have implied stack references, by default, use the `SS` register. In these cases, the canonical fault is the stack fault (`#SS`).

If an instruction uses base registers `RSP`/`RBP` and uses a segment override prefix to specify a non-SS segment, a canonical fault generates a #GP (instead of an #SS).
  - In 64-bit mode, only `FS` and `GS` segment-overrides are applicable in this situation. Other segment override prefixes (`CS`, `DS`, `ES`, and `SS`) are ignored.
  - Note that this also means that an `SS` segment-override applied to a "non-stack" register reference is ignored. Such a sequence still produces a `#GP` for a canonical fault (and not an `#SS`).

---

## Basic Program Execution Registers

IA-32 architecture provides 16 basic program execution registers for use in general system and application programming. These registers can be grouped as follows:

- ***General-purpose registers***: These eight registers are available for storing operands and pointers.
- ***Segment registers***: These registers hold up to six segment selectors.
- `EFLAGS` ***(program status and control) register***: The `EFLAGS` register report on the status of the program being executed and allows limited (application-program level) control of the processor.
- `EIP` ***(instruction pointer) register***. The `EIP` register contains a 32-bit pointer to the next instruction to be executed.

---

### General-Purpose Registers

Some of the special uses of general-purpose registers are as follows:

  - `EAX` — Accumulator for operands and results data.
  - `EBX` — Pointer to data in the `DS` segment.
  - `ECX` — Counter for string and loop operations.
  - `EDX` — I/O pointer.
  - `ESI` — Pointer to data in the segment pointed to by the DS register; source pointer for string operations.
  - `EDI` — Pointer to data (or destination) in the segment pointed to by the ES register; destination pointer for string operations.
  - `ESP` — Stack pointer (in the `SS` segment).
  - `EBP` — Pointer to data on the stack (in the `SS` segment).

---

In 64-bit mode, there are 16 general purpose registers and the default operand size is 32 bits. However, general-purpose registers are able to work with either 32-bit or 64-bit operands. R8D-R15D/R8-R15 represent eight new general-purpose registers.
  - If a 32-bit operand size is specified: EAX, EBX, ECX, EDX, EDI, ESI, EBP, ESP, R8D - R15D are available.
  - If a 64-bit operand size is specified: RAX, RBX, RCX, RDX, RDI, RSI, RBP, RSP, R8-R15 are available. 

All of these registers can be accessed at the byte, word, dword, and qword level. REX prefixes are used to generate 64-bit operand sizes or to reference registers R8-R15.

Registers only available in 64-bit mode (R8-R15 and XMM8-XMM15) are preserved across transitions from 64-bit mode into compatibility mode then back into 64-bit mode. However, values of R8-R15 and XMM8-XMM15 are undefined after transitions from 64-bit mode through compatibility mode to legacy or real mode and then back through compatibility mode to 64-bit mode.

Because the upper 32 bits of 64-bit general-purpose registers are undefined in 32-bit modes, the upper 32 bits of any general-purpose register are not preserved when switching from 64-bit mode to a 32-bit mode (to protected mode or compatibility mode). Software must not depend on these bits to maintain a value after a 64-bit to 32-bit mode switch.

---

When in 64-bit mode, the operand size determines the number of valid bits in the destination general-purpose register.

  - 64-bit operands generate a 64-bit result in the destination general-purpose register.
  - 32-bit operands generate a 32-bit result, zero-extended to a 64-bit result in the destination general-purpose register.
  - 8-bit and 16-bit operands generate an 8-bit or 16-bit result. The upper 56 bits or 48 bits (respectively) of the destination general-purpose register are not modified by the operation. If the result of an 8-bit or 16-bit operation is intended for 64-bit address calculation, explicitly sign-extend the register to the full 64-bits.

---

### Segment Registers

***A segment selector*** is a special pointer that identifies a segment in memory. To access a particular segment in memory, the segment selector for that segment must be present in the appropriate segment register.

The four segment registers `CS`, `DS`, `SS`, and `ES` are the same as the segment registers found in the Intel 8086 and Intel 286 processors and the `FS` and `GS` registers were introduced into the IA-32 Architecture with the Intel386 family of processors.

These segment registers hold 16-bit segment selectors.

When writing application code, programmers generally create segment selectors with assembler directives and symbols. The assembler and other tools then create the actual segment selector values associated with these directives and symbols. If writing system code, programmers may need to create segment selectors directly

#### Using Segment Selectors

How segment registers are used depends on the type of memory management model that the operating system or executive is using.

When using the ***flat memory model***, segment registers are loaded with segment selectors that point to overlapping segments, each of which begins at address 0 of the linear address space.
  - These overlapping segments then comprise the linear address space for the program. Typically, two overlapping segments are defined: one for code and another for data and stacks.
  - The CS segment register points to the code segment and all the other segment registers point to the data and stack segment.

---

When using the ***segmented memory model***, each segment register is ordinarily loaded with a different segment selector so that each segment register points to a different segment within the linear address space.

At any time, a program can thus access up to six segments in the linear address space. To access a segment not pointed to by one of the segment registers, a program must first load the segment selector for the segment to be accessed into a segment register.

---

Each of the segment registers is associated with one of the three types of storage: *code*, *data*, or *stack*. For example, the `CS` register contains the segment selector for the code segment, where the instructions being executed are stored.
  - The processor fetches instructions from the code segment, using a logical address that consists of the segment selector in the `CS` register and the contents of the `EIP` register. The EIP register contains the offset within the code segment of the next instruction to be executed.
  - The `CS` register cannot be loaded explicitly by an application program. Instead, it is loaded implicitly by instructions or internal processor operations that change program control (such as procedure calls, interrupt handling, or task switching).

---

The `DS`, `ES`, `FS`, and `GS` registers point to four data segments. The availability of four data segments permits efficient and secure access to different types of data structures. For example, four separate data segments might be created:
  - one for the data structures of the current module, 
  - another for the data exported from a higher-level module, 
  - a third for a dynamically created data structure, and 
  - a fourth for data shared with another program.

  To access additional data segments, the application program must load segment selectors for these segments into the `DS`, `ES`, `FS`, and `GS` registers, as needed.

---

The `SS` register contains the segment selector for the stack segment, where the procedure stack is stored for the program, task, or handler currently being executed. All stack operations use the `SS` register to find the stack segment.

Unlike the `CS` register, the `SS` register can be loaded explicitly, which permits application programs to set up multiple stacks and switch among them.

---

#### Segment Registers in 64-Bit Mode

The `CS`, `DS`, `ES`, and `SS` are treated as if each segment base is 0, regardless of the value of the associated segment descriptor base. This creates a flat address space for code, data, and stack.

`FS` and `GS` are exceptions. They may be used as additional base registers in linear address calculations (in the addressing of local data and certain operating system data structures).

Even though segmentation is generally disabled, segment register loads may cause the processor to perform segment access assists. During these activities, enabled processors will still perform most of the legacy checks on loaded values (even if the checks are not applicable in 64-bit mode). Such checks are needed because a segment register loaded in 64-bit mode may be used by an application running in compatibility mode.

Limit checks for `CS`, `DS`, `ES`, `SS`, `FS`, and `GS` are disabled in 64-bit mode.

---

### EFLAGS Register

The 32-bit `EFLAGS` register contains a group of status flags, a control flag, and a group of system flags. 
  - The status flags indicate the results of arithmetic instructions. Only the `CF` flag can be modified directly, using the `STC`, `CLC`, and `CMC` instructions. Also the bit instructions (`BT`, `BTS`, `BTR`, and `BTC`) copy a specified bit into the `CF` flag.
  - The system flags and the IOPL field control operating-system or executive operations.


| Bit Position | Flag | Type/Note | Description |
| ------------ | ---- | --------- | ----------- |
| 0  | (CF) Carry Flag | (S) Status flag | Set if an arithmetic operation generates a carry or a borrow out of the most-significant bit of the result; cleared otherwise.
|    | | | This flag indicates an overflow condition for unsigned-integer arithmetic. It is also used in multiple-precision arithmetic. |
| 1  | Reserved | Always keep it set (1) |
| 2  | (PF) Parity Flag | (S) Status flag | Set if the least-significant byte of the result contains an even number of 1 bits; cleared otherwise. |
| 3  | Reserved |
| 4  | (AF) Auxiliary Flag | (S) Status flag | Set if an arithmetic operation generates a carry or a borrow out of bit 3 of the result; cleared otherwise.
|    | | | This flag is used in binary-coded decimal (BCD) arithmetic. |
| 5  | Reserved |
| 6  | (ZF) Zero Flag | (S) Status flag | Set if the result is zero; cleared otherwise. |
| 7  | (SF) Sign Flag | (S) Status flag | Set equal to the most-significant bit of the result, which is the sign bit of a signed integer. | 
|    | | | 0 indicates a positive value and 1 indicates a negative value. |
| 8  | (TF) Trap Flag | (S) System flag | When set enables single-step mode for debugging. |
| 9  | (IF) Interrupt Enable Flag | (S) System flag | Controls the response of the processor to maskable interrupt requests. |
|    | | | Set to respond to maskable interrupts; cleared to inhibit maskable interrupts. |
| 10 | (DF) Direction Flag | (C) Control Flag | Setting the DF flag causes the string instructions to ***auto-decrement*** (to process strings from high addresses to low addresses). |
|    | | | Clearing the DF flag causes the string instructions to ***auto-increment*** (process strings from low addresses to high addresses). |
|    | | | The STD and CLD instructions set and clear the DF flag, respectively. |
| 11 | (OF) Overflow Flag  | (S) Status flag  | Set if the integer result is too large a positive number or too small a negative number (excluding the sign-bit) to fit in the destination operand; cleared otherwise. |
|    | | | This flag indicates an overflow condition for signed-integer (2s complement) arithmetic. |
| 12, 13 | (IOPL) I/0 Privilege Level | (S) System flag | Indicates the I/O privilege level of the currently running program or task. |
|    | | | The current privilege level (CPL) of the currently running program or task must be less than or equal to the I/O privilege level to access the I/O address space. |
|    | | | The `POPF` and `IRET` instructions can modify this field only when operating at a CPL of 0. |
| 14 | (NT) Nested Task | (S) System flag | Controls the chaining of interrupted and called tasks. |
|    | | | Set when the current task is linked to the previously executed task; cleared when the current task is not linked to another task. |
| 15 | Reserved |
| 16 | (RF) Resume Flag | (S) System flag | Controls the processor's response to debug exceptions. |
| 17 | (VM) Virtual 8086 Mode | (S) System flag | Set to enable virtual-8086 mode; clear to return to protected mode without virtual-8086 mode semantics. |
| 18 | (AC) Alignment Check/Access Control | (S) System flag | If the `CR0.AM` bit is set, alignment checking of user-mode data accesses is enabled iff this flag (AC) is 1. |
|    | | | If the `CR4.SMAP` bit is set, explicit supervisor-mode data accesses to user-mode pages are allowed iff this bit (AC) is 1. |
| 19 | (VIF) Virtual Interrupt Flag | (S) System flag | Virtual image of the IF flag. Used in conjunction with the VIP flag. |
|    | | | To use this flag and the VIP flag, the virtual mode extensions are enabled by setting the `CR4.VME` bit. |
| 20 | (VIP) Virtual Interrupt Pending | (S) System flag | Set to indicate that an interrupt is pending; clear when no interrupt is pending. |
|    | | | Software sets and clears this flag; the processor only reads it. Used in conjunction with the VIF flag. |
| 21 | (ID) ID Flag | (S) System flag | The ability of a program to set or clear this flag indicates support for the CPUID instruction. | 
| 31:22 | Reserved |


Following initialization of the processor (either by asserting the `RESET` pin or the `INIT` pin), the state of the `EFLAGS` register is `0x00000002`. Bits 1, 3, 5, 15, and 22 through 31 of this register are reserved. Software should not use or depend on the states of any of these bits.

Some of the flags in the `EFLAGS` register can be modified directly, using special-purpose instructions. There are no instructions that are allowed to examine or modify the whole register directly.

The following instructions can be used to move groups of flags to and from the procedure stack or the EAX register: `LAHF`, `SAHF`, `PUSHF`, `PUSHFD`, `POPF`, and `POPFD`.

After the contents of the `EFLAGS` register have been transferred to the procedure stack or EAX register, the flags can be examined and modified using the processor's bit manipulation instructions (`BT`, `BTS`, `BTR`, and `BTC`).

When suspending a task (using the processor's multitasking facilities), the processor automatically saves the state of the `EFLAGS` register in the task state segment (`TSS`) for the task being suspended. When binding itself to a new task, the processor loads the `EFLAGS` register with data from the new task's `TSS`.

When a call is made to an interrupt or exception handler procedure, the processor automatically saves the state of the `EFLAGS` registers on the procedure stack. When an interrupt or exception is handled with a task switch, the state of the `EFLAGS` register is saved in the `TSS` for the task being suspended.

In 64-bit mode, `EFLAGS` is extended to 64 bits and called `RFLAGS`.
  - The upper 32 bits of `RFLAGS` register are reserved.
  - The lower 32 bits of `RFLAGS` remains the same as `EFLAGS`.

---

### Instruction Pointer

The instruction pointer (`EIP`) register contains the offset in the current code segment for the next instruction to be executed. It is advanced from one instruction boundary to the next in straight-line code or it is moved ahead or backwards by a number of instructions when executing `JMP`, `Jcc`, `CALL`, `RET`, and `IRET` instructions.

The `EIP` register cannot be accessed directly by software. It is controlled implicitly by control-transfer instructions (such as `JMP`, `Jcc`, `CALL`, and `RET`), interrupts, and exceptions.
  - The only way to read the `EIP` register is to execute a `CALL` instruction and then read the value of the return instruction pointer from the procedure stack.
  -  The `EIP` register can be loaded indirectly by modifying the value of a return instruction pointer on the procedure stack and executing a return instruction (`RET` or `IRET`).

In 64-bit mode, the `RIP` register becomes the instruction pointer. This register holds the 64-bit offset of the next instruction to be executed.

64-bit mode also supports a technique called `RIP`-relative addressing. Using which, the effective address is determined by adding a displacement to the `RIP` of the next instruction.

---

### Operand Size and Address Size Attributes

When the processor is executing in protected mode, every code segment has a default operand-size and address-size attribute. These attributes are selected with the `D` (default size) flag in the segment descriptor for the code segment.
  - When the `D` flag is set, the 32-bit operand-size and address-size attributes are selected.
  - When the flag is clear, the 16-bit size attributes are selected.

The ***operand-size attribute*** selects the size of operands.
  - When the 16-bit operand-size attribute is in force, operands can generally be either 8 bits or 16 bits. 
  - When the 32-bit operand-size attribute is in force, operands can generally be 8 bits or 32 bits.

The ***address-size attribute*** selects the sizes of addresses used to address memory: 16 bits or 32 bits. 
  - When the 16-bit address-size attribute is in force, segment offsets and displacements are 16 bits. This restriction limits the size of a segment to 64 KiB.
  - When the 32-bit address-size attribute is in force, segment offsets and displacements are 32 bits, allowing up to 4 GiB to be addressed.

The default operand-size attribute and/or address-size attribute can be overridden for a particular instruction by adding an operand-size and/or address-size prefix to an instruction.

---

In 64-bit mode, the default address size is 64 bits and the default operand size is 32 bits. Defaults can be overridden using prefixes.

Address-size and operand-size prefixes allow mixing of 32/64-bit data and 32/64-bit addresses on an instruction-by-instruction basis. Note that 16-bit addresses are not supported in 64-bit mode.

---

# Chapter 20: Input/Output

In addition to transferring data to and from external memory, IA-32 processors can also transfer data to and from
input/output ports (I/O ports).

I/O ports are created in system hardware by circuity that decodes the control, data, and address pins on the processor. These I/O ports are then configured to communicate with peripheral devices.

An I/O port can be an input port, an output port, or a bidirectional port.
  - Some I/O ports are used for transmitting data, such as to and from the transmit and receive registers, respectively, of a serial interface device.
  - Other I/O ports are used to control peripheral devices, such as the control registers of a disk controller.

## I/O Port Addressing

The processor permits applications to access I/O ports in either of the two ways:
  - Through a separate I/O address space.
  - Through memory-mapped I/O.

Accessing I/O ports through the I/O address space is handled through a set of I/O instructions and a special I/O
protection mechanism.

Accessing I/O ports through memory-mapped I/O is handled with the processor's general-purpose move and string instructions, with protection provided through segmentation or paging.

I/O ports can be mapped so that they appear in the I/O address space or the physical-memory address space (memory mapped I/O) or both.

One benefit of using the I/O address space is that writes to I/O ports are guaranteed to be completed before the next instruction in the instruction stream is executed. Thus, I/O writes to control system hardware cause the hardware to be set to its new state before any other instructions are executed.

---

## I/O Address Space

The processor's I/O address space is separate and distinct from the physical-memory address space.

The I/O address space consists of 2<sup>16</sup> (65,536) individually addressable 8-bit I/O ports, numbered 0 through `0xFFFF`.

Any two consecutive 8-bit ports can be treated as a 16-bit port, and any four consecutive ports can be a 32-bit port. This way, the processor can transfer 8, 16, or 32 bits to or from a device in the I/O address space.

I/O port addresses `0x0F8` through `0x0FF` are reserved. Do not assign I/O ports to these addresses. The result of an attempt to address beyond the I/O address space limit of `0xFFFF` is implementation-specific.

The processor supports data transfers to unaligned ports, but there is a performance penalty because one or more
extra bus cycle must be used. Therefore, like words in memory are aligned,
  - 16-bit ports should be aligned to even addresses (0, 2, 4, ...) so that all 16 bits can be transferred in a single bus cycle, and 
  - 32-bit ports should be aligned to addresses that are multiples of four (0, 4, 8, ...).

---

### Memory-Mapped I/O

I/O devices that respond like memory components can be accessed through the processor's physical-memory
address space.

When using memory-mapped I/O, any of the processor's instructions that reference memory can be used to access an I/O port located at a physical-memory address. For example, 
  - the `MOV` instruction can transfer data between a register and a memory-mapped I/O port, or
  - the `AND`, `OR`, and `TEST` instructions may be used to manipulate bits in the control and status registers of a memory-mapped peripheral device.

When using memory-mapped I/O, caching of the address space mapped for I/O operations must be prevented

---

Certain instructions may take an exception or VM exit after completing a memory access (read/write) to a memory-mapped I/O address.

This exception or VM exit could be due to the instruction performing multiple memory accesses (e.g., `MOVS`, `PUSH mem`, `POP mem`, `PUSHAD`, etc.), or could be due to the ordering of exceptions or VM exits within the instruction (e.g., a `DIV mem` that takes a `#DE` or a `CALL` that causes a task switch VM exit).

If software later re-executes that instruction (e.g., after an `IRET` or `VMRESUME`), the MMIO (memory-mapped I/O) access may occur again. If the memory-mapped I/O access has a side-effect, that side-effect may be executed each time the memory-mapped I/O access occurs. If that is problematic, software must ensure that exceptions or VM exits do not occur after accessing the MMIO.

## I/O Instructions

The processor's I/O instructions provide access to I/O ports through the I/O address space. There are two groups of I/O instructions:
  - Those that transfer a single item (byte, word, or doubleword) between an I/O port and a general-purpose register.
  - Those that transfer strings of items (strings of bytes, words, or doublewords) between an I/O port and memory.

These instructions cannot be used to access memory-mapped I/O ports.

The register I/O instructions `IN` (input from I/O port) and `OUT` (output to I/O port) move data between I/O ports and the `EAX` register (32-bit I/O), the AX register (16-bit I/O), or the AL (8-bit I/O) register. The address of the I/O port can be given with an immediate value or a value in the DX register.

The string I/O instructions `INS` (input string from I/O port) and `OUTS` (output string to I/O port) move data between an I/O port and a memory location.
  - The address of the I/O port being accessed is given in the `DX` register.
  - The source or destination memory address is given in the DS:ESI or ES:EDI register, respectively.

When used with the repeat prefix `REP`, the `INS` and `OUTS` instructions perform string (or block) input or output operations. The repeat prefix `REP` modifies the `INS` and `OUTS` instructions to transfer blocks of data between an I/O port and memory. Here, the `ESI` or `EDI` register is incremented or decremented (according to the setting of the `DF` flag in the `EFLAGS` register) after each byte, word, or doubleword is transferred between the selected I/O port and memory.

---

## Protected Mode I/O

When the processor is running in protected mode, the following protection mechanisms regulate access to I/O ports.

When accessing I/O ports through the I/O address space, two protection devices control access:
  - The I/O privilege level (`IOPL`) field in the `EFLAGS` register.
  - The I/O permission bit map of a task state segment (`TSS`).

When accessing memory-mapped I/O ports, the normal segmentation and paging protection and the MTRRs (in processors that support them) also affect access to I/O ports.

The following sections describe the protection mechanisms available when accessing I/O ports in the I/O address space with the I/O instructions.

### I/O Privilege Level

In systems where I/O protection is used, the `IOPL` field in the `EFLAGS` register controls access to the I/O address space by restricting use of selected instructions.

This protection mechanism permits the operating system or executive to set the privilege level needed to perform the I/O.

---

In a typical protection ring model, access to the I/O address space is restricted to privilege levels 0 and 1. Here, the kernel and the device drivers are allowed to perform I/O, while less privileged device drivers and application programs are denied access to the I/O address space. Application programs must then make calls to the operating system to perform I/O.

`IN`, `INS`, `OUT`, `OUTS`, `CLI` (clear interrupt-enable flag), and `STI` (set interrupt-enable flag) are called I/O sensitive instructions because they are sensitive to the `IOPL` field.

  - They can be executed only if the current privilege level (CPL) of the program or the task currently executing is less than or equal to the `IOPL`.
  - Any attempt by a less privileged program or task to use an I/O sensitive instruction results in a general-protection exception (`#GP`). 
  - Because each task has its own copy of the `EFLAGS` register, each task can have a different `IOPL`.

---

The I/O permission bit map in the `TSS` can be used to modify the effect of the `IOPL` on I/O sensitive instructions, allowing access to some I/O ports by less privileged programs or tasks.

A program or task can change its `IOPL` only with the `POPF` and `IRET` instructions. However, such changes are privileged.
  - No procedure may change the current `IOPL`, unless it is running at privilege level 0.
  - An attempt by a less privileged procedure to change the `IOPL` does not result in an exception, the `IOPL` simply remains unchanged.

The `POPF` instruction also may be used to change the state of the `IF` flag (as can the `CLI` and `STI` instructions). However, the `POPF` instruction in this case is also I/O sensitive.
  - A procedure may use the `POPF` instruction to change the setting of the `IF` flag only if the CPL is less than or equal to the current IOPL.
  - An attempt by a less privileged procedure to change the `IF` flag does not result in an exception, the `IF` flag simply remains unchanged.

---

### I/O Permission Bit Map

The I/O permission bit map is a device for permitting limited access to I/O ports by less privileged programs or tasks and for tasks operating in virtual-8086 mode.

It is located in the `TSS` for the currently running task or program.
  - The address of the first byte of the I/O permission bit map is given in the I/O map base address field of the `TSS`.
  - The size of the I/O permission bit map and its location in the `TSS` are variable.

Because each task has its own TSS, each task has its own I/O permission bit map. Access to individual I/O ports can thus be granted to individual tasks.

If in protected mode and the CPL is less than or equal to the current `IOPL`, the processor allows all I/O operations to proceed.

If in protected mode and the CPL is greater than the `IOPL` or if the processor is operating in virtual-8086 mode, the processor checks the I/O permission bit map to determine if access to a particular I/O port is allowed.
  - Each bit in the map corresponds to an I/O port byte address. For example, the control bit for I/O port address `0x29` in the I/O address space is found at bit position 1 of the sixth byte in the bit map.
  - Before granting I/O access, the processor tests all the bits corresponding to the I/O port being addressed.
  - For a doubleword access, for example, the processors tests the four bits corresponding to the four adjacent 8-bit port addresses.
  - If any tested bit is set, a general-protection exception (`#GP`) is signaled. If all tested bits are clear, the I/O operation is allowed to proceed.

---

Because I/O port addresses are not necessarily aligned to word and doubleword boundaries, the processor reads two bytes from the I/O permission bit map for every access to an I/O port. To prevent exceptions from being generated when the ports with the highest addresses are accessed, an extra byte needs to be included in the TSS immediately after the table. This byte must have all of its bits set, and it must be within the segment limit.

It is not necessary for the I/O permission bit map to represent all the I/O addresses. I/O addresses not spanned by the map are treated as if they had set bits in the map. For example, if the TSS segment limit is 10 bytes past the bit-map base address, the map has 11 bytes and the first 80 I/O ports are mapped. Higher addresses in the I/O address space generate exceptions.

If the I/O bit map base address is greater than or equal to the TSS segment limit, there is no I/O permission map, and all I/O instructions generate exceptions when the CPL is greater than the current `IOPL`.