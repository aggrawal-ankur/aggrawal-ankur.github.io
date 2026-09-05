# Build-Execution Pipeline

Programming languages are written in English, but CPU understands machine code. *The process that transforms human readable instructions into CPU understandable instructions is called **the build pipeline***.

*The process that ensures efficient execution and sharing of machine understandable instructions is called **the execution pipeline***.

*The **build-execution pipeline** ensures that the source is built, executed and shared in the most efficient manner.*

Every language has a different build-execution pipeline and studying that is definitely complicated, but rewarding for low level understanding.

This exploration will establish a baseline understanding of everything that happens in the **C build-execution pipeline**. This will give us some high-level checkpoints to anchor our future explorations.

This exploration, by choice, touches every single concept in the build-execution pipeline of C, which makes it a little tough to digest. But remember, you're not supposed to understand everything. You are only expected to settle these words in your mind, so they don't feel foreign later.

However, this journey does expects you to have basic familiarity with Linux command line and C.

Let's start our exploration.

# Introduction

The build-execution model in C is divided into **4 phases**, where each phase builds on top of the previous one and requires a different tool to work with.
  1. **Preprocessing** is carried out by a **preprocessor**.
  2. **Compilation** is carried out by a **compiler**.
  3. **Assembling** is carried out by an **assembler**.
  4. **Linking** is carried out by a **linker**.

*When multiple tools work together in a particular sequence to achieve the desired output, they form a **toolchain***.

Different toolchains exist for different purposes. For example: GCC stands for "GNU Compiler Collection", which is the GNU toolchain for "compiler and build utilities".
  - It includes `cpp` (preprocessor), `cc1` (compiler), `as` (assembler) and `ld` (linker) for each of the 4 phases of the build-execution process, but it is not limited to them.
  - Practically, GCC is an orchestrator that manages the build process and provides some extra features, which we will discuss later.

The location of these tools can vary based on the Linux distribution and the version of GCC in use. I am using gcc v14.2.0 on Debian v13.1
```bash
/usr/bin/x86_64-linux-gnu-cpp                  # Preprocessor
/usr/libexec/gcc/x86_64-linux-gnu/14/cc1       # Compiler
/usr/bin/x86_64-linux-gnu-as                   # Assembler
/usr/bin/x86_64-linux-gnu-ld                   # Linker
```

To locate these on your Linux distribution, you can use the `find` utility or just Google it.

---

"Hello world" is perfect for our scope.
```c
#include <stdio.h>
​
int main(){
  printf("Hello, World!\n");
  return 0;
}
```

To build this source, we can do
```bash
gcc hello.c -o hello
```
... and an executable file named `hello` is generated.

Let's build the source step-by-step and understand each phase.

## Preprocessing

Every C program starts with some `#` prefixed words. These are known as *preprocessing directives*.

The preprocessor (cpp) processes these directives and transforms the code into a form ready for compilation. Each directive is processed differently.

The result of this process is an expanded source file with a `.i` extension. This file is called **a translation unit**.

`gcc` with `-E` does preprocessing only. Since it doesn't create a file, we have to pair it with `-o OUT_FILE.i`.
```bash
gcc -E hello.c -o hello_cpp.i
```

We can invoke the preprocessor (cpp) independently as well. And it works the same way.
```bash
/usr/bin/x86_64-linux-gnu-cpp hello.c
```

If we save the output of both the commands in a file using **output redirection**,
```bash
$ /usr/bin/x86_64-linux-gnu-cpp hello.c > hello_cpp.i
$ gcc -E hello.c > hello_gcc.i
```

... and run diff on both the files
```bash
$ diff hello_cpp.i hello_gcc.i
```
... two **expanded files** are generated but there is no output for diff, indicating the files are identical.

## Compilation

*The compiler (cc1) processes the **preprocessed C source** and generates the assembly code for the targeted architecture.*

Compilation undergoes multiple steps including:

- **Lexical analysis (or Tokenization)**, where the compiler reads the preprocessed source as a stream of characters and breaks it into tokens (identifiers, keywords, literals, punctuations, operators and operands). It strips the white spaces and comments are already removed in preprocessing.
- **Syntax analysis (or parsing)**, where these tokens are parsed according to the C grammar. The compiler generates a structured representation of the program, called **abstract syntax tree (AST)**. Syntax errors like *"a missing ;"* are caught here.
- **Semantic analysis**, where the compiler verifies the AST's compliance with language standards, which includes type checking, use after declaration, scope and linkage rules, function signatures and returns, etc.
- An **intermediate representation (IR)** is generated from the AST, which is easier to optimize.
- The IR undergoes various **optimizations**, which can be controlled with the `-O` flag (-O0, -O1, -O2, -O3) etc.
- The assembly code for the targeted architecture is generated. Instructions, calling mechanisms, register usage, etc are managed here. This creates a `.s` file.
- The assembly code may undergo some architecture-specific optimizations as well.

Modern IDEs come with languages server protocols (or LSPs), which parse the opened source code and runs lexical, syntax and semantic analysis in real-time. That's how any modern IDE flags the missing semi-colon or any language standard violation.

We can invoke the compiler on the expanded files generated previously.
```bash
$ /usr/libexec/gcc/x86_64-linux-gnu/14/cc1 hello_cpp.i
$ /usr/libexec/gcc/x86_64-linux-gnu/14/cc1 hello_gcc.i
```

Two new files named `hello_cpp.s` and `hello_gcc.s` are generated. They too are identical except the value for the `.file` directive.
  - Some output is generated on the terminal side as well, which is build time stats, which can be different.

`gcc` with `-S` can be used to:
  - preprocess and compile a `.c` file, or
  - compile a `.i` file.

If we compare the assembly files generated by `gcc` and `cc1`, only the `.file` directive is different again, which proves they are identical.

---

It is possible that you have heard the words "assembler" and "linker". Maybe you know the names `as` and `ld` as well. But it is highly unlikely that you know the C preprocessor and compiler by their names (cpp and cc1). That's because, `as` and `ld` are so versatile and feature-rich solutions that they form use cases beyond the standard toolchain.

Developers often customize their own toolchains based on preferences and project needs. The standard GNU toolchain for "compiler and build utilities" might not fulfill their needs, but the versatility of the assembler or linker may become their choice.

On the other hand, `cpp` and `cc1` are primarily designed for internal use. They might be tightly coupled with the GNU toolchain. But they are still available to be used independently and they work great.

## Assemble

The assembler (as) translates the assembly instructions into machine instructions.

Just like compilation, assembling also undergoes multiple steps, including:

- **Lexical analysis and parsing** of the assembly source, where each line is broken into labels, mnemonics, operands, and directives and they are validated against the assembler syntax and the ISA of the targeted architecture.
- A **symbol table** is constructed to record all the labels and declared symbols. Unresolved external references are tracked and marked *undefined* for the linker.
- Instructions and data is organized in appropriate sections. And section metadata is generated.
- Each assembly instruction is translated into its binary machine-code form (opcodes + operands).
- Relocation entries are created for instructions involving symbols whose runtime address is not yet known.
- Everything (machine instructions and data organized in sections, symbol tables and relocation records) is packed into a relocatable object file.
- The relocatable object file follows the ELF specification for its structure.

The assembler can be used on the `.s` file generated previously.
```bash
$ as hello.s -o hello_as.o
```

We can use `gcc` with `-c` to do the same.
```bash
$ gcc -c hello.s -o hello_gcc.o
```

gcc with `-c` carries out:
  - preprocessing, compilation and assembling on `.c` files,
  - compilation and assembling on `.i` files, and
  - assembling on `.s` files.

Running `diff` shows no difference. The file sizes are the same too, proving they are identical.

## Linking

Writing **modular code** is a foundational principle in programming. It divides a big task into atomic functions, making coding and debugging easier.
  - In large projects, the number of such functions can sky rocket. To control it, we group these atomic functions in multiple files, each for one task.
  - When functions from other files are required, we import/include those files in that particular scope.
  - We also use functions which aren't defined by us. Take `printf`.

When we have multiple source files (.c), all of them are passed to `gcc`, which preprocesses, compiles and assembles them individually, generating **relocatable object files** one for each source file. But they are intermediaries consumed by the linker.
  - "Linking" joins these object files together and yields **one single executable object file**.

When multiple relocatable object files are combined, their individual sections are unified and a final layout is generated. Based on the final layout, the linker tries to calculate the address of these "functions/data" referenced across source files.
  - If the address of a symbol can be calculated, it patches it wherever it is used.
  - For functions whose definition doesn't exist in our source files (like `printf`), we have to use **shared libraries**, which are code **written and built** by other individuals for public use.
  - We need to link our relocatable object files with these shared libraries to obtain the definition of these functions.

These shared libraries exist in two forms to support two different modes of linking.
  - Static shared libraries for static linking.
  - Runtime shared libraries for dynamic linking.

In **static linking**, all the addresses are resolved at build-time only. The relocatable object files are linked with appropriate static shared libraries (.a), yielding an executable file which is completely isolated and can run independently.

**Dynamic linking** divides this process in two phases, where each phase uses a different linker.
  - The **build-time phase** uses the **build-time linker**, which lay down instructions for the **runtime-linker** to act in the **runtime phase** to link the final layout obtained by merging all the relocatable object files at build-time linking with dynamic shared libraries (.so).

The linker used at build-time is the same in static and dynamic linking.

Let's try to link our object file.

---

To invoke the linker on the `.o` file generated previously, we do:
```bash
$ ld hello_as.o -o hello_ld_exe

ld: warning: cannot find entry symbol _start; defaulting to 0000000000401000
ld: hello_as.o: in function `main':
hello.c:(.text+0xf): undefined reference to `puts'
```
... and we get errors.

However, if we us gcc, we don't get any error.
```bash
$ gcc hello_as.o -o hello_gcc_exec
```

These errors exist because the linker needs some information to link our relocatable object code with appropriate shared libraries.

That's why `as` and `ld` are so versatile, because they are not coupled with the GNU toolchain. Instead, gcc orchestrates their usage, making it easier for beginners to work with these tools.

---

This marks the end of the high level overview of the build-execution model of C.

Let's talk about gcc.

# GCC as an Orchestrator

GCC is not a compiler in real sense. It's an orchestrator for multiple specialized tools used in the build-execution pipeline.

**Its power lies in orchestration, not execution**. It abstracts the complexity of the build-execution pipeline while remaining open enough that advanced users can peek underneath, modify, or replace any stage as needed.

It embeds vast range of intelligence about platform-specificity, toolchain, language semantics and things beginners don't understand.

It supports multiple languages like C, C++, Go, Ada, Fortran and Objective-C. You can mix and link across them because GCC knows how to manage them.

GCC can target architectures other than the host, when configured properly.
  - We can develop software for embedded systems without using an embedded system to develop them.
  - We can build binaries for 32-bit or even 16-bit on a 64-bit architecture.
  - We can build software for Windows/Mac or even ARM/MIPS being on Linux.

Is software for mobile built on mobile? No. Because the tools that build them are intelligent enough to build them without being on that exact architecture. GCC is one such tool.

If we use `-g`, GCC orchestrates the compiler and assembler to include some magical information that makes debugging easier. That magical information is DWARF/debug symbols, which is not a part of the build-execution pipeline, but the *debug pipeline*.

We had errors using the linker independently but GCC doesn't because it passes the required information intelligently, internally.

# Conclusion

Every stage in this pipeline transforms the human readable instructions into machine understandable instructions.
```bash
source → preprocessed source → assembly → relocatable object → executable object.
```
