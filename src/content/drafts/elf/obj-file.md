# Object Files

***An object file is a structured binary representation of a program.***

***The executable and linkable file (ELF) format defines the structure for object files in the Linux ecosystem.***

Every stage in the build-execution pipeline either builds or consumes a subset of this structure, which gives birth to different object files, notably:
  - Relocatable object,
  - Executable object, and
  - Shared object

## Relocatable Object

It is the output of an assembler and is consumed by the build-time linker.

## Executable Object

It is the output of the build-time linker. It can be loaded in the memory for execution.

## Shared Object

Functions like `printf` belong to code written by others and built as a shared object which can be used by anyone. 

The relocatable object is linked with these shared object (also called shared libraries) to resolve the addresses of these functions and the outcome is an executable object.

Shared objects can be runtime libraries (.so) or static (.a) libraries.
