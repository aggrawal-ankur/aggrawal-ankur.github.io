---
title: "Intel SDM Volume 3, Chapter 5: Paging"
publishDate: "2026-09-26"
# updatedDate: "2026-M-D"
description: "Chapter 5: Paging in Volume 3 Intel SDM."
tags: [ linux-kvm ]
draft: true
---

Paging (or linear-address translation) is the process of translating linear addresses so that they can be used to access memory or I/O devices.

Paging translates each linear address to a physical address and determines, for each translation, what accesses to the linear address are allowed (the address's access rights) and the type of caching used for such accesses (the address's memory type).

# Paging Modes

The **paging mode** and the **behavior in that mode** is determined/controlled by specific bits in the control registers and a model specific register (MSR).

1. The `WP` (bit 16), `PG` (bit 31) and `PE` (bit 0) flags in `CR0`.

2. The `PSE` (bit 4), `PAE` (bit 5), `PGE` (bit 7), `LA57` (bit 12), `PCIDE` (bit 17), `SMEP` (bit 20), `SMAP` (bit 21), `PKE` (bit 22), `CET` (bit 23), and `PKS` (bit 24) flags in `CR4`.

3. The `AC` flag (bit 18) in the `EFLAGS` register.

4. The `LME` (bit 8) and `NXE` (bit 11) flags in the `IA32_EFER` MSR.

5. The "enable HLAT" VM-execution control (tertiary processor-based VM-execution control bit 1).

6. `CR3` is initialized with the physical address of the first paging structure that the processor will use for linear-address translation.

---

When `CR0.PG` is 0, paging is not used.
  - The logical processor treats all linear addresses as if they were physical addresses.
  - `CR4.PAE`, `CR4.LA57`, `IA32_EFER.LME`, `CR0.WP`, `CR4.PSE`, `CR4.PGE`, `CR4.SMEP`, `CR4.SMAP`, `IA32_EFER.NXE`, and `CR4.CET` are ignored by the processor.

Paging is enabled if `CR0.PG` is 1. Paging can be enabled only if protection is enabled, i.e. `CR0.PE` is 1.

Intel-64 processors support four paging modes.
  - If `CR4.PAE` is 0, "***32-bit paging***" is used.
  - If `CR4.PAE` is 1 and `IA32_EFER.LME` is 0, "***PAE paging***" is used.
  - If `CR4.PAE` is 1, `IA32_EFER.LME` is 1, and `CR4.LA57` is 0, "***4-level paging***" is used.
  - If `CR4.PAE` is 1, `IA32_EFER.LME` is 1, and `CR4.LA57` is 1, "***5-level paging***" is used.

---

32-bit paging and PAE paging can be used in legacy protected mode (`IA32_EFER.LME` is 0) only. The legacy protected mode cannot produce linear addresses larger than 32 bits, so 32-bit paging and PAE paging translate 32-bit linear addresses.

4-level paging and 5-level paging are used only in IA-32e mode. IA-32e mode has two sub-modes.

***Compatibility mode***: This sub-mode uses only 32-bit linear addresses. 4-level paging and 5-level paging treat bits 63:32 of such an address as all 0. These addresses are subject to linear-address pre-processing, specifically linear-address-space separation.

***64-bit mode***: This sub-mode produces 64-bit linear addresses. These addresses are then subject to linear-address pre-processing. As part of this, the processor enforces canonicality, ensuring that the upper bits of such an address are identical.

---

# Enabling Paging

If `CR0.PG`is= 1, a logical processor is in one of four paging modes. The following are certain limitations and other details:

  - `IA32_EFER.LME` cannot be modified while paging is enabled (`CR0.PG` = 1). Attempts to do so using `WRMSR` cause a `#GP(0)`.

  - Paging cannot be enabled (by setting `CR0.PG` to 1) while `CR4.PAE` is 0 and `IA32_EFER.LME` is 1. Attempts to do so using "MOV to CR0" cause a `#GP(0)`.

  - `CR4.PAE` and `CR4.LA57` cannot be modified while either 4-level paging or 5-level paging is in use (when `CR0.PG` is 1 and `IA32_EFER.LME` is 1). Attempts to do so using "MOV to CR4" cause a `#GP(0)`.

  - Regardless of the current paging mode, software can disable paging by clearing `CR0.PG` with "MOV to CR0".
  - Software can transition between 32-bit paging and PAE paging by changing the value of `CR4.PAE` with "MOV to CR4".

  - Software cannot transition directly between 4-level paging (or 5-level paging) and any of other paging mode. It must first disable paging (by clearing CR0.PG with MOV to CR0), then set CR4.PAE, IA32_EFER.LME, and CR4.LA57 to the desired values (with MOV to CR4 and WRMSR), and then re-enable paging (by setting CR0.PG with MOV to CR0). As noted earlier, an attempt to modify CR4.PAE, IA32_EFER.LME, or CR.LA57 while 4-level paging or 5-level paging is enabled causes a general-protection exception `#GP(0)`.

  - VMX transitions allow transitions between paging modes that are not possible using "MOV to CR" or `WRMSR`. This is because VMX transitions can load CR0, CR4, and IA32_EFER in one operation.