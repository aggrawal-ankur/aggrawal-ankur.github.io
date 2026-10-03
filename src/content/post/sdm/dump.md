---
title: "A Dump of My Findings in the Intel SDM Volume 1"
publishDate: "2026-09-22"
# updatedDate: "2026-M-D"
description: "A dump of my findings in the Intel SDM volume 1"
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
