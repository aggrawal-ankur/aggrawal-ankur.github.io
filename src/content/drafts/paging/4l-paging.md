# 4-Level Paging

The 4-level paging architecture utilizes 4 pointer tables, each reducing the sample space by (1/512), helping in finding the right 4-KiB page in just 4 iterations.

The 4 page tables are:
  1. Page Table (PT).
  2. Page Directory (PD).
  3. Page Directory Pointer Table (PDPT).
  4. Page Map Level 4 Table (PML4).

Each table has exactly 512 entries because the page size (4-KiB) divided by the number of addressable bytes (4096/8) is 512.

Each entry is a pointer, so every entry is 8 bytes in size.

Remember,
  - *A page is a collection of individual bytes.*
  - *A 4-KiB page is a collection of 4096 addressable bytes in the virtual memory.*

## Page Table (PT)

Definitions:
  - A page table is a collection of 512 4-KiB pages.
  - A page table is a gateway to 512 4-KiB pages.

A page table has 512 pointers, each to a 4-KiB page.

Every entry in a page table represents a page of size 4 KiB (or 4096 bytes). Therefore, a page table manage a total of (512 * 4096) 2,097,152 bytes, which is 2 MiB.

## Page Directory (PD)

Definitions:
  - A page directory is a collection of 512 page tables.
  - A page directory is a gateway to 512 page tables.

A page directory has 512 pointers, each to a page table.

A page table manage 512 pages. Therefore, a page directory would manage (512 * 512) 262,144 pages.

A single entry in the page directory table manage 2 MiB. Therefore, a page directory would manage a total of (512 * 2,097,152) 1,073,741,824 bytes, which is 1 GiB.

## Page Directory Pointer Table (PDPT)

Definitions:
  - A page directory pointer table is a collection of 512 page directories.
  - A page directory pointer table is a gateway to 512 page directories.

A page directory pointer table has 512 pointers, each to a page directory.

A page directory manage 262,144 pages. Therefore, a page directory pointer table would manage (512 * 262,144) 134,217,728 pages.

A PDPT entry manage 1 GiB. Therefore, a page directory pointer table would manage a total of (512 * 1,073,741,824) 549,755,813,888 bytes, which is 512 GiB.

## Page Map Level 4 (PML4) Table

Definitions:
  - A PML4 table is a collection of 512 PDPTs.
  - A PML4 table is a gateway to 512 PDPTs.

A PML4 table has 512 pointers, each to a PDPT.

A PDPT manage 134,217,728 pages. Therefore, a PML4 table would manage (512 * 134,217,728) 68,719,476,736 pages.

A PML4 entry manage 512 GiB. Therefore, a PML4 table would manage a total of (512 * 549,755,813,888) 281,474,976,710,656 bytes, which is 256 TiB.

## Calculation

| Quantity | In Bytes   |
| :------- | :--------- |
| 1 KiB    | 1024 bytes |
| 1 MiB    | 1024 KiB = 1024 * 1024 bytes = 1,048,576 bytes |
| 2 MiB    | 2 * 1,048,576 bytes = 2,097,152 bytes |
| 1 GiB    | 1024 MiB = 1024 * 1024 KiB = (1024 * 1024 * 1024) bytes = 1,073,741,824 bytes |
| 512 GiB  | 5 * 1,073,741,824 bytes = 549,755,813,888 bytes |
| 1 TiB    | 1024 GiB = 1024 * 1024 MiB = 1024 * 1024 * 1024 KiB = 1024 * 1024 * 1024 * 1024 bytes = 1,099,511,627,776 bytes |
| 256 TiB  | 256 * 1,099,511,627,776 bytes = 281,474,976,710,656 bytes |

# Insights

| Tables | Total Entries | Size (each entry) | Each entry is gateway to | Total bytes managed | Pages per entry | Total Pages |
| :----- | :------------ | :---------------- | :----------------------- | :-------------------| :-------------- | :---------- |
| PT     | 512 | 8 bytes | 4096 bytes            | 2,097,152           | 1 (2 MiB)   | 512 (2^9) |
| PD     | 512 | 8 bytes | 2,097,152 bytes       | 1,073,741,824       | 512 (1 GiB) | 262,144 (2^18) |
| PDPT   | 512 | 8 bytes | 1,073,741,824 bytes   | 549,755,813,888     | 262,144 (512 GiB) | 134,217,728 (2^27) |
| PML4   | 512 | 8 bytes | 549,755,813,888 bytes | 281,474,976,710,656 | 134,217,728 (256 TiB) | 68,719,476,736 (2^36) |

In theory, the maximum fan-out possible is:
  1. 1 PML4 table,
  2. 512 PDPTs,
  3. 512^2 PDs,
  4. 512^3 PTs, and
  5. 512^4 pages.

But in practice, no process occupies this much memory so only a subset of this hierarchy is actually populated.
