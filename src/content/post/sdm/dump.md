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

## Basic Execution Environment

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

3. ***Memory management registers***: The GDTR, IDTR, task register, and LDTR specify the locations of data structures used in protected mode memory management.

4. ***Debug registers***: The debug registers (`DR0` through `DR7`) control and allow monitoring of the processor's debugging operations.

5. ***Memory type range registers (MTRRs)***: The MTRRs are used to assign memory types to regions of memory.

6. ***Model-specific registers (MSRs)***: The processor provides a variety of model-specific registers that are used to control and report on processor performance.

7. ***Machine check registers***: The machine check registers consist of a set of control, status, and error-reporting MSRs that are used to detect and report on hardware (machine) errors.

8. ***Performance monitoring counters***: They allow processor performance events to be monitored.

---

## 64-Bit Mode Execution Environment