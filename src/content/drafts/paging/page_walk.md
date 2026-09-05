# Page Walk

***A page walk is the CPU's hardware-driven process of traversing the multi-level page tables to translate a virtual address into a physical address when the TLB lacks a cached mapping.***

The MMU (Memory Management Unit) inside the CPU does performs the page walk. It's 100% hardware-driven and happens without any OS intervention, unless a fault occurs.

---

A page walk is triggered any time the CPU needs to translate a virtual address to a physical address, and it doesn't already have the translation cached in the TLB. For example:
  - When the CPU fetches the next instruction, it has a virtual address (from RIP on x64) that needs translation.
  - Any access to memory using a virtual address also needs translation.

The CPU sees a virtual address and checks the translation lookaside buffer for a cached mapping.
  - If a mapping is found, it is a **TLB hit**, which means *no page walk is required*.
  - If a mapping is not found, it is a **TLB miss**, which means *a page walk is required*.

The CPU reads the CR3 register, which points to the PML4 table, which sits at the top of the 4-level paging hierarchy.

Each table is itself a physical page, so every memory access during the walk is also translated.

# Example

Let's take a random virtual address: 0x000055F7C34D1000

It's binary representation would be
```
0000000000000000010101011111011111000011010011010001000000000000
```

If we make groups of bits just like how the virtual address is conceptually structured, we get
```
0000000000000000 010101011 111011111 000011010 011010001 000000000000
sign_extension     PML4i     PDPTi      PDi       PTi         PO
                    171       479       26        209
```

The CR3 register holds the root of the 4-level paging hierarchy, the PML4 table.

To find which page directory pointer table entry we are looking for in the PML4 table, we use the PML4i value. Therefore, CR3[171] is the one we are looking for.

The 51-12 bits in the entry pointed by CR3[171] will tell where this PDPT is in the physical memory.

---

We're inside a page directory pointer table, which has 512 page directories. The page directory we're looking for is given by PDPTi, that is, CR3[171][479].

The 51-12 bits in the entry pointed by CR3[171][479] will tell where this PD is in the physical memory.

---

We're inside a page directory, which has 512 page tables. The page table we are looking for is given by PDi, that is, CR3[171][479][26].

The 51-12 bits in the entry pointed by CRI[171][479][26] will tell where this page table is in the physical memory.

---

We're inside a page table, which has 512 pages. The page we are looking for is given by PTi, that is CR3[171][479][26][209].

The 51-12 bits in the entry pointer by CR3[171][479][26][209] is the page frame number, which tells where this page is in the physical memory.

We're in the page that has our value. To pinpoint it, we use the page offset value in the virtual address.

---

The final physical address corresponding to 0x000055F7C34D1000 is given by CR3[171][479][26][209][0].
