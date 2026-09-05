# Why Virtual Memory

Each process believes it owns all the available memory.

**Simplified memory management and predictability** as every process can assume they start from `0x0` or something else.
  - The Memory Management Unit (MMU) and OS handle address translation from virtual to physical, freeing programmers from manual memory placement and relocation.

**Memory protection and isolation** is enforced via page permissions, eliminating the chance of one process invading other process.