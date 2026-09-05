# Why Paging?

Memory is **byte-addressable**. In 2025, most laptops comes with 8 GiB RAM at least. How many bytes does 8 GiB have?

  - 1 GiB = 1024 MiB
  - 1 MiB = 1024 KiB
  - 1 KiB = 1024 bytes
  - Therefore, 1 GiB = 1024 * 1024 * 1024 bytes = 1,073,741,824 bytes.
  - So, 8 GiB = 8 * 1073741824 = 8589934592 bytes or ~8.6 billion bytes.

Tracking every single byte in a flat table would make ~8.6 billion entries.
  - A 16 GiB RAM would have to manage ~17.2 billion bytes.
  - A 32 GiB RAM would have to manage ~34.4 billion bytes.

---

***Instead of managing these bytes flat, we manage them in groups. These group of bytes are called pages.***

Mainstream computing on x86 and x64 processors defaults to a page size of 4 KiB. But huge page sizes do exist. For example, macOS on Intel-based Macs uses 4 KiB pages, adhering to the standard for the x86-64 architecture and 16 KiB pages on Apple Silicon (ARM64), which is optimized for the performance characteristics of Apple's M-series chips.

4 KiB = 4 * 1024 bytes or 4096 bytes.
  - Therefore, *a page is a gateway to 4096 unique byte-addressable locations.*
