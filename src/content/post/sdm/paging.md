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

# 32-Bit Paging

A logical processor uses 32-bit paging if `CR0.PG` is 1 and `CR4.PAE` is 0.

32-bit paging translates 32-bit linear addresses to 40-bit physical addresses. Although 40 bits corresponds to 1 TiB, linear addresses are limited to 32 bits. At most 4 GiB of linear-address space may be accessed at any given time.

32-bit paging uses a hierarchy of paging structures to produce a translation for a linear address. `CR3` is used to locate the first paging-structure, the page directory.

32-bit paging may map linear addresses to either 4 KiB pages or 4 MiB pages.

The following items describe the 32-bit paging process in more detail as well has how the page size is determined:

A 4 KiB naturally aligned page directory is located at the physical address specified in bits 31:12 of `CR3`. A page directory comprises 1024 32-bit entries (PDEs). A PDE is selected using the physical address defined as follows:

  - Bits 39:32 are all 0.
  - Bits 31:12 are from `CR3`.
  - Bits 11:2 are bits 31:22 of the linear address.
  - Bits 1:0 are 0.

Because a PDE is identified using bits 31:22 of the linear address, it controls access to a 4 MiB region of the linear-address space. Use of the PDE depends on `CR4.PSE` and the PDE's `PS` flag (bit 7).

If `CR4.PSE` is 1 and the PDE's `PS` flag is 1, the PDE maps a 4 MiB page. The final physical address is computed as follows:
  - Bits 39:32 are bits 20:13 of the PDE.
  - Bits 31:22 are bits 31:22 of the PDE.
  - Bits 21:0 are from the original linear address.

If `CR4.PSE` is 0 or the PDE's `PS` flag is 0, a 4 KiB naturally aligned page table is located at the physical address specified in bits 31:12 of the PDE. A page table comprises 1024 32-bit entries (PTEs). A PTE is selected using the physical address defined as follows:
  - Bits 39:32 are all 0.
  - Bits 31:12 are from the PDE.
  - Bits 11:2 are bits 21:12 of the linear address.
  - Bits 1:0 are 0.

Because a PTE is identified using bits 31:12 of the linear address, every PTE maps a 4 KiB page. The final physical address is computed as follows:
  - Bits 39:32 are all 0.
  - Bits 31:12 are from the PTE.
  - Bits 11:0 are from the original linear address.

If a paging-structure entry's `P` flag (bit 0) is 0 or if the entry sets any reserved bit, the entry is used neither to reference another paging-structure entry nor to map a page. There is no translation for a linear address whose translation would use such a paging-structure entry; a reference to such a linear address causes a page-fault exception.

---

***Notes***:

  - Bits in the range 39:32 are 0 in any physical address used by 32-bit paging except those used to map 4 MiB pages. If the processor does not support the PSE-36 mechanism, this is true also for physical addresses used to map 4 MiB pages. If the processor does support the PSE-36 mechanism and MAXPHYADDR < 40, bits in the range 39:MAXPHYADDR are 0 in any physical address used to map a 4 MiB page. (The corresponding bits are reserved in PDEs.)

  - The upper bits in the final physical address do not all come from corresponding positions in the PDE; the physical-address bits in the PDE are not all contiguous.

---

With 32-bit paging, there are reserved bits only if `CR4.PSE` is 1. If `CR4.PSE` is 0, no bits are reserved with 32-bit paging.

If the `P` flag and the `PS` flag (bit 7) of a PDE are both 1, the bits reserved depend on `MAXPHYADDR`, and whether the `PSE-36` mechanism is supported:
  - If the `PSE-36` mechanism is not supported, bits 21:13 are reserved.
  - If the `PSE-36` mechanism is supported, bits 21:M–19 are reserved, where M is the minimum of 40 and `MAXPHYADDR`.

If the PAT is not supported:
  - If the `P` flag of a PTE is 1, bit 7 is reserved.
  - If the `P` flag and the `PS` flag of a PDE are both 1, bit 12 is reserved.

---

A reference using a linear address that is successfully translated to a physical address is performed only if allowed by the access rights of the translation.

---

## Structure of CR3 (32-bit)

```bash
# CR3
[Address of Page Directory] [Ignored] [PCD] [PWT] [Ignored]
31                       12 11      5   4     3   2       0
```

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 2:0 | Ignored |
| 3 | (`PWT`) Page-level Write-Through | Controls the memory type used to access the first paging structure of the current paging-structure hierarchy. |
| | | This bit is not used if paging is disabled, with PAE paging, or with 4-level paging or 5-level paging if `CR4.PCIDE` is set. |
| 4 | (`PCD`) Page-level Cache Disable Bit | Controls the memory type used to access the first paging structure of the current paging-structure hierarchy. |
| | | This bit is not used if paging is disabled, with PAE paging, or with 4-level paging or 5-level paging if `CR4.PCIDE` is set. |
| 11:5 | Ignored |
| 31:12 | Page Directory Base |
| 63:12 | Ignored (these bits exist only on processors supporting the Intel-64 architecture) |

---

## Structure of a PDE

When it locates a page table.

```bash
[Address of Page Table] [Ignored] [0] [IGN] [A] [PCD] [PWT] [U/S] [R/W] [P]
31                   12 11      8  7    6    5    4     3     2     1    0
```

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (P) Present Bit | Confused. |
| 1 | (R/W) Read/Write Accessibility | (0) Only read access is allowed to the 4 MiB page referenced by this entry. |
| 2 | (U/S) User/Supervisor Access | (0) User mode access is not allowed to the 4 MiB page referenced by this entry. |
| 3 | (PWT) Page-Level Write-Through | Indirectly determines the memory type used to access the page table referenced by this entry. |
| 4 | (PCD) Page-Level Cache Disable | Indirectly determines the memory type used to access the page table referenced by this entry. |
| 5 | (A) Accessed | Indicates whether this entry has been used for linear-address translation. |
| 6 | Ignored |
| 7 | (PS) Page Size | If `CR4.PSE` is 1, PS must be 0; otherwise, ignored. |
| 11:8 | Ignored |
| 31:12 | Physical address of the page table referenced by this entry. |

---

When it locates a page directly, a 4 MiB page is being referred here.

```bash
[Address of a 4 MiB PF] [Reserved (0)] [Bits 29:32 of Address] [PAT] [Ignored] [G] [PS] [D] [A] [PCD] [PWT] [U/S] [R/W] [1]
31                   22 21          17 16                   13   12  11      9  8   7   6   5    4     3     2     1    0
```

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (P) Present Bit | Confused. |
| 1 | (R/W) Read/Write Accessibility | (0) Only read access is allowed to the 4 MiB page referenced by this entry. |
| 2 | (U/S) User/Supervisor Access | (0) User mode access is not allowed to the 4 MiB page referenced by this entry. |
| 3 | (PWT) Page-Level Write-Through | Indirectly determines the memory type used to access the 4 MiB page referenced by this entry. |
| 4 | (PCD) Page-Level Cache Disable | Indirectly determines the memory type used to access the 4 MiB page referenced by this entry. |
| 5 | (A) Accessed | Indicates whether software has accessed the 4 MiB page referenced by this entry. |
| 6 | (D) Dirty Bit | Indicates whether software has written to the 4 MiB page referenced by this entry. |
| 7 | (PS) Page Size | Must be 1, otherwise it indicates that this entry references a page table. |
| 8 | (G) Global Bit | If `CR4.PGE` is 1, determines whether the translation is global; ignored otherwise. |
| 11:9 | Ignored |
| 12 | (PAT) Page Attribution Table | If the PAT is supported, indirectly determines the memory type used to access the 4 MiB page referenced by this entry; otherwise, reserved and must be 0. |
| 16:13 | | Confusing |
| 21:17 | Reserved | Confusing |
| 31:22 |

This example illustrates a processor in which `MAXPHYADDR` is 36. If this value is larger or smaller, the number of bits reserved in positions 20:13 of a PDE mapping a 4 MiB page will change.

---

When PDE not present:
```bash
[Ignored] [0]
31      1  0
```

---

## Structure of a PTE

With 4 KiB page

```bash
[Address of the 4 KiB PF] [Ignored] [G] [PAT] [D] [A] [PCD] [PWT] [U/S] [R/W] [1]
31                     12 11      9  8    7    6   5    4     3     2     1    0
```

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (P) Present Bit | Confused. |
| 1 | (R/W) Read/Write Accessibility | (0) Only read access is allowed to the 4 KiB page referenced by this entry. |
| 2 | (U/S) User/Supervisor Access | (0) User mode access is not allowed to the 4 KiB page referenced by this entry. |
| 3 | (PWT) Page-Level Write-Through | Indirectly determines the memory type used to access the 4 KiB page referenced by this entry. |
| 4 | (PCD) Page-Level Cache Disable | Indirectly determines the memory type used to access the 4 KiB page referenced by this entry. |
| 5 | (A) Accessed | Indicates whether software has accessed the 4 KiB page referenced by this entry. |
| 6 | (D) Dirty Bit | Indicates whether software has written to the 4 KiB page referenced by this entry. |
| 7 | (PAT) Page Attribution Table | If the PAT is supported, indirectly determines the memory type used to access the 4 KiB page referenced by this entry; otherwise, reserved and must be 0. |
| 8 | (G) Global Bit | If `CR4.PGE` is 1, determines whether the translation is global; ignored otherwise. |
| 11:9 | Ignored |
| 31:12 | Physical address of the 4 KiB page referenced by this entry. |

---

When not present
```bash
[Ignored] [0]
31      1  0
```

---

# PAE Paging

A logical processor uses PAE paging if `CR0.PG` is 1, `CR4.PAE` is 1, and `IA32_EFER.LME` is 0.

PAE paging translates 32-bit linear addresses to 52-bit physical addresses. Although 52 bits corresponds to 4 PiB, linear addresses are limited to 32 bits. At most 4 GiB of linear-address space may be accessed at any given time.

With PAE paging, a logical processor maintains a set of four (4) PDPTE registers, which are loaded from an address in `CR3`. Linear address are translated using 4 hierarchies of in-memory paging structures, each located using one of the PDPTE registers. This is different from the other paging modes, in which there is one hierarchy referenced by `CR3`.

---

When PAE paging is used, `CR3` references the base of a 32-Byte page-directory-pointer table.

| Bit Position(s) | Description |
| --------------- | ----------- |
| 4:0 | Ignored |
| 31:5 | Physical address of the 32-Byte aligned page-directory-pointer table used for linear-address translation. |
| 63:32 | Ignored; exist only in Intel 64. |


The page-directory-pointer-table comprises four 64-bit entries called ***PDPTEs***. Each PDPTE controls access to a 1 GiB region of the linear-address space.

Corresponding to the PDPTEs, the logical processor maintains a set of four internal, non-architectural PDPTE registers, called `PDPTE0`, `PDPTE1`, `PDPTE2`, and `PDPTE3`.

The logical processor loads these registers from the PDPTEs in memory as part of certain operations:

  - If PAE paging would be in use following an execution of "MOV to CR0" or "MOV to CR4" and the instruction is modifying any of `CR0.CD`, `CR0.NW`, `CR0.PG`, `CR4.PAE`, `CR4.PGE`, `CR4.PSE`, or `CR4.SMEP`; then the PDPTEs are loaded from the address in CR3.

  - If "MOV to CR3" is executed while the logical processor is using PAE paging, the PDPTEs are loaded from the address being loaded into `CR3`.

  - If PAE paging is in use and a task switch changes the value of `CR3`, the PDPTEs are loaded from the address in the new `CR3` value.

  - Certain VMX transitions load the PDPTE registers.

---

## Format of a PAE Page-Directory-Pointer-Table Entry (PDPTE)

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (P) Present Bit |
| 2:1 | Reserved | Must be 0. |
| 3 | Page-Level Write-Through |
| 4 | Page-Level Cache Disable |
| 8:5 | Reserved | Must be 0. |
| 11:9 | Ignored |
| M-1:12 | | Physical address of the page directory referenced by this entry. |
| 63:M | Reserved | Must be 0. |


***Notes***
  - If EPT is not enabled, `M` is an abbreviation for `MAXPHYADDR`.
  - If EPT is enabled, `M` represents the value returned by `CPUID.80000008H:EAX[7:0]`.
  - If any of the PDPTEs sets both the P flag (bit 0) and any reserved bit, the "MOV to CR" instruction causes a `#GP(0)` and the PDPTEs are not loaded.


---

## Linear-Address Translation with PAE Paging

PAE paging may map linear addresses to either 4 KiB pages or 2 MiB pages.

Bits `31:30` of the linear address select a PDPTE register; this is `PDPTEi`, where i is the value of bits 31:30. Because a PDPTE register is identified using bits 31:30 of the linear address, it controls access to a 1 GiB region of the linear-address space.

If the `P` flag (bit 0) of `PDPTEi` is 0, the processor ignores bits `63:1`, and there is no mapping for the 1 GiB region controlled by `PDPTEi`. A reference using a linear address in this region causes a page-fault exception.

If the `P` flag of `PDPTEi` is 1, a 4 KiB naturally aligned page directory is located at the physical address specified in bits 51:12 of `PDPTEi`. A page directory comprises 512 64-bit entries (PDEs).

A PDE is selected using the physical address defined as follows:
  - Bits 51:12 are from `PDPTEi`.
  - Bits 11:3 are bits 29:21 of the linear address.
  - Bits 2:0 are 0.

---

Because a PDE is identified using bits 31:21 of the linear address, it controls access to a 2 MiB region of the
linear-address space. Use of the PDE depends on its PS flag (bit 7).

If the PDE's `PS` flag is 1, the PDE maps a 2 MiB page. The final physical address is computed as follows:
  - Bits 51:21 are from the PDE.
  - Bits 20:0 are from the original linear address.

If the PDE's `PS` flag is 0, a 4 KiB naturally aligned page table is located at the physical address specified in bits 51:12 of the PDE. A page table comprises 512 64-bit entries (PTEs). A PTE is selected using the physical address defined as follows:
  - Bits 51:12 are from the PDE.
  - Bits 11:3 are bits 20:12 of the linear address.
  - Bits 2:0 are 0.

---

Because a PTE is identified using bits 31:12 of the linear address, every PTE maps a 4 KiB page. The final physical address is computed as follows:
  - Bits 51:12 are from the PTE.
  - Bits 11:0 are from the original linear address.

---

If the P flag (bit 0) of a PDE or a PTE is 0 or if a PDE or a PTE sets any reserved bit, the entry is used neither to reference another paging-structure entry nor to map a page. There is no translation for a linear address whose translation would use such a paging-structure entry; a reference to such a linear address causes a page-fault exception.

The following bits are reserved with PAE paging:

  - If the P flag (bit 0) of a PDE or a PTE is 1, bits 62:M are reserved, where M is `MAXPHYADDR` (unless EPT is enabled, in which case M is the value enumerated by `CPUID.80000008H:EAX[7:0]`).
  - If the P flag and the PS flag (bit 7) of a PDE are both 1, bits 20:13 are reserved.
  - If `IA32_EFER.NXE` is 0 and the P flag of a PDE or a PTE is 1, the XD flag (bit 63) is reserved.
  - If the PAT is not supported:
    - If the P flag of a PTE is 1, bit 7 is reserved.
    - If the P flag and the PS flag of a PDE are both 1, bit 12 is reserved.

A reference using a linear address that is successfully translated to a physical address is performed only if allowed by the access rights of the translation.

---

## Format of a PAE Page-Directory Entry that Maps a 2 MiB Page

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (P) Present Bit | Confused. |
| 1 | (R/W) Read/Write Accessibility | (0) Only read access is allowed to the 2 MiB page referenced by this entry. |
| 2 | (U/S) User/Supervisor Access | (0) User mode access is not allowed to the 2 MiB page referenced by this entry. |
| 3 | (PWT) Page-Level Write-Through | Indirectly determines the memory type used to access the 2 MiB page referenced by this entry. |
| 4 | (PCD) Page-Level Cache Disable | Indirectly determines the memory type used to access the 2 MiB page referenced by this entry. |
| 5 | (A) Accessed | Indicates whether software has accessed the 2 MiB page referenced by this entry. |
| 6 | (D) Dirty Bit | Indicates whether software has written to the 2 MiB page referenced by this entry. |
| 7 | (PS) Page Size | Must be 1, otherwise it indicates that this entry references a page table. |
| 8 | (G) Global Bit | If `CR4.PGE` is 1, determines whether the translation is global; ignored otherwise. |
| 11:9 | Ignored |
| 12 | (PAT) Page Attribution Table | If the PAT is supported, indirectly determines the memory type used to access the 2 MiB page referenced by this entry; otherwise, reserved and must be 0. |
| 20:13 | Reserved | Must be 0. |
| M-1:21 | Reserved | Physical address of the 2 MiB page referenced by this entry. |
| 62:M | Reserved | Must be 0. |
| 63 | | If `IA32_EFER.NXE` is 1, ***execute-disable*** (if 1, instruction fetches are not allowed from the 2 MiB page controlled by this entry); otherwise, reserved (must be 0). |

If EPT is not enabled, `M` is an abbreviation for `MAXPHYADDR`. If EPT is enabled, `M` represents the value returned by `CPUID.80000008H:EAX[7:0]`.

---

## Format of a PAE Page-Directory Entry that References a Page Table

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (P) Present Bit | Confused. |
| 1 | (R/W) Read/Write Accessibility | (0) Only read access is allowed to the 2 MiB page referenced by this entry. |
| 2 | (U/S) User/Supervisor Access | (0) User mode access is not allowed to the 2 MiB page referenced by this entry. |
| 3 | (PWT) Page-Level Write-Through | Indirectly determines the memory type used to access the 2 MiB page referenced by this entry. |
| 4 | (PCD) Page-Level Cache Disable | Indirectly determines the memory type used to access the 2 MiB page referenced by this entry. |
| 5 | (A) Accessed | Indicates whether this entry has been used for linear-address translation. |
| 6 | Ignored |
| 7 | (PS) Page Size | Must be 0. |
| 11:8 | Ignored |
| M-1:12 | | Physical address of the page table referenced by this entry. |
| 62:M | Reserved | Must be 0. |
| 63 | | If `IA32_EFER.NXE` is 1, ***execute-disable*** (if 1, instruction fetches are not allowed from the 2 MiB page controlled by this entry); otherwise, reserved (must be 0). |

If EPT is not enabled, `M` is an abbreviation for `MAXPHYADDR`. If EPT is enabled, `M` represents the value returned by `CPUID.80000008H:EAX[7:0]`.

---

## Format of a PAE Page-Table Entry that Maps a 4 KiB Page

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (P) Present Bit | Confused. |
| 1 | (R/W) Read/Write Accessibility | (0) Only read access is allowed to the 4 KiB page referenced by this entry. |
| 2 | (U/S) User/Supervisor Access | (0) User mode access is not allowed to the 4 KiB page referenced by this entry. |
| 3 | (PWT) Page-Level Write-Through | Indirectly determines the memory type used to access the 4 KiB page referenced by this entry. |
| 4 | (PCD) Page-Level Cache Disable | Indirectly determines the memory type used to access the 4 KiB page referenced by this entry. |
| 5 | (A) Accessed | Indicates whether software has accessed the 4 KiB page referenced by this entry. |
| 6 | (D) Dirty Bit | Indicates whether software has written to the 4 KiB page referenced by this entry. |
| 7 | (PS) Page Size | Must be 1, otherwise it indicates that this entry references a page table. |
| 8 | (G) Global Bit | If `CR4.PGE` is 1, determines whether the translation is global; ignored otherwise. |
| 11:9 | Ignored |
| M-1:12 | Reserved | Physical address of the 4 KiB page referenced by this entry. |
| 62:M | Reserved | Must be 0. |
| 63 | | If `IA32_EFER.NXE` is 1, ***execute-disable*** (if 1, instruction fetches are not allowed from the 4 KiB page controlled by this entry); otherwise, reserved (must be 0). |

If EPT is not enabled, `M` is an abbreviation for `MAXPHYADDR`. If EPT is enabled, `M` represents the value returned by `CPUID.80000008H:EAX[7:0]`.

---

# 4-level and 5-level Paging

Because the operation of 4-level paging and 5-level paging is very similar, they are described together in this section. The following items highlight the distinctions between the two paging modes:

A logical processor uses 4-level paging if `CR0.PG` is 1, `CR4.PAE` is 1, `IA32_EFER.LME` is 1, and `CR4.LA57` is 0.
  - 4-level paging translates 48-bit linear addresses to 52-bit physical addresses.
  - Although 52 bits corresponds to 4 PiB, linear addresses are limited to 48 bits; at most 256 TiB of linear-address space may be accessed at any given time.

A logical processor uses 5-level paging if `CR0.PG` is 1, `CR4.PAE` is 1, `IA32_EFER.LME` is 1, and `CR4.LA57` is 1.
  - 5-level paging translates 57-bit linear addresses to 52-bit physical addresses.
  - Thus, 5-level paging supports a linear-address space sufficient to access the entire physical-address space.

---

There are two forms of 4-level paging and 5-level paging that differ principally with regard to how linear-address translation identifies the first paging structure.

The normal form is called ***ordinary paging***, and it uses `CR3` to locate the first paging structure.

An alternative form of paging may be used with the VMX feature called ***hypervisor-managed linear-address translation***, or ***HLAT paging***.
  - It is used only in VMX non-root operation and only if the "enable HLAT" VM-execution control is 1.
  - HLAT paging locates the first paging structure using a VM-execution control field in the VMCS called the ***HLAT pointer*** (`HLATP`).

Whether HLAT paging is used to translate a specific linear address depends on the address and on the value of a VM-execution control field in the VMCS called the ***HLAT prefix size***:

  - If the HLAT prefix size is zero, every linear address is translated using HLAT paging.
  - If the HLAT prefix size is not zero, a linear address is translated using HLAT paging if bit 63 of the address is 1. The address is translated using ordinary paging if bit 63 of the address is 0. This behavior applies if the CPU enumerates a maximum HLAT prefix size of 1 in `IA32_VMX_EPT_VPID_CAP[53:48]`. Behavior when a different value is enumerated is not currently defined.

HLAT paging is used only with 4-level paging and 5-level paging. It is never used with 32-bit paging or PAE paging, regardless of the value of the "enable HLAT" VM-execution control.

In some cases, HLAT paging may specify that a translation of a linear address must be restarted. When this occurs, the linear address is then translated using ordinary paging.

---

## Use of CR3 with Ordinary 4-Level Paging and 5-Level Paging

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 2:0 | Ignored |
| 3 | (PWT) Page-Level Write-Through |
| 4 | (PCD) Page-Level Cache-Disable |
| 11:5 | Ignored |
| M-1:12 | | Physical address of the 4-KByte aligned PML4 table or PML5 table used for linear-address translation. |
| 60:M | Reserved | Must be 0. |
| 61 | | Enables LAM57 for user pointers. |
| 62 | | Enables LAM48 for user pointers; ignored if bit 61 is set. |
| 63 | Reserved | Must be 0. |

---

HLATP has the same format as that given for `CR3` above, with the exception that bits 2:0 and bits 11:5 are reserved and must be zero, they are checked by VM entry. HLATP does not contain a PCID value. HLAT paging with `CR4.PCIDE` set uses the PCID value in `CR3[11:0]`.

---

## Use of CR3 with 4-Level Paging and 5-Level Paging and CR4.PCIDE = 1

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 11:0 | PCID |
| M-1:12 | | Physical address of the 4-KByte aligned PML4 table used for linear-address translation. |
| 60:M | Reserved | Must be 0. |
| 61 | | Enables LAM57 for user pointers. |
| 62 | | Enables LAM48 for user pointers; ignored if bit 61 is set. |
| 63 | Reserved | Must be 0. |

After the software modifies the value of `CR4.PCIDE`, the logical processor immediately begins using `CR3` as specified for the new value. For example, if software changes `CR4.PCIDE` from 1 to 0, the current PCID immediately changes from `CR3[11:0]` to `000H`.

In addition, the logical processor subsequently determines the memory type used to access the PML4 table using `CR3.PWT` and `CR3.PCD`, which had been bits 4:3 of the PCID.

---

## Linear-Address Translation with 4-Level Paging and 5-Level Paging

[LOTS OF PROSE]

[LOTS OF TABLES]

---

HLAT paging may specify that a translation of a linear address must be restarted. Specifically, this occurs when HLAT paging encounters a paging-structure entry that sets bit 11.

When this occurs, translation of the linear address is restarted using ordinary paging. The restarted translation proceeds just as if the HLAT feature were not enabled. The entire linear address is translated again, including those portions that had been used by HLAT paging prior to the restart.

The process of restarting HLAT paging (using ordinary paging) always specifies a maximum page size to be used when a resulting translation is cached in the TLBs. This maximum page size depends on the level of the paging-structure entry that restarts the translation by setting bit 11. The page size of the translation produced by the restarted process is never greater than this maximum page size.

---

# Access Rights

There is a translation for a linear address if the processes completes and produces a physical address. Whether an access is permitted by a translation is determined by the access rights specified by the paging-structure entries controlling the translation (With PAE paging, the PDPTEs do not determine access rights); paging-mode modifiers in CR0, CR4, and the IA32_EFER MSR; EFLAGS.AC; and the mode of the access.

If HLAT paging is restarted, permissions are determined only by the access rights specified by the paging-structure entries that the subsequent ordinary paging used to translate the linear address. The access rights specified by the entries used earlier by HLAT paging do not apply.

## Determination of Access Rights

Every access to a linear address is either a supervisor-mode access or a user-mode access. For all instruction fetches and most data accesses, this distinction is determined by the current privilege level (CPL):
  - accesses made while CPL < 3 are supervisor-mode accesses, and
  - accesses made while CPL = 3 are user-mode accesses.

Some operations implicitly access system data structures with linear addresses; the resulting accesses to those data structures are supervisor-mode accesses regardless of CPL. Examples of such accesses include the following:
  - accesses to the global descriptor table (GDT) or local descriptor table (LDT) to load a segment descriptor.
  - accesses to the interrupt descriptor table (IDT) when delivering an interrupt or exception.
  - accesses to the task-state segment (TSS) as part of a task switch or change of CPL.

  All these accesses are called implicit supervisor-mode accesses regardless of CPL. Other accesses made while CPL < 3 are called explicit supervisor-mode accesses.

---

Access rights are also controlled by the mode of a linear address as specified by the paging-structure entries controlling the translation of the linear address.

If the `U/S` flag (bit 2) is 0 in at least one of the paging-structure entries, the address is a supervisor-mode address. Otherwise, the address is a user-mode address.

When the shadow-stack feature of control-flow enforcement technology (CET) is enabled, certain accesses to linear addresses are considered shadow-stack accesses.
  - Like ordinary data accesses, each shadow-stack access is defined as being either a user access or a supervisor access.
  - In general, a shadow-stack access is a user access if CPL is 3 and a supervisor access if CPL < 3. The `WRUSS` instruction is an exception; although it can be executed only if CPL = 0, the processor treats its shadow-stack accesses as user accesses.

Shadow-stack accesses are allowed only to shadow-stack addresses. A linear address is a shadow-stack
address if the following are true of the translation of the linear address:
  1. The `R/W` flag (bit 1) is 0 and the `dirty` flag (bit 6) is 1 in the paging-structure entry that maps the page containing the linear address;
  2. The `R/W` flag is 1 in every other paging-structure entry controlling the translation of the linear address.

The following items detail how paging determines access rights (only the items noted explicitly apply to shadow-stack accesses):

### For supervisor-mode accesses

Data may be read (implicitly or explicitly) from any supervisor-mode address with a protection key for which read access is permitted.

Data reads from user-mode pages. Access rights depend on the value of `CR4.SMAP`.
  - If 0, data may be read from any user-mode address with a protection key for which read access is permitted.

  - If 1, access rights depend on the value of `EFLAGS.AC` and whether the access is implicit or explicit.
    - If 1 and the access is explicit, data may be read from any user-mode address with a protection key for which read access is permitted.
    - If 0 or the access is implicit, data may not be read from any user-mode address.

Data writes to supervisor-mode addresses. Access rights depend on the value of `CR0.WP`.
  - If 0, data may be written to any supervisor-mode address with a protection key for which write access is permitted.
  - If 1, data may be written to any supervisor-mode address with a translation for which the `R/W` flag (bit 1) is 1 in every paging-structure entry controlling the translation and with a protection key for which write access is permitted; data may not be written to any supervisor-mode address with a translation for which the R/W flag is 0 in any paging-structure entry controlling the translation.

Data writes to user-mode addresses. Access rights depend on the value of `CR0.WP`.

  - If 0, access rights depend on the value of `CR4.SMAP`.
    - If 0, data may be written to any user-mode address with a protection key for which write access is permitted.
    - If 1, access rights depend on the value of `EFLAGS.AC` and whether the access is implicit or explicit.
      - If 1 and the access is explicit, data may be written to any user-mode address with a protection key for which write access is permitted.
      - If 0 or the access is implicit, data may not be written to any user-mode address.

  - If 1, access rights depend on the value of `CR4.SMAP`.
    - If 0, data may be written to any user-mode address with a translation for which the `R/W` flag is 1 in every paging-structure entry controlling the translation and with a protection key for which write access is permitted; data may not be written to any user-mode address with a translation for which the `R/W` flag is 0 in any paging-structure entry controlling the translation.
    - If 1, access rights depend on the value of `EFLAGS.AC` and whether the access is implicit or explicit.
      - If 1 and the access is explicit, data may be written to any user-mode address with a translation for which the `R/W` flag is 1 in every paging-structure entry controlling the translation and with a protection key for which write access is permitted; data may not be written to any user-mode address with a translation for which the R/W flag is 0 in any paging-structure entry controlling the translation.
      - If 0 or the access is implicit, data may not be written to any user-mode address.

Instruction fetches from supervisor-mode addresses.
  - For 32-bit paging or if IA32_EFER.NXE = 0, instructions may be fetched from any supervisor-mode address.
  - For other paging modes with IA32_EFER.NXE = 1, instructions may be fetched from any supervisor-mode address with a translation for which the XD flag (bit 63) is 0 in every paging-structure entry controlling the translation; instructions may not be fetched from any supervisor-mode address with a translation for which the XD flag is 1 in any paging-structure entry controlling the translation.

Instruction fetches from user-mode addresses. Access rights depend on the values of `CR4.SMEP`.
  - If 0, access rights depend on the paging mode and the value of `IA32_EFER.NXE`.
    - For 32-bit paging or if IA32_EFER.NXE = 0, instructions may be fetched from any user-mode address.
    - For other paging modes with IA32_EFER.NXE = 1, instructions may be fetched from any user-mode address with a translation for which the XD flag is 0 in every paging-structure entry controlling the translation; instructions may not be fetched from any user-mode address with a translation for which the XD flag is 1 in any paging-structure entry controlling the translation.
  - If 1, instructions may not be fetched from any user-mode address.

Supervisor-mode shadow-stack accesses are allowed only to supervisor-mode shadow-stack addresses.

---

### Fore user-mode accesses

Data reads. Access rights depend on the mode of the linear address:
  - Data may be read from any user-mode address with a protection key for which read access is permitted.
  - Data may not be read from any supervisor-mode address.

Data writes. Access rights depend on the mode of the linear address:
  - Data may be written to any user-mode address with a translation for which the R/W flag is 1 in every paging-structure entry controlling the translation and with a protection key for which write access is permitted.
  - Data may not be written to any supervisor-mode address.

Instruction fetches. Access rights depend on the mode of the linear address, the paging mode, and the value of `IA32_EFER.NXE`.
  - For 32-bit paging or if IA32_EFER.NXE = 0, instructions may be fetched from any user-mode address.
  - For other paging modes with IA32_EFER.NXE = 1, instructions may be fetched from any user-mode address with a translation for which the XD flag is 0 in every paging-structure entry controlling the translation.
  - Instructions may not be fetched from any supervisor-mode address.

User-mode shadow-stack accesses made outside enclave mode are allowed only to user-mode shadow-stack addresses. User-mode shadow-stack accesses made in enclave mode are treated like ordinary data accesses.

---

A processor may cache information from the paging-structure entries in TLBs and paging-structure caches. These structures may include information about access rights. The processor may enforce access rights based on the TLBs and paging-structure caches instead of on the paging structures in memory.

This fact implies that, if software modifies a paging-structure entry to change access rights, the processor might not use that change for a subsequent access to an affected linear address.

---

## Protection Keys

4-level paging and 5-level paging associate a 4-bit protection key with each linear address (the protection key located in bits 62:59 of the paging-structure entry that mapped the page containing the linear address.

Two protection key features control accesses to linear addresses based on their protection keys:
  - If `CR4.PKE` is 1, the `PKRU` register determines, for each protection key, whether user-mode addresses with that protection key may be read or written.
  - If `CR4.PKS` is 1, the `IA32_PKRS` MSR (MSR index 6E1H) determines, for each protection key, whether supervisor-mode addresses with that protection key may be read or written.

32-bit paging and PAE paging do not associate linear addresses with protection keys. For the purposes of Section 5.6.1, reads and writes are implicitly permitted for all protection keys with either of those paging modes.

[MORE LORE]

---

# Page Fault Exceptions

Accesses using linear addresses may cause page-fault exceptions (#PF; exception 14).

An access to a linear address may cause a page-fault exception for either of two reasons.
  1. There is no translation for the linear address.
  2. There is a translation for the linear address, but its access rights do not permit the access.

As noted previously, there is no translation for a linear address if the translation process for that address would use a paging-structure entry in which the P flag (bit 0) is 0 or one that sets a reserved bit. If there is a translation for a linear address, its access rights are determined as specified earlier.

When a page fault occurs, the processor loads the `CR2` register with the linear address that generated the exception.
  - If linear-address masking had been in effect, the address recorded reflects the result of that masking and does not contain any masked metadata.
  - If the page-fault exception occurred during execution of an instruction in enclave mode (and not during delivery of an event incident to enclave mode), bits 11:0 of the address are cleared.

---

The processor provides an error code on delivery of a page-fault exception. The following items explain how the bits in the error code describe the nature of the page-fault exception:

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | `P` | (0) The fault was caused by a non-present page. |
| | | (1) The fault was caused by a page-level protection violation. |
| 1 | `W/R` | (0) The access causing the fault was a read. |
| | | (1) The access causing the fault was a write. |
| 2 | `U/S` | (0) A supervisor-mode access caused the fault. |
| | | (1) A user-mode access caused the fault. |
| 3 | `RSVD` | (0) The fault was not caused by reserved bit violation. |
| | | (1) The fault was caused by a reserved bit set to 1 in some paging-structure entry. |
| 4 | `I/D` | (0) The fault was not caused by an instruction fetch. |
| | | (1) The fault was caused by an instruction fetch. |
| 5 | `PK` | (0) The fault was not caused by protection keys. |
| | | (1) The fault was not caused by protection keys. |
| 6 | `SS` | (0) The fault was not caused by a shadow-stack access. |
| | | (1) The fault was caused by a shadow-stack access. |
| 7 | `HLAT` | (0) The fault occurred during ordinary paging or due to access rights. |
| | | (1) The fault occurred during HLAT paging. |
| 14:8 | Reserved |
| 15 | SGX (Secure Guard Extensions) | (0) The fault is not related to SGX. |
| | | (1) The fault resulted from violation of SGX-specific access-control requirements. |
| 31:16 | Reserved |

If HLAT paging encounters a paging-structure entry that sets a reserved bit, there is no translation even if the bit 11 of the entry indicates a restart. In this case, there is a page fault and the translation is not restarted.

[MORE LORE]

---

# Accessed and Dirty Flags

For any paging-structure entry that is used during linear-address translation, bit 5 is the accessed flag. For paging-structure entries that map a page (as opposed to referencing another paging structure), bit 6 is the dirty flag.

These flags are provided for use by memory-management software to manage the transfer of pages and paging structures into and out of physical memory.

Whenever the processor uses a paging-structure entry as part of linear-address translation, it sets the accessed flag in that entry (if it is not already set).

Whenever there is a write to a linear address, the processor sets the dirty flag (if it is not already set) in the paging-structure entry that identifies the final physical address for the linear address (either a PTE or a paging-structure entry in which the PS flag is 1).

The previous two paragraphs apply also to HLAT paging. If HLAT paging encounters a paging-structure entry that sets bit 11, indicating a restart, the processor will set the accessed flag in that entry; it will not set the dirty flag because, if an entry indicates a restart, it does identify the final physical address for the linear address being translated.

Memory-management software may clear these flags when a page or a paging structure is initially loaded into physical memory. These flags are “sticky,” meaning that, once set, the processor does not clear them; only software can clear them.

A processor may cache information from the paging-structure entries in TLBs and paging-structure caches. This fact implies that, if software changes an accessed flag or a dirty flag from 1 to 0, the processor might not set the corresponding bit in memory on a subsequent access using an affected linear address.

---

# Paging and Memory Type

The ***memory type*** of a memory access refers to the type of caching used for that access.

The way in which paging contributes to memory typing depends on whether the processor supports the Page Attribute Table.

The PAT is supported on all processors that support 4-level paging or 5-level paging.

## Paging and Memory Typing When the PAT is Not Supported

If the PAT is not supported, paging contributes to memory typing in conjunction with the memory-type range registers (MTRRs).

For any access to a physical address, the table combines the memory type specified for that physical address by the MTRRs with a PCD value and a PWT value. The latter two values are determined as follows:
  - For an access to a PDE with 32-bit paging, the PCD and PWT values come from CR3.
  - For an access to a PDE with PAE paging, the PCD and PWT values come from the relevant PDPTE register.
  - For an access to a PTE, the PCD and PWT values come from the relevant PDE.
  - For an access to the physical address that is the translation of a linear address, the PCD and PWT values come from the relevant PTE (if the translation uses a 4-KByte page) or the relevant PDE (otherwise).
  - With PAE paging, the UC memory type is used when loading the PDPTEs.

---

## Paging and Memory Typing When the PAT is Supported

[UN-UNDERSTANDABLE INFO]