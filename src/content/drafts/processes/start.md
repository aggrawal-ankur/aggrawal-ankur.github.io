# The Start Of Processes

When we provide power and start our computer, the CPU executes the firmware from a non-volatile memory chip on the motherboard.

The firmware (BIOS or UEFI) starts the bootloader after hardware initialization.

The bootloader (e.g. GRUB) loads the kernel from the disk into memory and transfers control to it.

The kernel starts the **swapper process**, which is one per CPU core. The swapper process starts the `kthreadd` process which starts and manage every other kernel space process.

After the core kernel threads are initialized, the kernel starts the PID 1 process in the user space.
  - It is the init process, which varies with the distribution choice. Widely used ones are `/sbin/init` and `systemd`.
  - Every user space process is a descendant of the init process and init process starts and manage every user space process.

# Final Model

```
Power ON
   ↓
Firmware (BIO/UEFI)
   ↓
Bootloader (GRUB, etc)
   ↓
Kernel
  └─ PID 0: Swapper Process (swapper/0)
  └─ PID 2: kthreadd (kernel space processes)
  └─ PID 1: init (user space processes)
```

And that's how Linux processes follow a tree like structure.

## Notes

kthreadd is started by swapper/0 but not parented by it.

Swapper processes exist per cpu core but only the boot-core, that is, swapper/0, gets PID 0. Others don't get process IDs.

Even though the init process comes after the kthreadd process, this PID numbering is purely a design choice.

The kernel scheduler manages all the runnable entities: init, kthreadd, other kthreads, and every user process or thread.

The PID space is global, not split between kernel and user space.
