# How new processes are created?

The creation of a new Linux process is divided in 4 steps.

| Step | Description | Syscall (libc API) |
| :--- | :---------- | :------ |
| 1 | Clone the current process | fork() |
| 2 | Replace the process image of the cloned process with the new executable. | execve() |
| 3 | Parent waits for the child to finish | wait() |
| 4 | Child finishes and returns the status to the parent | exit() |

A process often spawns sub-processes to segregate jobs. For example:
  - When you open a new terminal inside VS Code, it is opened as a separate process, which is a child of the VS Code process.
  - When you open a new tab in FireFox, it is opened as a child of the FireFox process.

The hierarchical nature of processes organizes all the sub-process that a process can create. On contrary, if you had a flat-management system, that would easily get bloated and uneasy to manage as there can be thousands of processes, if not millions.

The calling process is forked using `fork()`. 

The forked process undergoes process image replacement by `execve()`.

The parent process waits until the child finishes using `wait()`.

After the child has exited, the parent process is notified.

***Note: The execution of child process doesn't affect the execution of the parent process. Both the processes remain isolated.***
