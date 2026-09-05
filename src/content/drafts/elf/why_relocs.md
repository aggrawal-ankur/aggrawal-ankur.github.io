# Relocation

Functions like `printf()` and `scanf()` don't belong to us, but we use them in our source code. We use header files like stdio.h and stdlib.h to access them.
  - But header files are just frontends which make the writing process easier.
  - When we talk about the whole infrastructure that runs C code, we can easily count hundreds of procedures and sub-routines doing the actual work.
  - In the end, there has to be an executable binary for these functions. This is where shared objects come into picture.
  - As named, they are build in a way to be linked with other code to provide common functionality. We link our source code with these shared objects to use those functions at runtime.

But linking with shared objects is not enough. We need to know the runtime address of printf and scanf to use them while our programming is running.
  - First we locate the symbol in the loaded shared libraries and calculate its address. This is called symbol resolution.
  - Second we patch the placeholder offset with this runtime address. This is called relocation.

***Therefore, relocation is the process that connects symbolic references with their executable definitions.***
