# How execve loads a dynamic executable?

A dynamic executable (PIE or non-PIE) contains a `PT_INTERP` segment, which gives the path to the dynamic linker (interpreter), which is `/lib64/ld-linux-x86-64.so.2`.

The kernel issues an internal execve call to load the interpreter.

We are already inside an execve call, which means we are already operating in the kernel mode. The nature of execve is that it wipes everything in the address space of the process it is ran on.

This new execve destroys the previous one and establishes itself.

We pass the path of the dynamic linker along with argv[] and envp[] from the original execve call.

---

The kernel uses its internal routine for the mmap syscall (vm_mmap) to map `ld-linux.so` in the address space of the forked process.

Each `PT_LOAD` segment in the `ld-linux.so` shared library is loaded in the memory mapped region. The .text section is reserved for the main executable.

Now the kernel processes the `PT_DYNAMIC` segment of `ld-linux.so`. It performs symbol resolution and relocation.

This ends the role of kernel and execve. The kernel
  1. destroys the old stack which the forked process received from the parent process and sets up the new user space stack for the process.
  2. pushes argc, argv[], envp[] and auxv[] on the stack.
  3. sets the instruction pointer to the entry point of the dynamic linker
  4. switches cpu to user mode.

---

The dynamic linker uses argv[0] (which represents the path of the executable object) to open the executable object and map its `PT_LOAD` segments using the mmap syscall.

After processing the PT_LOAD segments, the dynamic linker processes the PT_DYNAMIC segment of the executable object.

All the entries of type `DT_NEEDED` represent a shared library dependency. The value is an offset in the string table (.dynstr) resolving to their path name. The interpreter extracts their path, searches them in its **library search paths** and loads them in the memory mapped (mmap) region of the address space.

Next the interpreter processes the relocation tables.
  - It uses the DT_RELA, DT_RELASZ, DT_RELAENT, DT_RELACOUNT, DT_STRTAB, DT_SYMTAB and DT_SYMENT entries to process relocations requiring eager binding (.rela.dyn).
  - It uses the DT_PLTGOT, DT_PLTRELSZ, DT_PLTREL and DT_JMPREL entries to setup the procedure linkage table to perform lazy binding later.
  - `DT_VERNEED` and DT_VERNEEDNUM describe version requirements for symbols imported from shared libraries.
  - `DT_VERSYM` maps each symbol in the symbol table to its version index so the dynamic linker can match definitions and references precisely during relocation.

Now the interpreter runs the functions that initializes the environment before the main() from the executable runs. If `DT_PREINIT_ARRAY` exists, it is ran first. Then comes `DT_INIT` and `DT_INIT_ARRAY`.

Here comes the end of the .dynamic section.

Now the interpreter uses the `e_entry` field from the file header to find the entrypoint of the executable object and transfers the control to it. It is the `_start` symbol.

`_start` retrieves argc, argv, envp from the stack, aligns the stack, and calls `__libc_start_main(main, argc, argv, init, fini, rtld_fini, stack_end)`.

`__libc_start_main` initializes the C runtime and finally invokes the main().

`puts` and `sleep` are present in .rela.plt, so they aren't resolved eagerly. When a call to them is made, that's when they are relocated using the procedures linkage table.
