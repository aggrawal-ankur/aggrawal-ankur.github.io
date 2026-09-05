# Types Of Paging

| Serial | Type | Description |
| :----- | :--- | :---------- |
| 1 | Demand paging | Pages are loaded only when accessed; causes page faults on first access. |
| 2 | Pre-paging (anticipatory paging) | Anticipates future accesses; pre-loads pages to reduce faults. |
| 3 | Copy-on-write (COW) paging | Shared physical page until one process writes, then copied. |
| 4 | Swapping/Page replacement paging | Pages moved between memory and disk under pressure.   |
| 5 | Clustered (group) paging   | Loads or evicts pages in contiguous clusters to reduce overhead. |
| 6 | Zero-fill-on-demand paging | Allocates new pages initialized with zeros when first accessed.  |
| 7 | Mapped file paging | Pages backed by files instead of anonymous memory. |
