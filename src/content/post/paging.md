---
title: "Paging in Intel x86 Architecture (32-bit and 64-bit)"
publishDate: "2026-09-19"
# updatedDate: "2026-M-D"
description: "This text aims to understand paging in Intel x86 architecture."
tags: [ linux-kvm ]
draft: true
---

*Paging is the process of translating linear addresses into physical addresses.*

# Paging Modes

Intel-64 processors support four paging modes. They are:
  - 32-bit
  - PAE
  - 4-level
  - 5-level

> 32-bit paging and PAE paging can be used only in legacy protected mode (`IA32_EFER.LME` = 0).
> 
> 4-level paging and 5-level paging can be used only IA-32e mode (`IA32_EFER.LME` = 1).

---

IA-32e mode has two sub-modes:
  - **Compatibility mode**: This sub-mode uses only 32-bit linear addresses. 4-level paging and 5-level paging treat bits 63:32 of such an address as all 0. These addresses are subject to linear-address pre-processing, specifically linear-address-space separation.
  - **64-bit mode**: This sub-mode produces 64-bit linear addresses. These addresses are then subject to linear-address pre-processing. As part of this, the processor enforces canonicality, ensuring that the upper bits of such an address are identical, i.e. bits [63:47] for 4-level paging and bits [63:56] for 5-level paging.

The **paging mode** and the **behavior in that mode** is determined/controlled by specific bits in the control registers and a model specific register (MSR).

1. The `WP` (bit 16), `PG` (bit 31) and `PE` (bit 0) flags in `CR0`.

2. The `PSE` (bit 4), `PAE` (bit 5), `PGE` (bit 7), `LA57` (bit 12), `PCIDE` (bit 17), `SMEP` (bit 20), `SMAP` (bit 21), `PKE` (bit 22), `CET` (bit 23), and `PKS` (bit 24) flags in `CR4`.

3. The `AC` flag (bit 18) in the `EFLAGS` register.

4. The `LME` (bit 8) and `NXE` (bit 11) flags in the `IA32_EFER` MSR.

5. The "enable HLAT" VM-execution control (tertiary processor-based VM-execution control bit 1).

6. `CR3` is initialized with the physical address of the first paging structure that the processor will use for linear-address translation.

---

On Intel-64 processors, paging is architecturally optional, but it is mandatory for the 64-bit IA-32e execution. Consequently, modern 64-bit operating systems normally execute with paging enabled, while paging-disabled operations may be used during specific routines.

## CRO Bits

The `CR0.PG` flag (bit 31) determines whether paging is enabled (1) or not (0).
  - When paging is disabled, the logical processor treats all linear addresses as if they were physical addresses.
  - When paging is enabled, one of the four paging modes is used. 

The `CR0.PE` flag (bit 0) determines whether the processor is running in 32-bit protected mode (1), or real mode (0).

Enabling paging requires the `CR0.PE` to be set. If it is clear (0), setting `CR0.PG` causes a general-protection fault (#GP). Therefore, enabling paging requires both `CR0.PG` and `CR0.PE` bits in set state.

IA-32e mode retains the protected mode bit as it comes into effect from the 32-bit protected mode. Thus, 64-bit mode has the `CR0.PE` bit enabled always.

## CR4 Bits

`CR4.LA57` (bit 12) determines whether the CPU uses 4-level paging (0) or 5-level paging (1) in the IA-32e mode. Its value must be established before entering IA-32e mode and cannot be changed while in IA-32e mode as the whole execution environment is designed accordingly.

## Extended Feature Enable Register (IA32_EFER MSR)

....

---