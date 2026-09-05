# Why string tables?

In the section header string table, there is an entry named `.shstrtab`. It acts as a central registry to store the names of the section headers.

Similar string tables exist for symbols as well, i.e `.strtab` and `.dynstr`.

We don't include names directly in the struct because their length is not fixed.

Keeping the variable large enough that it can contain the longest value leads to memory wastage as that amount of memory has to be allocated to every entry but not every entry is that long.

Take this:
  - The longest entry is 15 characters and we have 12 entries in our table, that would require 180 bytes.
  - But if an average entry is 10 characters long, 5 bytes of memory is wasted per entry, that would be 60 bytes.
  - Symbol tables have thousands of entries for even small programs. That would lead to huge memory wastage.

---

To minimize wastage, we create a flat character array to store these strings.
  - Each entry remains null-terminated.
  - We can access any string based on offsets.
  - Modifying a string becomes easier as we change the master record directly and it reflects everywhere.
  - We can remove these **central tables** when not required. Production-grade binaries does this to reduce their size.

Therefore, the `Section header string table index: 12` entry in the ELF header specifies the index of the "section header string table" entry in the section headers table.