# A Theoretical Example

Take this source code:
```c
#include <stdio.h>
#include <unistd.h>    // sleep()

int main(void){
  printf("Hello, World!\n");
  sleep(400);
}
```

Build it:
```bash
gcc hello.c -o hello
```

# Call The Executable

To call/execute the executable, we need a shell (or terminal).

I have opened my shell, which is zsh.
```bash
$ echo $SHELL
/usr/bin/zsh
```

`zsh` itself is a "running" process. We can verify that with `ps`.
```zsh
$ ps
  
PID    TTY    TIME      CMD
41027  pts/0  00:00:01  zsh
49852  pts/0  00:00:00  ps
```

We will run the executable in background so that we can retain the shell session and the capability to examine it.
```bash
$ ./hello &
[1] 52184
```

With ps, we can see all the child processes of the current terminal session.
```bash
$ ps               

PID    TTY    TIME      CMD
41027  pts/0  00:00:02  zsh
52184  pts/0  00:00:00  binary
52325  pts/0  00:00:00  ps
```

Since the executable is executed within zsh, zsh must be the parent.
```bash
$ ps -o pid,ppid,cmd

PID    PPID   CMD
41027  40797  /usr/bin/zsh -i
59461  41027  ./hello
59559  41027  ps -T -o pid,ppid,cmd
```

Indeed. The PID of the zsh process is the PPID of the executable's process.

This proves the parent-child relationship between `zsh` and `binary` and `fork()` was called on the zsh process.

---

***When we run an executable, the calling process is forked to create a near-copy of it. This forked process undergoes major changes, after which it effectively becomes "the new process". No process is created fully-fresh.***

A fork is a near-clone of the parent process because things like PPID (and other metadata) are different.

The forked process undergoes process image replacement to map the executable in the virtual address space.

---

`strace` is a Linux utility which helps in tracing all the syscalls a process has executed.

If we run our program with `strace`, we get:
```bash
$ strace ./hello

execve("./main", ["./main"], 0x7ffd1dc5fcc0 /* 55 vars */) = 0
brk(NULL)                               = 0x55f5daaf0000
mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f55159e9000
access("/etc/ld.so.preload", R_OK)      = -1 ENOENT (No such file or directory)
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=78635, ...}) = 0
mmap(NULL, 78635, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7f55159d5000
close(3)                                = 0
openat(AT_FDCWD, "/lib/x86_64-linux-gnu/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0p\236\2\0\0\0\0\0"..., 832) = 832
pread64(3, "\6\0\0\0\4\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0"..., 840, 64) = 840
fstat(3, {st_mode=S_IFREG|0755, st_size=2003408, ...}) = 0
pread64(3, "\6\0\0\0\4\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0@\0\0\0\0\0\0\0"..., 840, 64) = 840
mmap(NULL, 2055800, PROT_READ, MAP_PRIVATE|MAP_DENYWRITE, 3, 0) = 0x7f55157df000
mmap(0x7f5515807000, 1462272, PROT_READ|PROT_EXEC, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x28000) = 0x7f5515807000
mmap(0x7f551596c000, 352256, PROT_READ, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x18d000) = 0x7f551596c000
mmap(0x7f55159c2000, 24576, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x1e2000) = 0x7f55159c2000
mmap(0x7f55159c8000, 52856, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_ANONYMOUS, -1, 0) = 0x7f55159c8000
close(3)                                = 0
mmap(NULL, 12288, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f55157dc000
arch_prctl(ARCH_SET_FS, 0x7f55157dc740) = 0
set_tid_address(0x7f55157dca10)         = 5695
set_robust_list(0x7f55157dca20, 24)     = 0
rseq(0x7f55157dc680, 0x20, 0, 0x53053053) = 0
mprotect(0x7f55159c2000, 16384, PROT_READ) = 0
mprotect(0x55f59ab88000, 4096, PROT_READ) = 0
mprotect(0x7f5515a25000, 8192, PROT_READ) = 0
prlimit64(0, RLIMIT_STACK, NULL, {rlim_cur=8192*1024, rlim_max=RLIM64_INFINITY}) = 0
munmap(0x7f55159d5000, 78635)           = 0
fstat(1, {st_mode=S_IFREG|0664, st_size=0, ...}) = 0
getrandom("\x90\x12\x7b\xa0\xce\xb5\xae\xd7", 8, GRND_NONBLOCK) = 8
brk(NULL)                               = 0x55f5daaf0000
brk(0x55f5dab11000)                     = 0x55f5dab11000
clock_nanosleep(CLOCK_REALTIME, 0, {tv_sec=1, tv_nsec=0}, 0x7ffc48c784e0) = 0
write(1, "Hello, World!", 13)           = 13
exit_group(0)                           = ?
+++ exited with 0 +++
```

The first syscall that executes in our forked process is `execve`.

# Updating The Process Image

***A process image is the runtime representation of an executable object in the virtual address space after it has been loaded into memory (RAM) by the OS for execution.***

***`execve` is a syscall which executes an executable file passed to it as an argument. It does that by replacing the process image of the process it is ran on with the executable object passed to it, effectively running a different program without creating a new process.***

`execve` is designed to be paired with the `fork` syscall in order to fit the hierarchical process structure in Linux.

***In simple words, `execve` is the syscall that replaces the process image in the forked process with the new executable object.***


## 1. Open the file in pathname

The kernel uses the virtual file system (VFS) layer to open the file passed in the pathname argument.

It performs permission checks, like, if the file can be executed or not. If valid, the kernel can access the file.

## 2. Verify executability.

The kernel verifies if the file is an object file or not. It does that by reading the magic bytes, which should be `0x7f 0x45 0x4c 0x46` for an ELF. If valid, the kernel continues.

Next the kernel checks whether the object file is an executable object or not. This is done by checking the value in the `e_type` field. It should be `ET_EXEC` or `ET_DYN`. If valid, the kernel continues.

The kernel reads the file header to obtain necessary information to navigate the executable object. Like,
  1. The e_ident[EI_CLASS] specifies the class of the object file.
  2. The e_ident[EI_DATA] specifies the data encoding, whether the file uses little-endian or big-endian.
  3. The e_machine field specifies the architecture the executable is built for.

After this, the kernel uses the `e_phoff` entry to locate the program headers.

## 3. Program Headers

The kernel iterates over the program headers table.

A dynamically linked executable can have position-dependent (non-PIE) code or position-independent (PIE) code, both of which requires the dynamic interpreter.

Both statically linked executable and a non-PIE dynamic executable are of type `ET_EXEC`. The only difference is that a statically linked executable doesn't require an interpreter but the dynamic one requires it.

Therefore, it is crucial for the kernel to check whether the program headers has a `PT_INTERP` segment. It's presence distinguishes between the two. It is important as the process varies for the two.

---

For dynamically linked executables, we have to load the interpreter and the interpreter carries out important things. For a statically linked executable, we just have to load the PT_LOAD segments, setup the stack and auxiliary vectors and we can start executing.

For statically linked executables, relocations are processed at build-time so constructs related to them are not applicable.

---

After the executable is loaded in the memory, it's time to execute the new process.

The process executes and the last instruction completes the call frame for main(). The main() returns to __libc_start_main() as it invoked the main().
  - It captures the return value from main() and invoked `exit(retval)`, which performs the structured teardown of the process.

exit() (from glibc) calls `__run_exit_handlers()`. It executes:
  - All functions registered with `atexit()`.
  - The destructors from DT_FINI_ARRAY.
  - The function pointed by DT_FINI.

Then __run_exit_handlers() calls `__cxa_finalize()`, which:
  - Invokes the C++ destructors for global/static objects.
  - Executes finalization functions for shared objects (.so) that were registered via `__cxa_atexit()` during dynamic linking.

Everything from main() to cleanup executes in user space within the process context that _start began.

---

Now, glibc invokes _exit(status), where _exit() is a syscall wrapper for SYS_exit. This is the true process termination point. The cpu changes mode from user to kernel. The kernel
  - Sets task state to `TASK_ZOMBIE`.
  - Releases user-space memory (unmaps VMA).
  - Closes file descriptors.
  - Notifies the parent the child has exited by sending `SIGCHLD`.
  - Records the exit code in the task struct.
  - Marks process as zombie (still exists in process table, minimal info kept for parent).

There is no “return” to user space. The process's thread of execution is gone. The CPU continues running in kernel context, switching to another runnable process via scheduler.

---

When the parent calls wait(), waitpid(), or waitid(), the kernel:
  - Scans the process table for children with TASK_ZOMBIE.
  - Copies the exit status (from task_struct->exit_code) to user space.
  - Removes the child's task_struct (fully deallocates process resources).

After that, the child is reaped by the parent. If parent never waits, the zombie remains until parent dies.

---

If you omit waitpid() initially, the parent keeps executing normally. The child runs in parallel.

When you later call waitpid(pid, &status, 0), the call will block until the specified child has exited and reached the zombie state. At this point, the kernel:
  - Copies the child's exit status to status.
  - Reaps the child (removes it from process table).
  - Returns control to the parent's user space.

Until the child terminates, waitpid() suspends the parent’s thread.

---

That's why the terminal hangs when you execute an AppImage or a binary which has to exist for a long duration (like a browser). waitpid is called immediately after fork-execve.

When you append an ampersand to the call, that prevents the shell to execute waitpid immediately. It simply records the background job’s PID and returns to prompt. Later, if you bring that job to foreground (fg), the shell attaches the terminal to that process group and then calls waitpid()—blocking again until it ends.

---

If a parent exits before the child, the child is adopted by PID 1 and PID 1 periodically calls wait() to reap orphans.

That's how it works.
