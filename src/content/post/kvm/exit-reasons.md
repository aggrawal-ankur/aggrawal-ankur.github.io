---
title: "VM Exits in KVM: Linux Kernel v7.2.6"
publishDate: "2026-09-19"
# updatedDate: "2026-M-D"
description: "This text explores the various reasons a VM exit can occur (on Intel x86) and how the VMM is notified about it (struct kvm_run). It is based on the Linux Kernel v7.2.6 release."
tags: [ linux-kvm ]
draft: true
---

The following VM exit events are defined in [*root/include/uapi/linux/kvm.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/uapi/linux/kvm.h?h=v7.2.6#n151).

| VM Exit (Macro) | Constant Value | Availability |
| --------------- | -------------- | ------------ |
| KVM_EXIT_UNKNOWN         |  0 | Arch-independent |
| KVM_EXIT_EXCEPTION       |  1 | Arch-independent |
| KVM_EXIT_IO              |  2 | Arch-independent |
| KVM_EXIT_HYPERCALL       |  3 | Arch-independent |
| KVM_EXIT_DEBUG           |  4 | Arch-independent |
| KVM_EXIT_HLT             |  5 | Arch-independent |
| KVM_EXIT_MMIO            |  6 | Arch-independent |
| KVM_EXIT_IRQ_WINDOW_OPEN |  7 | Arch-independent |
| KVM_EXIT_SHUTDOWN        |  8 | Arch-independent |
| KVM_EXIT_FAIL_ENTRY      |  9 | Arch-independent |
| KVM_EXIT_INTR            | 10 | Arch-independent |
| KVM_EXIT_SET_TPR         | 11 | x86 |
| KVM_EXIT_TPR_ACCESS      | 12 | x86 |
| KVM_EXIT_S390_SIEIC      | 13 | s390 |
| KVM_EXIT_S390_RESET      | 14 | s390 |
| KVM_EXIT_DCR             | 15 | PowerPC (deprecated) |
| KVM_EXIT_NMI             | 16 | Arch-independent |
| KVM_EXIT_INTERNAL_ERROR  | 17 | Arch-independent |
| KVM_EXIT_OSI             | 18 | PowerPC |
| KVM_EXIT_PAPR_HCALL      | 19 | PowerPC |
| KVM_EXIT_S390_UCONTROL   | 20 | s390 |
| KVM_EXIT_WATCHDOG        | 21 | Arch-independent |
| KVM_EXIT_S390_TSCH       | 22 | s390 |
| KVM_EXIT_EPR             | 23 | PowerPC |
| KVM_EXIT_SYSTEM_EVENT    | 24 | Arch-independent |
| KVM_EXIT_S390_STSI       | 25 | s390 |
| KVM_EXIT_IOAPIC_EOI      | 26 | x86 |
| KVM_EXIT_HYPERV          | 27 |
| KVM_EXIT_ARM_NISV        | 28 | ARM |
| KVM_EXIT_X86_RDMSR       | 29 | x86 |
| KVM_EXIT_X86_WRMSR       | 30 | x86 |
| KVM_EXIT_DIRTY_RING_FULL | 31 | Arch-independent |
| KVM_EXIT_AP_RESET_HOLD   | 32 | Arch-independent |
| KVM_EXIT_X86_BUS_LOCK    | 33 | x86 |
| KVM_EXIT_XEN             | 34 | Xen |
| KVM_EXIT_RISCV_SBI       | 35 | RISC-V |
| KVM_EXIT_RISCV_CSR       | 36 | RISC-V |
| KVM_EXIT_NOTIFY          | 37 | Arch-independent |
| KVM_EXIT_LOONGARCH_IOCSR | 38 | LoongArch |
| KVM_EXIT_MEMORY_FAULT    | 39 | Arch-independent |
| KVM_EXIT_TDX             | 40 | x86 |
| KVM_EXIT_ARM_SEA         | 41 | ARM |
| KVM_EXIT_ARM_LDST64B     | 42 | ARM |
| KVM_EXIT_SNP_REQ_CERTS   | 43 | AMD SEV-SNP |

# Introducing kvm_run

`kvm_run` is a shared communication channel between the virtual machine monitor (VMM) and KVM for the `KVM_RUN` operation running on one particular virtual CPU.

The VMM uses it to convey KVM how to perform on the next `KVM_RUN` operation. Meanwhile, KVM uses it to notify the VMM about the reason guest execution stopped and provide exit-specific data when applicable.

---

It is defined in [*root/include/uapi/linux/kvm.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/uapi/linux/kvm.h?h=v7.2.6#n223).

The definition is humongous (294 lines) and the formatting makes it look frightening.

Personally, I work better when things are properly formatted. After formatting `kvm_run` to my liking, it feels less frightening, although its enormity remains unchanged (354 lines).

It is not meaningful to paste the struct here. I'd recommend opening it in side.

---

`kvm_run` looks frightening due to the high number of fields in it. However, there is one field that is having a lot of declarations, and if we cover it up, `kvm_run` will easily contract to a less frightening one.
```c
struct kvm_run {
	__u8 request_interrupt_window;
	__u8 HINT_UNSAFE_IN_KVM(immediate_exit);
	__u8 padding1[6];

	__u32 exit_reason;
	__u8  ready_for_interrupt_injection;
	__u8  if_flag;
	__u16 flags;

	__u64 cr8;
	__u64 apic_base;

#ifdef __KVM_S390
	__u64 psw_mask;
	__u64 psw_addr;
#endif

  /* An unnamed union. */
  /* The contracted field. */
  union { .... };

#define SYNC_REGS_SIZE_BYTES 2048

	__u64 kvm_valid_regs;
	__u64 kvm_dirty_regs;

	union {
		struct kvm_sync_regs regs;
		char padding[SYNC_REGS_SIZE_BYTES];
	} s;
};
```

We can divide `kvm_run` into two portions.
  1. The declarations outside the unnamed union.
  2. The declarations inside the unnamed union.

Soon we will experience that this classification is probably the right one to understand `kvm_run`.

---

# Declarations Outside The Unnamed Union.

| Field | Description |
| ----- | ----------- |
| `exit_reason` | Identifies why the guest execution stopped. The VMM compares this value with the VM exit macros to proceed with the handling. |
| `immediate_exit` |
| `flags` |
| `request_interrupt_window` |
| `ready_for_interrupt_injection` | Indicates whether KVM can inject a virtual interrupt at this moment.
| `if_flag` | |
| `cr8` |
| `apic_base` | Exposes the virtual local APIC base, or configuration state. |
| `kvm_valid_regs` | 
| `kvm_dirty_regs` | Indicates which register groups the userspace code (VMM) has modified that KVM must reload. |


# The Unnamed Union

A VM exit is handled by the VMM. Many of these events are complex in-a-way that the VMM requires certain exit-specific information to handle them appropriately.

The table at the start of the text mentions 44 VM exit events. But an exit correspond to only one reason at a time.

If `kvm_run` defined these exit specific payloads (structs) at the top-level, the struct will waste a lot of memory. That's why they are declared in a union.

An anonymous struct/union makes its members directly accessible through the struct/union containing them, as if they were present directly at that level. This removes an unnecessary level of indirection in accessing exit-specific payloads.

Some of these events are self-explanatory and don't require any extra information. Therefore, not all events have corresponding exit-specific structures in the unnamed union.

# KVM_EXIT_UNKNOWN

The vCPU has exited due to an unknown reason. Further arch-specific information is available in `hardware_exit_reason`.

```c
struct {
  __u64 hardware_exit_reason;
} hw;
```

A complete list of hardware exit reasons in Intel x86 can be found in *Intel SDM Volume 3, Appendix C: VMX BASIC EXIT REASONS*.

---

# KVM_EXIT_FAIL_ENTRY

The vCPU could not be run (or, a VM entry can not be made) due to an unknown reason. Further arch-specific information is available in `hardware_entry_failure_reason`.

```c
struct {
  __u64 hardware_entry_failure_reason;
  __u32 cpu;
} fail_entry;
```

- `cpu` is the identifier associated with the host logical CPU where the failed guest entry occurred.

---

# KVM_EXIT_EXCEPTION

[INSERT INFO]

```c
struct {
  __u32 exception;
  __u32 error_code;
} ex;
```

---

# KVM_EXIT_IO

The vCPU has executed a port-based I/O instruction which could not be satisfied by kvm.
```c
struct {

#define KVM_EXIT_IO_IN  0
#define KVM_EXIT_IO_OUT 1

  __u8  direction;
  __u8  size;         /* bytes */
  __u16 port;
  __u32 count;
  __u64 data_offset;  /* relative to kvm_run start */
} io;
```

- `direction` determines whether it is an input (KVM_EXIT_IO_IN) or an output (KVM_EXIT_IO_OUT) operation.
- `size`
- `port` is the I/O port number accessed by the guest.
- `count` is the number of transfers accessed by the guest.
- `data_offset`

---

# KVM_EXIT_DEBUG

The vCPU is processing a debug event for which arch-specific information is returned.
```c
struct {
	struct kvm_debug_exit_arch arch;
} debug;
```

`kvm_debug_exit_arch` is defined in [root/arch/x86/include/uapi/asm/kvm.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/arch/x86/include/uapi/asm/kvm.h?h=v7.2.6#n290)
```c
struct kvm_debug_exit_arch {
	__u32 exception;
	__u32 pad;
	__u64 pc;
	__u64 dr6;
	__u64 dr7;
};
```

- `exception` associated with the debug event.
- `pad` is padding for alignment as the following element is a 64-bit data.
- `pc` is the guest instruction pointer (program counter) at the time of the debug event.
- `dr6` is the guest's debug register 6.
- `dr7` is the guest's debug register 7.

---

# KVM_EXIT_MMIO

The vCPU has executed a memory-mapped I/O instruction which could not be satisfied by kvm.
```c
struct {
	__u64 phys_addr;
	__u8  data[8];
	__u32 len;
	__u8  is_write;
} mmio;
```

- `phys_addr` is the guest physical address that was accessed.
- `data[8]` is the data involved in the access, up t0 8 bytes.
- `len` is the number of bytes involved in the access.
- `is_write` is `1` if the guest wrote to the MMIO address, `0` if the guest read from it.

**Note**: KVM_EXIT_IO is significantly faster than KVM_EXIT_MMIO.
