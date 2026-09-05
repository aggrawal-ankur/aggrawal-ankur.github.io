# Virtual Address Space

Virtual address space is the runtime representation of a binary.

Virtual Address Space (or VAS) is divided into two parts.
  - Kernel Space
  - User Space

```
High Address
                     Top Of The Virtual Address
                                Space
0xFFFFFFFFFFFFFFFF *-----------------------------* End Of Kernel Space ↓
                   |                             |
                   |        Kernel Space         |
                   |                             |
                   |       Size: ~128 TiB        |
                   |                             |
                   |         Upper Half          |
                   |                             |
0xFFFF800000000000 *-----------------------------* Start Of Kernel Space ↑
                   |                             |
                   |    Unused / Guard Space     |
                   |                             |
0x0000800000000000 *-----------------------------* End of User Space ↓
                   |                             |
                   |         User Space          |
                   |                             |
                   |       Size: ~128 TiB        |
                   |                             |
                   |         Lower Half          |
                   |                             |
0x0000000000400000 *-----------------------------* Start Of User Space ↑
                   |                             |
                   |     Reserved / Unmapped     |
                   |                             |
0x0000000000000000 *-----------------------------*

                    Bottom Of The Virtual Address
                                Space
Low Address
```

User space and Kernel space are two logical divisions in virtual memory.

This logical division is achieved by access control privileges and protection rights, which are enforced both at hardware level (CPU) and software level (OS).

Most program instructions run entirely in user mode. Only specific operations that require hardware or system resources transition into kernel mode via system calls.

There is no limit on what you can execute, which creates problems. This division ensures that programs can be contained by default.
  - Any attempt to access privileged area doesn't get unnoticed. If it is inappropriate, the system denies it.

There is a proper mechanism through which the execution mode changes from user space to kernel space, when required.

## Analogy

Consider an office space with employees of different kinds and a room for the boos.

The boss's room is what kernel space is. Only privileged access is allowed and rest has to undergo a process to come there.

Then there is general area which is accessible to everyone as long as they are an employee in the company. This is what user space is.

When you need to do something that requires boss' permission, you go through a standard process, which is exactly how the execution context changes from user space to kernel space when required.

## Hardware Enforced Privilege Levels

**Rings** are hardware-enforced CPU privilege levels, which forms a core part of how modern processors (like x64) separates trusted code (kernel) from untrusted (user) code.

CPUs implement multiple **protection rings** numbered 0 to 3, with:
  - **Ring 0 = highest privilege (kernel mode)**
  - **Ring 3 = lowest privilege (user mode)**
  - **Rings 1 and 2** exist but are rarely used in mainstream Linux.
