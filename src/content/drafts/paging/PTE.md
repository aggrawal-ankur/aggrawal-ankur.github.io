# Entries In The PML4, PDPT and PD Page Tables

The PML4, PDPT and PD entries are different from PT entries.

A PML4E, PDPTE and PDE is likes this:
```bash
*----* *-------------* *---------------------------* * ------*
| NX | | OS Reserved | | phy_addr(NEXT_PAGE_TABLE) | | Flags |
*----* *-------------* *---------------------------* *-------*
63     62           52 51                         12 11      0
```
Only a few flag bits are different, the rest are the same as a PTE.

# Page Table Entry (PTE)

A page table entry (PTE) is the real gateway to a page.

***A page table entry encapsulates information which helps in translating a virtual page into its corresponding physical page frame.***

A page table entry for 4 KiB pages on x64 architecture looks like:
```bash
*----* *-------------* *-------------------* * ------*
| NX | | OS Reserved | | Page Frame Number | | Flags |
*----* *-------------* *-------------------* *-------*
63     62           52 51                 12 11      0
```

## Flag Bits

The flag bits are the 12 lower bits (0-11), which are as follows:
```bash
*-------------*---*-----*---*---*-----*-----*----*----*---*
| OS Reserved | G | PAT | D | A | PCD | PWT | US | RW | P |
*-------------*---*-----*---*---*-----*-----*----*----*---*
    11 - 9      8    7    6   5    4     3    2    1    0
```

Description of flag bits:

| Flag Bits | Name | Description |
| :-------- | :--- | :---------- |
| 0 | P   | Present bit: tells if the virtual page is mapped to a physical frame. (0: NO, 1: YES) |
| 1 | RW  | Writeable bit: tells if the page is writeable (1) or read-only (0). |
| 2 | US  | User mode: tells if the page is accessible from user-space. (0: NO, 1: YES) |
| 3 | PWT | Page write through: 0 = write-back caching (default), 1 = write-through caching. Controls how writes propagate to memory. |
| 4 | PCD | Page cache disable: 0 = caching enabled, 1 = caching disabled. Used for memory-mapped I/O or device regions. |
| 5 | A   | Accessed bit: set by CPU on any access (read/write/exec). OS uses it for page replacement decisions. Cleared by software when resetting aging info. |
| 6 | D   | Dirty bit: set by CPU when the page is written to. Relevant only for writable mappings. Used to decide if a page must be written back to disk. |
| 7 | PAT | Page attribute table index: selects one of the memory types from PAT (used with PCD/PWT). Defines caching behavior. |
| 8 | G   | Global bit: If set, translation stays in TLB across CR3 reloads. Used for kernel-space pages that remain constant across processes. |
| 9-11 |  | OS Reserved |

## Page Frame Number (PFN)

***The page frame number (PFN) identifies the physical page in the RAM that backs a virtual page.***

In x64 PTEs, bits 51-12 hold the PFN. Each PFN points to a 4-KiB-aligned physical frame.
