---
title: "Address related Data Structures and Type Definitions in KVM v7.2.6"
publishDate: "2026-09-19"
# updatedDate: "2026-M-D"
description: "This text aims to explain the various address-related data structures and type-definitions present in KVM v7.2.6."
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
- [Guest Address Translation](#guest-address-translation)
  - [`gfn_to_hva_cache`](#gfn_to_hva_cache)
  - [`gfn_to_pfn_cache`](#gfn_to_pfn_cache)


# Address Types

There are 4 types of addresses possible in KVM.
  - Guest virtual address
  - Guest physical address
  - Host virtual address
  - Host physical address

Corresponding to the physical addresses, we have page frame numbers (PFNs).
  - Guest frame number
  - Host frame number

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

---

On x86-64, a page table entry (PTE) is a 64-bit value. Bits [51:12] represents the page frame number (PFN). So a PFN is a 40-bit value. Since there is no primitive type between 32-bit and 64-bit, we are using an unsigned 64-bit container for a pfn.

On x86, a PTE is a 32-bit value, where bits [31:12] represent the PFN, i.e. 20 bits. However, with PAE (physical address extension), a PTE on x86 will be a 64-bit value.

---

1. Why the width of a virtual address is architecture dependent, while physical addresses and page frame numbers have a fixed width?

2. The guest machine is not necessarily a 64-bit machine, then why we are using 64-bit containers for guest info (excluding gva_t)? Is KVM primarily designed around a 64-bit host machine?

---

There is a macro and a type definition that I don't understand yet.
```c
#define INVALID_GPA	(~(gpa_t)(0))

typedef hfn_t kvm_pfn_t;
```

---

# Guest Address Translation

## `gfn_to_hva_cache`

Guest Frame Number to Host Virtual Address Cache.

```c
struct gfn_to_hva_cache {
	u64 generation;
	gpa_t gpa;
	unsigned long hva;
	unsigned long len;
	struct kvm_memory_slot *memslot;
};
```

- `generation` [?]
- `gpa` is the guest physical address associated with this is cache.
- `hva` is the host virtual address corresponding to the `gpa`.
- `len` is the length of the cached memory range, in bytes.
- `*memslot` is a pointer to the memory slot that contains this guest physical address.

---

## `gfn_to_pfn_cache`

Guest PFN to Host PFN Cache.

```c
struct gfn_to_pfn_cache {
	u64 generation;

	gpa_t gpa;
	unsigned long uhva;

  struct kvm_memory_slot *memslot;
	struct kvm *kvm;
	struct list_head list;

	rwlock_t lock;
	struct mutex refresh_lock;

	void *khva;
	kvm_pfn_t pfn;

	bool active;
	bool valid;
};
```

- `generation` [?]
- `gpa` is the guest physical address associated with this cache.
- `uhva` [?]
- `*memslot` is a pointer to the memory slot that contains this guest physical address.
- `*kvm` is the KVM virtual machine this cache belongs to.
- `list` [?]
- `lock` [?]
- `refresh_lock` [?]
- `khva` [?]
- `pfn` is the host PFN backing the `gpa`.
- `active` [?]
- `valid` indicates the validity of cached mapping.
