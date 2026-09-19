---
title: "VM Exit reasons in x86 in KVM v7.2.6"
publishDate: "2026-09-19"
# updatedDate: "2026-M-D"
description: "This text aims to explore the reasons a VM exit can happen in x86 in KVM v7.2.6."
tags: [ linux-kvm ]
draft: true
---

These macros are present in [root/include/uapi/linux/kvm.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/uapi/linux/kvm.h?h=v7.2.6#n151).

| # | Macro | Constant Value | Description | Availability |
| - | ----- | -------------- | ----------- | ------------ |
| 1 | KVM_EXIT_UNKNOWN   | 0 |
| 2 | KVM_EXIT_EXCEPTION | 1 |
| 3 | KVM_EXIT_IO | 2 | Guest executed port-based I/O. | Arch-independent |
| 4 | KVM_EXIT_HYPERCALL | 3 | Guest executed a hypercall. | Arch-independent |
| 5 | KVM_EXIT_DEBUG | 4 | Guest encountered a debug event. | Arch-independent |
| 6 | KVM_EXIT_HLT   | 5 | Guest executed the HLT instruction. | Arch-independent |
| 7 | KVM_EXIT_MMIO  | 6 | Guest accessed memory-mapped I/O. | Arch-independent |
| 8 | KVM_EXIT_IRQ_WINDOW_OPEN | 7 |
| 9 | KVM_EXIT_SHUTDOWN   |  8 | Guest encountered a shutdown condition. | Arch-independent |
| 10 | KVM_EXIT_FAIL_ENTRY |  9 | KVM failed to enter guest execution. | Arch-independent |
| 11 | KVM_EXIT_INTR       | 10 | 
| 12 | KVM_EXIT_SET_TPR    | 11 | 
| 13 | KVM_EXIT_TPR_ACCESS | 12 | 
| 14 | KVM_EXIT_NMI | 16 | A non-maskable interrupt caused the exit. | Arch-independent |
| 15 | KVM_EXIT_INTERNAL_ERROR | 17 | KVM encountered an internal error. | Arch-independent |
| 16 | KVM_EXIT_WATCHDOG  | 21 |
| 17 | KVM_EXIT_SYSTEM_EVENT | 24
| 18 | KVM_EXIT_IOAPIC_EOI   | 26 |
| 19 | KVM_EXIT_HYPERV       | 27 |
| 20 | KVM_EXIT_X86_RDMSR    | 29 | Guest attempted to read an MSR that KVM is forwarding to userspace. | x86 |
| 21 | KVM_EXIT_X86_WRMSR    | 30 | Guest attempted to write an MSR that KVM is forwarding to userspace. | x86 |
| 22 | KVM_EXIT_DIRTY_RING_FULL | 31 | KVM's dirty-page ring is full. | Arch-independent |
| 23 | KVM_EXIT_AP_RESET_HOLD   | 32 |
| 24 | KVM_EXIT_X86_BUS_LOCK    | 33 | Guest caused a bus-lock condition, and the configured policy requires userspace notification. | x86 |
| 25 | KVM_EXIT_NOTIFY    | 37 |
| 26 | KVM_EXIT_MEMORY_FAULT | 39 |
| 27 | KVM_EXIT_TDX | 40 |