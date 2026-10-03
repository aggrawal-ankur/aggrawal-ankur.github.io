---
title: "History of the IA-32 and Intel 64 Architectures"
publishDate: "2026-10-03"
# updatedDate: "2026-M-D"
description: "History of the IA-32 and Intel 64 Architectures derived from chapter 2 in volume 1."
tags: [ intel-sdm ]
draft: true
---

It is derived from chapter 2 in volume 1.

# 16-Bit Processors and Segmentation (1978)

The 8086 processor has 16-bit registers and a 16-bit external data bus, with 20-bit addressing giving a 1-MByte address space. The 8088 is similar to the 8086, except it has an 8-bit external data bus.

The 8086/8088 processors introduced segmentation to the IA-32 architecture.
  - With segmentation, a 16-bit segment register contains a pointer to a memory segment of up to 64 KiB (65536 bytes).
  - Using four segment registers at a time, the 8086/8088 processors are able to address up to 256 KiB (256*1024 bytes) without switching between segments.
  - The 20-bit addresses that can be formed using a segment register and an additional 16-bit pointer provide a total address range of 1 MiB (1000 KiB).

# The Intel 286 Processor (1982)

The 80286 processor introduced ***protected mode operation***.

# The Intel 386 Processor (1985)

The 80386 processor was the first 32-bit processor in the IA-32 architecture family.
  - It introduced 32-bit registers for use both to hold operands and for addressing.
  - The lower half of each 32-bit register retains the properties of the 16-bit registers of earlier generations, permitting backward compatibility.

The 80386 processor also provides a virtual-8086 mode that allows for even greater efficiency when executing programs created for the 8086/8088 processors.

The 80386 processor also supported:
  - A 32-bit address bus that supports up to 4 GiB of physical memory.
  - A segmented-memory model and a flat memory model.
  - Paging, with a fixed 4 KiB page size providing a method for virtual memory management.
  - Support for parallel stages.

# The Intel 486 Processor (1989)

The 80486 processor added more parallel execution capability by expanding the 80386 processor's instruction decode and execution units into five pipelined stages. Each stage operates in parallel with the others on up to five instructions in different stages of execution.

The 80486 processor also added:
  - An 8 KiB on-chip first-level (L1) cache that increased the percent of instructions that could execute at the scalar rate of one per clock.
  - An integrated x87 FPU.
  - Power saving and system management capabilities.

# The Intel Pentium (80586) Processor (1993)

Among other things, the processor added:
  - extensions to make the virtual-8086 mode more efficient and allow for 4 MiB as well as 4 KiB pages.
  - internal data paths of 128 and 256 bits added speed to internal data transfers.
  - burstable external data bus was increased to 64 bits.
  - an APIC (advanced programmable interrupt controller) to support systems with multiple processors.
  - a dual processor mode to support glueless two processor systems.

# The Intel Pentium 4 Processor Family (2000—2006)

***Intel 64 architecture*** was introduced in the Intel Pentium 4 Processor Extreme Edition supporting Hyper-Threading Technology and in the Intel Pentium 4 Processor 6xx and 5xx sequences.

***Intel Virtualization Technology*** (Intel VT) was introduced in the Intel Pentium 4 processor 672 and 662.

# The Intel Core i7 Processor Family (2008)

Introduced the second generation Intel Virtualization Technology (Intel VT).

# Intel 64 Architecture

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

# Intel Virtualization Technology (Intel VT)

Intel Virtualization Technology for Intel 64 and IA-32 architectures provide extensions that support virtualization. The extensions are referred to as Virtual Machine Extensions (VMX). 

An Intel 64 or IA-32 platform with VMX can function as multiple virtual systems (or virtual machines). Each virtual machine can run operating systems and applications in separate partitions.

VMX also provides programming interface for a new layer of system software (called the Virtual Machine Monitor (VMM)) used to manage the operation of virtual machines.
