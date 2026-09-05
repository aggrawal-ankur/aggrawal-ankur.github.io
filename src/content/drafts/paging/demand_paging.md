# Demand Paging

***Demand paging loads a page into memory only when it is accessed. The idea is only actively used pages should occupy physical memory.***

The remaining pages stay on disk until a virtual address accesses them and a #PF occurs, which triggers demand paging.

It reduces memory usage and startup time by avoiding loading pages which have no immediate use.
