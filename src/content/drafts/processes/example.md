# Managing A Process

We will create a program which manually calls fork, execve, wait and exit to manage the lifetime of a binary as a child process.
```c
/* process.c */

#include <stdio.h>       // Standard I/O: printf() and perror()
#include <stdlib.h>      // General Utils: exit()
#include <unistd.h>      // POSIX API: fork(), execvp(), getpid(), getppid()
#include <sys/types.h>   // Defines data types used in system calls: pid_t (the data type for process IDs)
#include <sys/wait.h>    // Provides macros and functions for waiting on child processes: waitpid(), WIFEXITED(), WEXITSTATUS()

int main() {
  pid_t pid;

  printf("Calling Process `p_proc`:\n");
  printf("  PPID: %d\n", getppid());
  printf("  PID : %d\n", getpid());
  printf("---------------------------\n");

  // 1. Process creation (fork)
  printf("Calling fork.....\n");
  pid = fork();

  if (pid == -1) {
    perror("fork failed");
    printf("`p_proc`: return value from fork(): %d\n", pid);
    exit(EXIT_FAILURE);
  }

  if (pid == 0) {
    // If cloning was successful, we would be inside the cloned process
    printf("Cloned Process `c_proc`:\n");
    printf("  PPID: %d\n", getppid());
    printf("  PID : %d\n", getpid());
    printf("Return value from fork() to `c_proc`: %d\n", pid);
    printf("---------------------------\n");

    // 2. Image replacement using exec
    char *args[] = {"./executable", NULL};
    if (execvp(args[0], args) == -1) {
      perror("exec failed");
      exit(EXIT_FAILURE);
    }
  }

  else {
    // Parent process
    int status;
    waitpid(pid, &status, 0);  // Wait for child to finish

    if (WIFEXITED(status)) {
      printf("Child exited with status %d\n", WEXITSTATUS(status));
      printf("---------------------------\n");
      printf("Return value from fork(): to `p_proc` %d\n", pid);
    } else {
      printf("Child did not exit normally.\n");
    }
  }

  return 0;
}
```

This is the executable:
```c
/* executable.c */

#include <stdio.h>
#include <unistd.h>

int main(void){
  printf("Hello, World!\n");
  sleep(400);
}
```

# Explanation

`pid_t` is a type definition, defined in the `POSIX` API to hold process IDs. It allows the kernel and user-space programs to use a portable data type for managing process IDs.

`fork()` is used to clone the process that calls fork.
  - If the calling process is cloned successfully, it returns 0 to the **cloned process** and the process ID of the cloned process to the calling process (which is now the parent process).
  - If cloning failed, it returns `-1` to the calling process.

`getpid()` and `getppid()` are relative to the process that invokes them. They give the process ID and parent process ID for the process that invokes them.

---

The `exec()` family of functions returns only when an error occur, which is -1.

The `waitpid()` function is like the `async()` function in JavaScript, which waits for a process to finish and adjusts the results appropriately, without stopping the current execution.

# Flow of execution

We are naming the parent (process.c) as `p_proc` and the child (binary.c) as `c_proc`.

---

The calling process is cloned.

We know that processes are independent in their execution, which means `p_proc` and `c_proc` will execute independently.

  - If we print something just after cloning the process, there is no guarantee if the first print came from the parent or the child because the child is a near-copy of the parent and the process image is not changed yet.
  - It depends on scheduling algorithms that which goes first.

Both the processes continue executing the same code from the point where fork() returned. Lets look at the execution of `p_proc` first.

  - If fork succeeded in cloning, the `pid` variable for the calling process would have a random **unsigned value**, representing the process ID of the cloned process. So p_proc never goes in either of the `if` blocks.
  - p_proc will go in the `else` block. Here it will find `waitpid()`, which will tell it to wait until the cloned process finishes.

If the parent doesn't wait (i.e no waitpid()) for he child to finish, the child becomes a zombie process after finishes. Such processes are adopted by `init` or the PID1 process.

---

The `c_proc` receives `0` in its `pid` variable. So it qualifies to go inside the second `if` block.
  * And everything happens as stated in the `execve` section.
  * Both the processes are executing independently, but because of `waitpid()`, the parent waits for the child to finish.

That's how it works.
