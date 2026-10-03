---
title: "Control Registers"
publishDate: "2026-10-03"
# updatedDate: "2026-M-D"
description: "Control Registers"
tags: [ intel-sdm ]
draft: true
---

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

# CR0 Flags

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 0 | (`PE`) Protection Enable Bit. | Enables protected mode when set; enables real-address mode when clear. |
| | | This flag does not enable paging directly. It only enables segment-level protection. To enable paging, both the `PE` and `PG` flags must be set. |
| 1 | (`MP`) Monitor Coprocessor | Controls the interaction of the `WAIT` or `FWAIT` instruction with the TS flag. |
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


# CR3 Flags

| Bit Position(s) | Name | Description |
| --------------- | ---- | ----------- |
| 2:0 | Reserved |
| 3 | (`PWT`) Page-level Write-Through | Controls the memory type used to access the first paging structure of the current paging-structure hierarchy. |
| | | This bit is not used if paging is disabled, with PAE paging, or with 4-level paging or 5-level paging if `CR4.PCIDE` is set. |
| 4 | (`PCD`) Page-level Cache Disable Bit | Controls the memory type used to access the first paging structure of the current paging-structure hierarchy. |
| | | This bit is not used if paging is disabled, with PAE paging, or with 4-level paging or 5-level paging if `CR4.PCIDE` is set. |
| 11:5 | Reserved |
| 60:12 | Page Directory Base |
| 61 | (`LAM_U57`) User LAM57 Enable Bit | When set and `CR3.LAM_U48` is clear, enables LAM57 (masking of linear-address bits 62:57) for user pointers. |
| 62 | (`LAM_U48`) User LAM48 Enable Bit | When set and `CR3.LAM_U57` is clear, enables LAM48 (masking of linear-address bits 62:48) for user pointers. |
| 63 | |


# CR4 Flags

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

# CR8 Flags

| Bit Position(s) | Description |
| --------------- | ----------- |
| 0 |
| 1 |
| 2 |
| 3 |
| 63:4 | Reserved |

# Extended Control Registers

If `CPUID.01H:ECX.XSAVE[26]` is 1, the processor supports one or more extended control registers (XCRs).

Currently, the only such register defined is `XCR0`. This register specifies the set of processor state components for which the operating system provides context management, e.g., x87 FPU state, SSE state, AVX state. The OS programs `XCR0` to reflect the features for which it provides context management.
