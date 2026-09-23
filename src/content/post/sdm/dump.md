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