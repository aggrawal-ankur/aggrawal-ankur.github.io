---
title: "Intel SDM Volume 3, Chapter 5: Paging"
publishDate: "2026-09-26"
# updatedDate: "2026-M-D"
description: "Chapter 5: Paging in Volume 3 Intel SDM."
tags: [ intel-sdm ]
draft: true
---

Paging (or linear-address translation) is the process of translating linear addresses so that they can be used to access memory or I/O devices.

Paging translates each linear address to a physical address and determines, for each translation, what accesses to the linear address are allowed (the address's access rights) and the type of caching used for such accesses (the address's memory type).

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

If `CR0.PG` is 1, a logical processor is in one of four paging modes. The following are certain limitations and other details:

  - `IA32_EFER.LME` cannot be modified while paging is enabled (`CR0.PG` is 1). Attempts to do so using `WRMSR` cause a `#GP(0)`.

  - Paging cannot be enabled (by setting `CR0.PG` to 1) while `CR4.PAE` is 0 and `IA32_EFER.LME` is 1. Attempts to do so using "MOV to CR0" cause a `#GP(0)`.

  - `CR4.PAE` and `CR4.LA57` cannot be modified while either 4-level paging or 5-level paging is in use (when `CR0.PG` is 1 and `IA32_EFER.LME` is 1). Attempts to do so using "MOV to CR4" cause a `#GP(0)`.

  - Regardless of the current paging mode, software can disable paging by clearing `CR0.PG` with "MOV to CR0".
  - Software can transition between 32-bit paging and PAE paging by changing the value of `CR4.PAE` with "MOV to CR4".

  - Software cannot transition directly between 4-level paging (or 5-level paging) and any of other paging mode. It must first disable paging (by clearing CR0.PG with MOV to CR0), then set CR4.PAE, IA32_EFER.LME, and CR4.LA57 to the desired values (with MOV to CR4 and WRMSR), and then re-enable paging (by setting CR0.PG with MOV to CR0). As noted earlier, an attempt to modify CR4.PAE, IA32_EFER.LME, or CR.LA57 while 4-level paging or 5-level paging is enabled causes a general-protection exception `#GP(0)`.

  - VMX transitions allow transitions between paging modes that are not possible using "MOV to CR" or `WRMSR`. This is because VMX transitions can load CR0, CR4, and IA32_EFER in one operation.

---

# Paging Modes

The **paging mode** and the **behavior in that mode** is determined/controlled by specific bits in the control registers and a model specific register (MSR).

1. The `WP` (bit 16), `PG` (bit 31) and `PE` (bit 0) flags in `CR0`.

2. The `PSE` (bit 4), `PAE` (bit 5), `PGE` (bit 7), `LA57` (bit 12), `PCIDE` (bit 17), `SMEP` (bit 20), `SMAP` (bit 21), `PKE` (bit 22), `CET` (bit 23), and `PKS` (bit 24) flags in `CR4`.

3. The `AC` flag (bit 18) in the `EFLAGS` register.

4. The `LME` (bit 8) and `NXE` (bit 11) flags in the `IA32_EFER` MSR.

5. The "enable HLAT" VM-execution control (tertiary processor-based VM-execution control bit 1).

6. `CR3` is initialized with the physical address of the first paging structure that the processor will use for linear-address translation.

---

`CR0.WP` allows pages to be protected from supervisor-mode writes.
  - If `CR0.WP` is 0, supervisor-mode write accesses are allowed to linear addresses with read-only access rights; if `CR0.WP` is 1, they are not.
  - User-mode write accesses are never allowed to linear addresses with read-only access rights, regardless of the value of `CR0.WP`.

`CR4.PSE` enables 4 MiB pages for 32-bit paging.
  - If `CR4.PSE` is 0, 32-bit paging can use only 4 KiB pages; if `CR4.PSE` is 1, 32-bit paging can use both 4 KiB and 4 MiB pages.
  - PAE paging, 4-level paging, and 5-level paging can use multiple page sizes regardless of the value of `CR4.PSE`.

`CR4.PGE` enables global pages.
  - If `CR4.PGE` is 0, no translations are shared across address spaces.
  - If `CR4.PGE` is 1, specified translations may be shared across address spaces.

`CR4.PCIDE` enables process-context identifiers (PCIDs) for 4-level paging and 5-level paging. They allow a logical processor to cache information for multiple linear-address spaces.

`CR4.SMEP` allows pages to be protected from supervisor-mode instruction fetches. If `CR4.SMEP` is 1, software operating in supervisor mode cannot fetch instructions from linear addresses that are accessible in user mode.

`CR4.SMAP` allows pages to be protected from supervisor-mode data accesses.
  - If `CR4.SMAP` is 1, software operating in supervisor mode cannot access data at linear addresses that are accessible in user mode.
  - Software can override this protection by setting `EFLAGS.AC`.

`CR4.PKE` and `CR4.PKS` enable specification of access rights based on protection keys. 4-level paging and 5-level paging associate each linear address with a protection key.
  - When `CR4.PKE` is 1, the `PKRU` register specifies, for each protection key, whether user-mode linear addresses with that protection key can be read or written.
  - When `CR4.PKS` is 1, the `IA32_PKRS` MSR does the same for supervisor-mode linear addresses.

`CR4.CET` enables control-flow enforcement technology, including the shadow-stack feature.
  - If `CR4.CET` is 1, certain memory accesses are identified as shadow-stack accesses and certain linear addresses translate to shadow-stack pages.
  - The processor allows `CR4.CET` to be set only if CR0.WP is also set.

`IA32_EFER.NXE` enables execute-disable access rights for PAE paging, 4-level paging, and 5-level paging.
  - If `IA32_EFER.NXE` is 1, instruction fetches can be prevented from specified linear addresses even if data reads from the addresses are allowed.
  - `IA32_EFER.NXE` has no effect with 32-bit paging. Software that wants to use this feature to limit instruction fetches from readable pages must use PAE paging, 4-level paging, or 5-level paging.

The "enable HLAT" VM-execution control enables ***HLAT paging*** for 4-level paging and 5-level paging.
  - HLAT paging does not use `CR3` to identify the address of the first paging structure used in linear-address translation. Instead, that structure is located using a field in the virtual-machine control structure (VMCS).
  - In addition, HLAT paging interprets certain bits in paging-structure entries differently than ordinary paging.

---

# Enumeration of Paging Features by CPUID

Software can discover support for different paging features using the CPUID instruction.

***Page-size Extensions (PSE)***.
  - If `CPUID.01H:EDX.PSE[3]` is 1, `CR4.PSE` may be set to enable support for 4 MiB pages with 32-bit paging.
  - Used in 32-bit paging.

***Physical-address Extension (PAE)***.
  - If `CPUID.01H:EDX.PAE[6]` is 1, `CR4.PAE` may be set to enable PAE paging.
  - It is also required for 4-level paging and 5-level paging.

***Global-page Support (PGE)***. If `CPUID.01H:EDX.PGE[13]` is 1, `CR4.PGE` may be set to enable the global-page feature.

***Page-attribute Table (PAT)***.
  - If `CPUID.01H:EDX.PAT[16]` is 1, the 8-entry page-attribute table (PAT) is supported.
  - When the PAT is supported, three bits in certain paging-structure entries select a memory type (used to determine type of caching used) from the PAT.

***Page-size extensions with 40-bit physical-address extension (PSE-36)***. If `CPUID.01H:EDX.PSE_36[17]` is 1, the PSE-36 mechanism is supported, indicating that translations using 4 MiB pages with 32-bit paging may produce physical addresses with up to 40 bits.

***Process-context Identifiers (PCIDs)***. If `CPUID.01H:ECX.PCID[17]` is 1, `CR4.PCIDE` may be set to enable process-context identifiers.

***Supervisor-mode access prevention (SMAP)***. If `CPUID.07H.00H:EBX.SMAP[20]` is 1, `CR4.SMAP` may be set to enable supervisor-mode access prevention.

***Supervisor-mode execution prevention (SMEP)***. If `CPUID.07H.00H:EBX.SMEP[7]` is 1, `CR4.SMEP` may be set to enable supervisor-mode execution prevention.

***Protection keys for user-mode pages (PKU)***. If `CPUID.07H.00H:ECX.PKU[3]` is 1, `CR4.PKE` may be set to enable protection keys for user-mode pages.

***OSPKE: enabling of protection keys for user-mode pages***. `CPUID.07H.00H:ECX.OSPKE[4]` returns the value of `CR4.PKE`. Thus, protection keys for user-mode pages are enabled if this flag is 1.

***Control-flow Enforcement Technology (CET)***. If `CPUID.07H.00H:ECX.CET_SS[7]` is 1, `CR4.CET` may be set to enable shadow-stack pages.

***57-bit linear addresses and 5-level paging (LA57)***. If `CPUID.07H.00H:ECX.LA57[16]` is 1, `CR4.LA57` may be set to enable 5-level paging.

***Protection keys for supervisor-mode pages (PKS)***. If `CPUID.07H.00H:ECX.PKS[31]` is 1, `CR4.PKS` may be set to enable protection keys for supervisor-mode pages.

***Execute Disable (NX)***.
  - If `CPUID.80000001H:EDX.EXECUTE_DIS[20]` is 1, `IA32_EFER.NXE` may be set to allow software to disable execute access to selected pages.
  - Processors that do not support CPUID.80000001H do not allow `IA32_EFER.NXE` to be set.

***1 GiB pages***. If `CPUID.80000001H:EDX.PAGE_1GB[26]` is 1, 1 GiB pages may be supported with 4-level paging and 5-level paging.

***IA-32e mode support (LM)***.
  - If `CPUID.80000001H:EDX.INTEL64[29]` is 1, `IA32_EFER.LME` may be set to enable IA-32e mode (with either 4-level paging or 5-level paging).
  - Processors that do not support `CPUID.80000001H` do not allow `IA32_EFER.LME` to be set.

---

`CPUID.80000008H:EAX[7:0]` reports the physical-address width supported by the processor. This width is at most 52 and is used to determine the value of `MAXPHYADDR`, which is used by paging.

For processors that do not support `CPUID.80000008H`, the width is generally 36 if `CPUID.01H:EDX.PAE[6]` is 1 and 32 otherwise.

If `IA32_TME_ACTIVATE[0]` is 1 (indicating that `TME` has been configured), `MAXPHYADDR` is reduced by the value of `IA32_TME_ACTIVATE[39:36]` when a logical processor is outside secure arbitration mode (SEAM); the value is not reduced in SEAM.

For example, if `CPUID.80000008H:EAX[7:0]` is 48, `IA32_TME_ACTIVATE[39:36]` is 4, and `TME` has been configured, `MAXPHYADDR` is 44 outside SEAM ,but remains 48 in SEAM.

If the logical processor is in VMX non-root operation and EPT is enabled, the addresses in `CR3` and in paging-structure entries are treated as guest-physical addresses. The width of these addresses is limited only by the value enumerated by `CPUID.80000008H:EAX[7:0]` without any regard to `TME` or `SEAM`.

---

`CPUID.80000008H:EAX[15:8]` reports the linear-address width supported by the processor. Generally, this value is reported as follows:
  - If `CPUID.80000001H:EDX.INTEL64[29]` is 0, the value is reported as 32.
  - If `CPUID.80000001H:EDX.INTEL64[29]` is 1 and `CPUID.07H.00H:ECX.LA57[16]` is 0, the value is reported as 48.
  - If `CPUID.07H.00H:ECX.LA57[16]` is 1, the value is reported as 57.

Processors that don't support `CPUID.80000008H`, support a linear-address width of 32.

---

# Hierarchical Paging Structures Overview

All four paging modes translate linear addresses using hierarchical paging structures.

Every paging structure is 4096 bytes (4 KiB) in size and comprises a number of individual entries.
  - With 32-bit paging, each entry is 32 bits (4 bytes), so there are 1024 entries in each structure.
  - With the other paging modes, each entry is 64 bits (8 bytes), so there are 512 entries in each structure. PAE paging includes one exception; a paging structure that is 32 bytes in size, containing four 64-bit entries.

The processor uses the upper portion of a linear address to identify a series of paging-structure entries.
  - The last of these entries identifies the physical address of the region to which the linear address translates, called ***the page frame***.
  - The lower portion of the linear address, called ***the page offset*** identifies the specific address within that region to which the linear address translates.

Each paging-structure entry contains a physical address, which is either the address of another paging structure or the address of a page frame. In the first case, the entry is said to reference the other paging structure; in the latter, the entry is said to map a page.

---

The first paging structure used for any translation is located at the physical address in `CR3`, except HLAT paging. A linear address is translated using the following iterative procedure.

A portion of the linear address (initially the uppermost bits) selects an entry in a paging structure (initially the one located using `CR3`).
  - If that entry references another paging structure, the process continues with that paging structure and with the portion of the linear address immediately below that just used.
  - If instead the entry maps a page, the process completes. The physical address in the entry is that of the page frame and the remaining lower portion of the linear address is the page offset.

---

## Examples

With ***32-bit paging***, each paging structure comprises 1024 (2<sup>10</sup>) entries. Since 1024 requires 10 bits to be represented, the translation process uses 10 bits at a time from a 32-bit linear address.
  - Bits `31:22` identify the first paging-structure entry and bits `21:12` identifies the page frame.
  - Bits `11:0` are the page offset within the 4 KiB page frame.

With ***PAE paging***, the first paging structure comprises only 4 (2<sup>2</sup>) entries.
  - The translation process begins by using bits `31:30` from a 32-bit linear address to identify the first paging-structure entry. Other paging structures comprises 512 (2<sup>9</sup>) entries, so the process continues by using 9 bits at a time.
  - Bits `29:21` identify the second paging-structure entry and bits `20:12` identifies the page frame.

With ***4-level paging***, each paging structure comprises 512 (2<sup>9</sup>) entries and the translation process uses 9 bits at a time from a 48-bit linear address. Bits
  - `47:39` identify the first paging-structure entry.
  - `38:30` identify the second paging-structure entry.
  - `29:21` identify the third paging-structure entry.
  - `20:12` identifies the page frame.

5-level paging is similar to 4-level paging except that 5-level paging translates 57-bit linear addresses. Bits `56:48` identify the first paging-structure entry, while the remaining bits are used as with 4-level paging.

---

The translation process in each of the examples above completes by identifying ***a page frame***. In some cases, however, the paging structures may be configured so that the translation process terminates before identifying a page frame.

This occurs if the process encounters a paging-structure entry that is marked "not present" (because its P flag — bit 0 — is clear) or in which a reserved bit is set. In this case, there is no translation for the linear address; an access to that address causes a page-fault exception.

---

In the examples above, a paging-structure entry maps a page with a 4 KiB page frame when only 12 bits remain in the linear address; entries identified earlier always reference other paging structures. That may not apply in other cases. The following items identify when an entry maps a page and when it references another paging structure:

  - If more than 12 bits remain in the linear address, bit 7 (PS — page size) of the current paging-structure entry is consulted. If the bit is 0, the entry references another paging structure; if the bit is 1, the entry maps a page.

  - If only 12 bits remain in the linear address, the current paging-structure entry always maps a page (bit 7 is used for other purposes).

---

If a paging-structure entry maps a page when more than 12 bits remain in the linear address, the entry identifies a page frame larger than 4 KiB. For example, 32-bit paging uses the upper 10 bits of a linear address to locate the first paging-structure entry; 22 bits remain. If that entry maps a page, the page frame is 2<sup>22</sup> bytes, i.e. a 4 MiB page.

32-bit paging can use 4 MiB pages if `CR4.PSE` is 1. The other paging modes can use 2 MiB pages, regardless of the value of `CR4.PSE`. 4-level paging and 5-level paging can use 1 GiB pages if the processor supports them.

---

Paging structures are given different names based on their uses in the translation process.

| Paging Structure | Enter Name | Paging Mode | Structure's Physical Address Loc. | Virtual Address Width | Bits Selecting an Entry | Page Mapping |
| ---------------- | ---------- | ----------- | --------------------------------- | --------------------- | ----------------------- | ------------ |
| Page Map Level-5 (PML5) | PML5E | 5-level | `CR3` | 64 bits | 56:48 | N/A |
| Page Map Level-4 (PML4) | PML4E | 5-level | PML5E | 64 bits | 47:39 | N/A |
|                         |       | 4-level | `CR3` | 64 bits | 47:39 | N/A |
| Page Directory Pointer Table (PDPT) | PDPTE | PAE | `CR3` | | 31:30 | N/A |
|                                     |       | 4-level and 5-level | PML4E | | 38:30 | 1 GiB page (if `PS` bit is 1) |
| Page Directory (PD) | PDE | 32-bit | `CR3` | | 31:22 | 4 MiB pages (if `PS` bit is 1) |
|                     |     | PAE, 4-level and 5-level | PDPTE | | 29:21 | 2 MiB pages (if `PS` bit is 1) |
| Page Table (PT) | PTE | 32-bit | PDE | | 21:12 | 4 KiB page |
| | | PAE, 4-level and 5-level   | PDE | | 20:12 | 4 KiB page |

Please note that
  - If HLAT paging is in use, a different mechanism is used to identify the first paging structure.
  - Not all processors support 1 GiB pages.
  - 32-bit paging ignores the `PS` flag in a `PDE` and uses the entry to reference a page table, unless `CR4.PSE` is set.
  - Not all processors support 4 MiB pages with 32-bit paging.
