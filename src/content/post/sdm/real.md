# Chapter 23: 8086 Emulation

IA-32 processors (beginning with the Intel386 processor) provide two ways to execute new or legacy programs
that are assembled and/or compiled to run on an Intel 8086 processor:
  - Real-address mode.
  - Virtual-8086 mode.

When the processor is powered up or reset, it is placed in the real-address mode. This operating mode almost exactly duplicates the execution environment of the Intel 8086 processor, with some extensions. Virtually any program assembled and/or compiled to run on an Intel 8086 processor will run on an IA-32 processor in this mode.

When running in protected mode, the processor can be switched to virtual-8086 mode to run 8086 programs. This mode also duplicates the execution environment of the Intel 8086 processor, with extensions.

In virtual-8086 mode, an 8086 program runs as a separate protected-mode task. Legacy 8086 programs are thus able to run under an operating system that takes advantage of protected mode and to use protected-mode facilities, such as the interrupt and exception handling facilities.

Protected-mode multitasking permits multiple virtual-8086 mode tasks (with each task running a separate 8086 program) to be run on the processor along with other non-virtual-8086 mode tasks.

# Real-Address Mode

The IA-32 architecture’s real-address mode runs programs written for the Intel 8086, Intel 8088, Intel 80186, and Intel 80188 processors, or for the real-address mode of the Intel 286, Intel386, Intel486, Pentium, P6 family, Pentium 4, and Intel Xeon processors.

The execution environment of the processor in real-address mode is designed to duplicate the execution environment of the Intel 8086 processor.

To an 8086 program, a processor operating in real-address mode behaves like a high-speed 8086 processor. The following is a summary of the core features of the real-address mode execution environment as would be seen by a program written for the 8086.

***The processor supports a nominal 1 MiB physical address space***.
  - This address space is divided into segments, each of which can be up to 64 KiB in length.
  - The base of a segment is specified with a 16-bit segment selector, which is shifted left by 4 bits to form a 20-bit offset from address 0 in the address space.
  - An operand within a segment is addressed with a 16-bit offset from the base of the segment.
  - A physical address is thus formed by adding the offset to the 20-bit segment base.

***All operands in "native 8086 code" are 8-bit or 16-bit values.*** Operand size override prefixes can be used to access 32-bit operands.

***Eight 16-bit general-purpose registers are provided***.
  - They are `AX`, `BX`, `CX`, `DX`, `SP`, `BP`, `SI`, and `DI`.
  - The extended 32 bit registers (`EAX`, `EBX`, `ECX`, `EDX`, `ESP`, `EBP`, `ESI`, and `EDI`) are accessible to programs that explicitly perform a size override operation.

***Four segment registers are provided***.
  - They are `CS`, `DS`, `SS`, and `ES`. The `FS` and `GS` registers are accessible to programs that explicitly access them.
  - The `CS` register contains the segment selector for the code segment; the DS and `ES` registers contain segment selectors for data segments; and the SS register contains the segment selector for the stack segment.

The 8086 16-bit instruction pointer (IP) is mapped to the lower 16-bits of the EIP register. Note this register is a 32-bit register and unintentional address wrapping may occur.

The 16-bit `FLAGS` register contains status and control flags. It is mapped to the 16 least significant bits of the 32-bit `EFLAGS` register.

All of the Intel 8086 instructions are supported.

A single, 16-bit-wide stack is provided for handling procedure calls and invocations of interrupt and exception handlers.
  - This stack is contained in the stack segment identified with the `SS` register.
  - The `SP` (stack pointer) register contains an offset into the stack segment. The stack grows down (toward lower segment offsets) from the stack pointer.
  - The `BP` (base pointer) register also contains an offset into the stack segment that can be used as a pointer to a parameter list.
  - When a `CALL` instruction is executed, the processor pushes the current instruction pointer (the 16 least-significant bits of the `EIP` register and, on far calls, the current value of the `CS` register) onto the stack.
  - On a return, initiated with a `RET` instruction, the processor pops the saved instruction pointer from the stack into the `EIP` register (and `CS` register on far returns).
  - When an implicit call to an interrupt or exception handler is executed, the processor pushes the `EIP`, `CS`, and `EFLAGS` (low-order 16-bits only) registers onto the stack.
  - On a return from an interrupt or exception handler, initiated with an `IRET` instruction, the processor pops the saved instruction pointer and `EFLAGS` image from the stack into the `EIP`, `CS`, and `EFLAGS` registers.

A single interrupt table, called the "interrupt vector table" or "interrupt table," is provided for handling interrupts and exceptions.
  - The interrupt table (which has 4-byte entries) takes the place of the interrupt descriptor table (IDT, with 8-byte entries) used when handling protected-mode interrupts and exceptions.
  - Interrupt and exception vector numbers provide an index to entries in the interrupt table. Each entry provides a pointer (called a "vector") to an interrupt or exception handling procedure.
  - It is possible for software to relocate the IDT by means of the `LIDT` instruction on IA-32 processors beginning with the Intel386 processor.

The x87 FPU is active and available to execute x87 FPU instructions in real-address mode. Programs written to run on the Intel 8087 and Intel 287 math coprocessors can be run in real-address mode without modification.

---

The following extensions to the Intel 8086 execution environment are available in the IA-32 architecture’s real-address mode. If backwards compatibility to Intel 286 and Intel 8086 processors is required, these features should not be used in new programs written to run in real-address mode.

  - Two additional segment registers (FS and GS) are available.
  - Many of the integer and system instructions that have been added to later IA-32 processors can be executed in real-address mode.
  - The 32-bit operand prefix can be used in real-address mode programs to execute the 32-bit forms of instructions. This prefix also allows real-address mode programs to use the processor’s 32-bit general-purpose registers.
  - The 32-bit address prefix can be used in real-address mode programs, allowing 32-bit offsets.

## Address Translation

In real-address mode, the processor does not interpret segment selectors as indexes into a descriptor table. Instead, it uses them directly to form linear addresses as the 8086 processor does.

It shifts the segment selector left by 4 bits to form a 20-bit base address (WHY?). An offset (into the segment) is added to the base address to create a linear address that maps directly to the physical address space.

When using 8086-style address translation, it is possible to specify addresses larger than 1 MiB. For example, with a segment selector value of `0xFFFF` and an offset of `0xFFFF`, the linear (and physical) address would be `0x10FFEF`, i.e. 1 MiB plus 64 KiB.

The 8086 processor, which can form addresses only up to 20 bits long, truncates the high-order bit, thereby "wrapping" this address to `0xFFEF`. When operating in real-address mode, however, the processor does not truncate such an address and uses it as a physical address.

Note that for IA-32 processors beginning with the Intel486 processor, the `A20M#` signal can be used in real-address mode to mask address line `A20`, thereby mimicking the 20-bit wrap-around behavior of the 8086 processor. Care should be taken to ensure that `A20M#` based address wrapping is handled correctly in multiprocessor based system.

The IA-32 processors beginning with the Intel386 processor can generate 32-bit offsets using an address override prefix. However, in real-address mode, the value of a 32-bit offset may not exceed `0xFFFF` without causing an exception.

For full compatibility with Intel 286 real-address mode, pseudo-protection faults (interrupt 12 or 13) occur if a 32-bit offset is generated outside the range 0 through `0xFFFF`.

---

## Registers Supported

The register set available in real-address mode includes all the registers defined for the 8086 processor plus the new registers introduced in later IA-32 processors, such as the `FS` and `GS` segment registers, the debug registers, the control registers, and the floating-point unit registers.

The 32-bit operand prefix allows a real-address mode program to use the 32-bit general-purpose registers (`EAX`, `EBX`, `ECX`, `EDX`, `ESP`, `EBP`, `ESI`, and `EDI`).

---

## Instructions Supported

The following instructions make up the core instruction set for the 8086 processor. If backwards compatibility to the Intel 286 and Intel 8086 processors is required, only these instructions should be used in a new program written to run in real-address mode.

***Move instructions*** (`MOV`) that move operands between general-purpose registers, segment registers, and between memory and general-purpose registers.

***The exchange instruction*** (`XCHG`).

***Load segment register instructions***: `LDS` and `LES`.

***Arithmetic instructions***: `ADD`, `ADC`, `SUB`, `SBB`, `MUL`, `IMUL`, `DIV`, `IDIV`, `INC`, `DEC`, `CMP`, and `NEG`.

***Logical instructions***: `AND`, `OR`, `XOR`, and `NOT`.

***Decimal instructions***: `DAA`, `DAS`, `AAA`, `AAS`, `AAM`, and `AAD`.

***Stack instructions***: `PUSH` and `POP` (to general-purpose registers and segment registers).

***Type conversion instructions***: `CWD`, `CDQ`, `CBW`, and `CWDE`.

***Shift and rotate instructions***: `SAL`, `SHL`, `SHR`, `SAR`, `ROL`, `ROR`, `RCL`, and `RCR`.

`TEST` instruction.

***Control instructions***: `JMP`, Jcc, `CALL`, `RET`, `LOOP`, `LOOPE`, and `LOOPNE`.

***Interrupt instructions***: `INT n`, `INTO`, and `IRET`.

`EFLAGS` ***control instructions***: `STC`, `CLC`, `CMC`, `CLD`, `STD`, `LAHF`, `SAHF`, `PUSHF`, and `POPF`.

***I/O instructions***: `IN`, `INS`, `OUT`, and `OUTS`.

***Load effective address*** instruction (`LEA`), and ***translate instruction*** (`XLATB`).

`LOCK` prefix.

***Repeat prefixes***: `REP`, `REPE`, `REPZ`, `REPNE`, and `REPNZ`.

Processor halt instruction (`HLT`).

No operation instruction (`NOP`).

---

The following instructions, added to later IA-32 processors (some in the Intel 286 processor and the remainder in the Intel386 processor), can be executed in real-address mode, if backwards compatibility to the Intel 8086 processor is not required.

Move (MOV) instructions that operate on the control and debug registers.

***Load segment register instructions***: `LSS`, `LFS`, and `LGS`.

Generalized multiply instructions and multiply immediate data.

Shift and rotate by immediate counts.

***Stack instructions***: `PUSHA`, `PUSHAD`, `POPA`, `POPAD`, and PUSH immediate data.

***Move with sign extension instructions***: `MOVSX` and `MOVZX`.

Long-displacement Jcc instructions.

***Exchange instructions***: `CMPXCHG`, `CMPXCHG8B`, and `XADD`.

***String instructions***: `MOVS`, `CMPS`, `SCAS`, `LODS`, and `STOS`.

***Bit test and bit scan instructions***: `BT`, `BTS`, `BTR`, `BTC`, `BSF`, and `BSR`.

The byte-set-on condition instruction `SETcc`

The byte swap instruction (`BSWAP`).

***Double shift instructions***: `SHLD` and `SHRD`.

`ENTER` and `LEAVE` ***control instructions***.

`BOUND` instruction.

***CPU identification instruction*** (CPUID).

***System instructions***: `CLTS`, `INVD`, `WINVD`, `INVLPG`, `LGDT`, `SGDT`, `LIDT`, `SIDT`, `LMSW`, `SMSW`, `RDMSR`, `WRMSR`, `RDTSC`, and `RDPMC`.

---

Execution of any of the other IA-32 architecture instructions (not given in the previous two lists) in real-address mode result in an invalid-opcode exception (#UD) being generated.

---

## Interrupt and Exception Handling

When operating in real-address mode, software must provide interrupt and exception-handling facilities that are separate from those provided in protected mode.

Even during the early stages of processor initialization when the processor is still in real-address mode, elementary real-address mode interrupt and exception-handling facilities must be provided to ensure reliable operation of the processor, or the initialization code must ensure that no interrupts or exceptions will occur.

The IA-32 processors handle interrupts and exceptions in real-address mode similar to the way they handle them in protected mode. When a processor receives an interrupt or generates an exception, it uses the vector number of the interrupt or exception as an index into the interrupt table.

In protected mode, the interrupt table is called the ***interrupt descriptor table*** (IDT), but in real-address mode, the table is usually called the ***interrupt vector table***, or simply the ***interrupt table***.

The entry in the interrupt vector table provides a pointer to an interrupt or exception handler procedure. The pointer consists of a segment selector for a code segment and a 16-bit offset into the segment. The processor performs the following actions to make an implicit call to the selected handler:

1. Pushes the current values of the `CS` and `EIP` registers (only the 16 least-significant bits) onto the stack.
2. Pushes the low-order 16 bits of the `EFLAGS` register onto the stack.
3. Clears the `IF` flag in the `EFLAGS` register to disable interrupts.
4. Clears the `TF`, `RF`, and `AC` flags, in the `EFLAGS` register
5. Transfers program control to the location specified in the interrupt vector table.

An `IRET` instruction at the end of the handler procedure reverses these steps to return program control to the interrupted program.

Exceptions do not return error codes in real-address mode.

The interrupt vector table is an array of 4-byte entries. Each entry consists of a far pointer to a handler procedure, made up of a segment selector and an offset.

The processor scales the interrupt or exception vector by 4 to obtain an offset into the interrupt table. Following reset, the base of the interrupt vector table is located at physical address 0 and its limit is set to `0x3FF`.

In the Intel 8086 processor, the base address and limit of the interrupt vector table cannot be changed. In the later IA-32 processors, the base address and limit of the interrupt vector table are contained in the IDTR register and can be changed using the `LIDT` instruction.

For backward compatibility to Intel 8086 processors, the default base address and limit of the interrupt vector table should not be changed.