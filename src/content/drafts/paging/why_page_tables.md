# Why page tables?

Modern systems comes with 64-bit addressable length.

Just like a flat table is a nightmare to manage every single byte, that's true for page tables as well.

A flat pointer table of 4 KiB pages for 8 GiB RAM would manage 2,097,152 entries.

A page table is a data structure that manage pages.

With multiple page tables sitting in an hierarchy, we are able to cut the sample space of possibilities. The approach is similar to binary search.

This hierarchical approach is known as ***4-level paging***.

Every process has its own page tables.

---

Take a sorted array of 1000 elements. The element we want is sitting at 762 index.
  - With linear search, it will take 763 rounds.
  - With binary search, it will only take 9 rounds, 1.18% of linear search.

Binary search reduces the search space by half (1/2) with each iteration.

4-level paging reduces the search space by (1/512) with each iteration.

More precisely, both binary search and 4-level paging reduce the sample space of possibilities **logarithmically**.

---

4-level paging uses a hierarchy of 4 page table, named:

  1. Page Table (PT).
  2. Page Directory (PD).
  3. Page Directory Pointer Table (PDPT).
  4. Page Map Level 4 Table (PML4).
