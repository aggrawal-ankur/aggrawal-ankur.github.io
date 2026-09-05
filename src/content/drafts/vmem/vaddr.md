# Virtual Address

***A virtual address is a combination of information that helps in finding the corresponding physical address.***

In x64 systems, we have 64-bit wide registers. It would be huge to manage 2^64 addresses. So we stick to 48-bit virtual addresses. The remaining 16-bits are sign extension of the 47th bit.

That means, there are 2^48 unique virtual addresses, which gives us a huge VAS, sized about ~256 TiB. The lower half represents the user space and the upper half represents the kernel space.
```
User space   -> (Lower half, ~128 TiB) -> 0x0000_0000_0000_0000 -> 0x0000_7FFF_FFFF_FFFF
Kernel space -> (Upper half, ~128 TiB) -> 0xFFFF_8000_0000_0000 -> 0xFFFF_FFFF_FFFF_FFFF
```
The middle region, represented by *0x0000_7FFF_FFFF_FFFF to 0xFFFF_8000_0000_0000* is the **unused guard space**.

---

A virtual address on x64 for 4-level paging looks like:
```
+--------------------+ +--------------+ +--------------+ +------------+ +------------+ +----------------------+
| sign_ext(47th_bit) | | PML4: 9-bits | | PDPT: 9-bits | | PD: 9-bits | | PT: 9-bits | | Page Offset: 12-bits |
+--------------------+ +--------------+ +--------------+ +------------+ +------------+ +----------------------+
63                  48 47            39 38            30 29          21 20          12 11                     0
```

Every page table has 512 entries, requiring 9-bits to represent them. So, (9*4) 36-bits are reserved for them.

Each 9-bit group is an index in the corresponding page table.

Page offset is the actual byte being addressed within a page. Because a page has 4096 bytes, 12-bit are required to represent it.

Each lookup narrows the address space by 9 bits until the final page is found.

---

**Note: Total Addressable space ≠ Total Usable space.**
  - The program never runs out of virtual memory.
  - It only runs out of mappings in the physical memory.
