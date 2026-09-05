# The Problem

There are functions which are required before the main program runs and there are functions which are required when the main function runs.

There is no way an internal routine using `printf` because it is a frontend API used to put stuff on the output stream. Is it fruitful to load `printf` before we even need it?

printf is just one example. There can be many such functions which are strictly required by the main executable, not the code that runs before main to initialize the environment. This can easily become an overhead when 100s of functions are involved.

Many functions are called based on a certain condition being true. For example: run sleep when only when the input is greater than 100. If the input < 100, we will never use sleep, so front-loading it was a waste of memory.

The more functions we have to front-load, the slower we reach to the main program.

***Therefore, if we can decide when to resolve a symbol based on when it is required, we can pace up the initialization part while ensuring symbol reliability.***

# The Solution

Binding is the process that determines when and how external references in shared libraries are resolved.

There are 3 types of binding we need to study for now.
  - Eager binding (non PLT relocations)
  - Lazy binding (PLT-based relocations)
  - Static binding (no relocations at all)

In static binding, everything is resolved at link-time (not load-time), and the final binary is ready to be loaded and executed in the memory. But that comes at a cost of higher size of the binary as everything is embedded in the binary at link-time.

When an executable is linked dynamically, there are primarily two options: eager binding and lazy binding.

Eager binding resolves a symbol while processing the PT_DYNAMIC entries, before any instruction from the main executable runs.
  - It ensures that the minimum environment required to run anything is set up.
  - This includes all the non-PLT relocations.

Lazy binding defers symbol resolution until the symbol is not called.
  - It improves the start up time significantly in programs with large symbol requirements.
  - It uses PLT trampoline to resolve references when the symbol is called for the first time.
