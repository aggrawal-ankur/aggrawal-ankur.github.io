---
title: "Data Structures and Type Definitions in KVM v7.2.6"
publishDate: "2026-09-19"
# updatedDate: "2026-M-D"
description: "This text aims to explain the various data structures present in KVM v7.2.6."
tags: [ linux-kvm ]
draft: true
---

# Notes For The Reader  <!-- omit from toc -->

1. This text is strictly based on the KVM v7.2.6 source. To access the source tree, use the [git.kernel.org](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/?h=v7.2.6) interface.

2. KVM has a lot of data structures declared across multiple files. Therefore, this writing is a ***progressive work***, instead of a complete list. The definition you might be searching may not be available at that moment. I'd recommend checking the table of contents beforehand.

3. The discussions are strictly about the x86 (both 32-bit and 64-bit) architecture. The text doesn't mention details about other architectures unless necessary.

4. The formatting of some definitions may appear differently from the original source. I do this to improve **readability**. The contents remain unchanged.

5. Some definitions are complex and may include fields that aren't important given the exploration I am in. So it is possible that certain fields lack a description at the moment.

6. In case a description is incorrect or you have a suggestion, please feel free to connect.

***I hope you find it useful.***

---

# Table of Contents  <!-- omit from toc -->

- [Address Types](#address-types)


# Address Types

There are 4 types of addresses possible in KVM.
  1. Guest virtual address
  2. Guest physical address
  3. Host virtual address
  4. Host physical address

Corresponding to the physical addresses, we have page frame numbers (PFNs).
  1. Guest frame number
  2. Host frame number

---

The type definitions corresponding to them are available in [`root/include/linux/kvm_types.h`](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/kvm_types.h?h=v7.2.6#n53)
```c
/* Guest */
typedef unsigned long  gva_t;
typedef u64            gpa_t;
typedef u64            gfn_t;

/* Host */
typedef unsigned long  hva_t;
typedef u64            hpa_t;
typedef u64            hfn_t;
```

There is no 32-bit and 64-bit distinction. The guest details are in 64-bit by default. Why?


A page table entry (PTE) is a 64-bit value that contains a page frame number (PFN) in bits (51:12). That is 40 bits. We are using an unsigned 64-bit container as there is no primitive type between 32-bit and 64-bit.

Why the virtual address is a signed 64-bit quantity and the physical address is an unsigned 64-bit quantity?

---

There are two more definitions that I don't understand yet.
```c
#define INVALID_GPA	(~(gpa_t)(0))
typedef hfn_t kvm_pfn_t;
```
