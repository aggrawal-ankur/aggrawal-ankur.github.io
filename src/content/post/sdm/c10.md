---
title: "Intel SDM Volume 3, Chapter 10: Task Management"
publishDate: "2026-09-29"
# updatedDate: "2026-M-D"
description: "Chapter 10 notes"
tags: [ intel-sdm ]
draft: true
---

A task is a unit of work that a processor can dispatch, execute, and suspend. It can be used to execute a program, a task or process, an operating-system service utility, an interrupt or exception handler, or a kernel or executive utility.

The IA-32 architecture provides a mechanism for saving the state of a task, for dispatching tasks for execution, and for switching from one task to another.

When operating in protected mode, all processor execution takes place from within a task. Even simple systems must define at least one task. More complex systems can use the processor's task management facilities to support multitasking applications.

# Task Structure

A task is made up of two parts:
  - A task execution space, and
  - a task-state segment (TSS).

The task execution space consists of a code segment, a stack segment, and one or more data segments. If an operating system or executive uses the processor's privilege-level protection mechanism, the task execution space also provides a separate stack for each privilege level.

The TSS specifies the segments that make up the task execution space and provides a storage place for task state information. In multitasking systems, the TSS also provides a mechanism for linking tasks.

A task is identified by the segment selector for its TSS. When a task is loaded into the processor for execution, the segment selector, base address, limit, and segment descriptor attributes for the TSS are loaded into the task register (`TR`).

If paging is implemented for the task, the base address of the page directory used by the task is loaded into control register `CR3`.

# Task State

The following items define the state of the currently executing task:

- The task's current execution space, defined by the segment selectors in the segment registers (`CS`, `DS`, `SS`, `ES`, `FS`, and `GS`).
- The state of the general-purpose registers.
- The state of the `EFLAGS` register.
- The state of the `EIP` register.
- The state of `CR3`.
- The state of the task register (`TR`).
- The state of the `LDTR`.
- The I/O map base address and I/O map (contained in the `TSS`).
- Stack pointers to the privilege 0, 1, and 2 stacks (contained in the `TSS`).
- Link to previously executed task (contained in the `TSS`).
- The state of the shadow stack pointer (SSP).

Prior to dispatching a task, all of these items are contained in the task's `TSS`, except the state of the task register.

Also, the complete contents of the `LDTR` register are not contained in the `TSS`, only the segment selector for the LDT.

# Executing a Task

Software or the processor can dispatch a task for execution in one of the following ways:
  - A explicit call to a task with the `CALL` instruction.
  - A explicit jump to a task with the `JMP` instruction.
  - An implicit call (by the processor) to an interrupt-handler task.
  - An implicit call to an exception-handler task.
  - A return (initiated with an `IRET` instruction) when the `EFLAGS.NT` flag is set.

All of these methods for dispatching a task identify the task to be dispatched with a segment selector that points to a task gate or the TSS for the task.

When dispatching a task with a `CALL` or `JMP` instruction, the selector in the instruction may select the TSS directly or a task gate that holds the selector for the TSS.

When dispatching a task to handle an interrupt or exception, the IDT entry for the interrupt or exception must contain a task gate that holds the selector for the interrupt-handler or exception-handler TSS.

---

When a task is dispatched for execution, a task switch occurs between the currently running task and the dispatched task.

During a task switch, the execution environment of the currently executing task (called the task's state or context) is saved in its TSS and execution of the task is suspended.

The context for the dispatched task is then loaded into the processor and execution of that task begins with the instruction pointed to by the newly loaded `EIP` register.

If the task has not been run since the system was last initialized, the `EIP` will point to the first instruction of the task's code; Otherwise, it will point to the next instruction after the last instruction that the task executed when it was last active.

---

If the currently executing task (the calling task) called the task being dispatched (the called task), the `TSS` segment selector for the calling task is stored in the `TSS` of the called task to provide a link back to the calling task.

For all IA-32 processors, tasks are not recursive. A task cannot call or jump to itself.

Interrupts and exceptions can be handled with a task switch to a handler task. Here, the processor performs a task switch to handle the interrupt or exception and automatically switches back to the interrupted task upon returning from the interrupt-handler task or exception-handler task. This mechanism can also handle interrupts that occur during interrupt tasks.

---

As part of a task switch, the processor can also switch to another LDT, allowing each task to have a different logical-to-physical address mapping for LDT-based segments.

The page-directory base register (`CR3`) also is reloaded on a task switch, allowing each task to have its own set of page tables. These protection facilities help isolate tasks and prevent them from interfering with one another.

If protection mechanisms are not used, the processor provides no protection between tasks. This is true even with operating systems that use multiple privilege levels for protection.

A task running at privilege level 3 that uses the same LDT and page tables as other privilege-level-3 tasks can access code and corrupt data and the stack of other tasks.

---

Use of task management facilities for handling multitasking applications is optional.

Multitasking can be handled in software, with each software defined task executed in the context of a single IA-32 architecture task.

If shadow stack is enabled, then the `SSP` of the task is located at the 4 bytes at offset 104 in the 32-bit TSS and is used by the processor to establish the `SSP` when a task switch occurs from a task associated with this TSS.

Note that the processor does not write the `SSP` of the task initiating the task switch to the TSS of that task, and instead the `SSP` of the previous task is pushed onto the shadow stack of the new task.

---

# Task Management Data Structures

The processor defines five data structures for handling task-related activities:
  - Task-state segment (TSS).
  - Task-gate descriptor.
  - TSS descriptor.
  - Task register.
  - `EFLAGS.NT` flag.

When operating in protected mode, a TSS and TSS descriptor must be created for at least one task, and the segment selector for the TSS must be loaded into the task register (using the `LTR` instruction).

## Task State Segment (TSS)

The processor state information needed to restore a task is saved in a system segment called the task-state segment (TSS).

The fields of a TSS are divided into two main categories: dynamic fields and static fields.

The processor updates dynamic fields when a task is suspended during a task switch. The following are dynamic fields:

***General-purpose register fields***: State of the EAX, ECX, EDX, EBX, ESP, EBP, ESI, and EDI registers prior to the task switch.

***Segment selector fields***: Segment selectors stored in the ES, CS, SS, DS, FS, and GS registers prior to the task switch.

***EFLAGS register***: State of the `EFLAGS` register prior to the task switch.

***EIP (instruction pointer)***: State of the `EIP` register prior to the task switch.

***Previous task link field*** contains the segment selector for the TSS of the previous task (updated on a task switch that was initiated by a call, interrupt, or exception). This field (which is sometimes called the ***back link field***) permits a task switch back to the previous task by using the `IRET` instruction.

---

The processor reads the static fields, but does not normally change them. These fields are set up when a task is created. The following are static fields.

***LDT segment selector field*** contains the segment selector for the task's LDT.

***CR3 control register field*** contains the base physical address of the page directory to be used by the task. `CR3` is also known as the page-directory base register (`PDBR`).

***Privilege level-0, -1, and -2 stack pointer fields***
  - These stack pointers consist of a logical address made up of the segment selector for the stack segment (`SS0`, `SS1`, and `SS2`) and an offset into the stack (`ESP0`, `ESP1`, and `ESP2`).
  - Note that the values in these fields are static for a particular task; whereas, the `SS` and `ESP` values will change if stack switching occurs within the task.

***T (debug trap) flag (byte 100, bit 0)*** when set, the `T` flag causes the processor to raise a debug exception when a task switch to this task occurs.

***I/O map base address field*** contains a 16-bit offset from the base of the `TSS` to the I/O permission bit map and interrupt redirection bitmap.
  - When present, these maps are stored in the `TSS` at higher addresses.
  - The I/O map base address points to the beginning of the I/O permission bit map and the end of the interrupt redirection bit map.

***Shadow Stack Pointer (SSP)*** contains task's shadow stack pointer.
  - The shadow stack of the task should have a supervisor shadow stack token at the address pointed to by the task SSP (offset 104).
  -  This token will be verified and made busy when switching to that shadow stack using a `CALL`/`JMP` instruction, and made free when switching out of that task using an `IRET` instruction.

---

If paging is used:
  - pages corresponding to the previous task's TSS, the current task's TSS, and the descriptor table entries for each all should be marked as read/write.
  - task switches are carried out faster if the pages containing these structures are present in memory before the task switch is initiated.

---

## TSS Descriptor

The `TSS`, like all other segments, is defined by a segment descriptor.

`TSS` descriptors may only be placed in the GDT; they cannot be placed in an LDT or the IDT.

An attempt to access a `TSS` using a segment selector with its `TI` flag set (which indicates the current LDT) causes
  - a `#GP` during CALLs and JMPs
  - an invalid `TSS` exception `#TS` during IRETs.

A general-protection exception is also generated if an attempt is made to load a segment selector for a `TSS` into a segment register.

The busy flag (`B`) in the type field indicates whether the task is busy. A busy task is currently running or suspended. A type field with a value of `1001B` indicates an inactive task; a value of `1011B` indicates a busy task. 

Tasks are not recursive. The processor uses the busy flag to detect an attempt to call a task whose execution has been interrupted. To ensure that there is only one busy flag is associated with a task, each `TSS` should have only one `TSS` descriptor that points to it.

```
                                                               [ TYPE  ]
[ BASE 31:24 ] [G] [0] [0] [AVL] [ LIMIT 19:16 ] [P] [DPL] [0] [1 0 B 1] [ BASE 23:16 ]
31          24  23  22  21  20   19           16  15 14 13  12 11      8 7            0

[ BASE Address 15:00 ] [ Segment Limit 15:00 ]
31                  16 15                    0
```
  - (G) Granularity
  - (AVL) Available for system software to use
  - (P) Segment Present Bit
  - (DPL) Descriptor Privilege Level
  - (B) Busy Flag
  - (BASE) Segment base address
  - (TYPE) Segment type

The base, limit, and DPL fields and the granularity and present flags have functions similar to their use in data-segment descriptors.

When the G flag is 0 in a TSS descriptor for a 32-bit TSS, the limit field must have a value equal to or greater than `67H`, one byte less than the minimum size of a `TSS`.

Attempting to switch to a task whose TSS descriptor has a limit less than `67H` generates an invalid-TSS exception (#TS). A larger limit is required if an I/O permission bit map is included or if the operating system stores additional data.

The processor does not check for a limit greater than `67H` on a task switch. However, it does check when accessing the I/O permission bit map or interrupt redirection bit map.

Any program or procedure with access to a TSS descriptor (that is, whose CPL is numerically equal to or less than the DPL of the TSS descriptor) can dispatch the task with a call or a jump.

In most systems, the DPLs of TSS descriptors are set to values less than 3, so that only privileged software can perform task switching. However, in multitasking applications, DPLs for some TSS descriptors may be set to 3 to allow task switching at the application (or user) privilege level.

---

In 64-bit mode, task switching is not supported, but TSS descriptors still exist. The TSS descriptor is expanded to 16 bytes. This expansion also applies to an LDT descriptor in 64-bit mode.

```
TSS (or LDT) Descriptor

[ Reserved ] [ 0 ] [ Reserved ]
31        13 12  8 7          0

[ BASE Address 63:32 ]
31                   0

[ BASE 31:24 ] [G] [0] [0] [AVL] [ LIMIT 19:16 ] [P] [DPL] [0] [ TYPE ] [ BASE 23:16 ]
31          24  23  22  21  20   19           16  15 14 13  12 11     8 7            0

[ BASE Address 15:00 ] [ Segment Limit 15:00 ]
31                  16 15                    0
```

---

## Task Register

The task register holds the 16-bit segment selector and the entire segment descriptor (32-bit base address (64 bits in IA-32e mode), 16-bit segment limit, and descriptor attributes) for the TSS of the current task.

This information is copied from the TSS descriptor in the GDT for the current task.

The task register has a visible part (that can be read and changed by software) and an invisible part (maintained by the processor and is inaccessible by software).

The segment selector in the visible portion points to a TSS descriptor in the GDT. The processor uses the invisible portion of the task register to cache the segment descriptor for the TSS. Caching these values in a register makes execution of the task more efficient.

The `LTR` (load task register) and `STR` (store task register) instructions load and read the visible portion of the task register.

The `LTR` instruction loads a segment selector (source operand) into the task register that points to a TSS descriptor in the GDT. It then loads the invisible portion of the task register with information from the TSS descriptor.

`LTR` is a privileged instruction that may be executed only when the CPL is 0. It is used during system initialization to put an initial value in the task register. Afterwards, the contents of the task register are changed implicitly when a task switch occurs.

The `STR` (store task register) instruction stores the visible portion of the task register in a general-purpose register or memory. This instruction can be executed by code running at any privilege level in order to identify the currently running task. However, it is normally used only by operating system software. If `CR4.UMIP` is 1, `STR` can be executed only when `CPL` is 0.

On power up or reset of the processor, segment selector and base address are set to the default value of 0; the limit is set to `0xFFFF`.

---

## Task-Gate Descriptor

A task-gate descriptor provides an indirect, protected reference to a task. It can be placed in the GDT, an LDT, or the IDT.

The TSS segment selector field in a task-gate descriptor points to a TSS descriptor in the GDT.

The RPL in this segment selector is not used. The DPL of a task-gate descriptor controls access to the TSS descriptor during a task switch.

When a program or procedure makes a call or jump to a task through a task gate, the CPL and the RPL field of the gate selector pointing to the task gate must be less than or equal to the DPL of the task-gate descriptor.

Note that when a task gate is used, the DPL of the destination TSS descriptor is not used.

```
                           [ TYPE  ]
[ Reserved ] [P] [DPL] [0] [0 1 0 1] [ Reserved ]
31        16  15 14 13  12 11      8 7          0

[ TSS Segment Selector ] [ Reserved ]
31                    16 15         0
```

A task can be accessed either through a task-gate descriptor or a TSS descriptor. Both of these structures satisfy the following needs:

***Need for a task to have only one busy flag***
  - Because the busy flag for a task is stored in the TSS descriptor, each task should have only one TSS descriptor.
  - There may, however, be several task gates that reference the same TSS descriptor.

***Need to provide selective access to tasks***
  - Task gates fill this need, because they can reside in an LDT and can have a DPL that is different from the TSS descriptor's DPL.
  - A program or procedure that does not have sufficient privilege to access the TSS descriptor for a task in the GDT (which usually has a DPL of 0) may be allowed access to the task through a task gate with a higher DPL.
  - Task gates give the operating system greater latitude for limiting access to specific tasks.

***Need for an interrupt or exception to be handled by an independent task***
  - Task gates may also reside in the IDT, which allows interrupts and exceptions to be handled by handler tasks.
  - When an interrupt or exception vector points to a task gate, the processor switches to the specified task.

---

# Task Switching

The processor transfers execution to another task in one of four cases:

  - The current program, task, or procedure executes a `JMP` or `CALL` instruction to a `TSS` descriptor in the GDT.
  - The current program, task, or procedure executes a `JMP` or `CALL` instruction to a task-gate descriptor in the GDT or the current LDT.
  - An interrupt or exception vector points to a task-gate descriptor in the IDT.
  - The current task executes an `IRET` when the `EFLAGS.NT` flag is set.

`JMP`, `CALL`, and `IRET` instructions, as well as interrupts and exceptions, are all mechanisms for redirecting a program. The referencing of a TSS descriptor or a task gate (when calling or jumping to a task) or the state of the `EFALSG.NT` flag (when executing an `IRET` instruction) determines whether a task switch occurs.

[THE PROCESS OF TASK SWITCH]

[LOTS OF LORE]

