---
title: "Memory related Data Structures and Type Definitions in KVM v7.2.6"
publishDate: "2026-09-19"
# updatedDate: "2026-M-D"
description: "This text aims to explain the various memory-related data structures and type-definitions present in KVM v7.2.6."
tags: [ linux-kvm ]
draft: true
---

# kvm_userspace_memory_region

What it is?

Used with KVM_SET_USER_MEMORY_REGION.

```c
struct kvm_userspace_memory_region {
	__u32 slot;
	__u32 flags;
	__u64 guest_phys_addr;
	__u64 memory_size;
	__u64 userspace_addr;
};
```

- `slot` is the identifier for this memory region.
- `flags` has the attributes controlling this region.
- `guest_phys_addr` is the starting guest physical address where this region appears inside the VM.
- `memory_size` is the size of this region in bytes.
- `userspace_addr`

---

# kvm_userspace_memory_region2

What it is?

Used with KVM_SET_USER_MEMORY_REGION2.

```c
struct kvm_userspace_memory_region2 {
	__u32 slot;
	__u32 flags;
	__u64 guest_phys_addr;
	__u64 memory_size;
	__u64 userspace_addr;
	__u64 guest_memfd_offset;
	__u32 guest_memfd;
	__u32 pad1;
	__u64 pad2[14];
};
```

- `slot` is the identifier for this memory region.
- `flags` has the attributes controlling this region.
- `guest_phys_addr` is the starting guest physical address where this region appears inside the VM.
- `memory_size` is the size of this region in bytes.
- `userspace_addr`
- `guest_memfd_offset`
- `guest_memfd` is the file descriptor identifying the guest memory file.
- `pad1`
- `pad2[14]`
