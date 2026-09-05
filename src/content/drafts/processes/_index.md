# Linux Processes

To execute a binary, the Linux kernel creates a **process**.

*A process is a running instance of a binary.*

Processes follow a **parent-child relationship**. Just like parents give birth to offsprings, new processes come out of the existing processes.

Although this parent-child relationship doesn't affect the execution of either of the processes, the child process still reports its execution status to the parent. This is important in cleaning up the resources after the child exits.

To view the tree like structure of processes, we can use the `pstree` command.

# Key Properties Of A Process

| Property | Description |
| -------- | ----------- |
| PID      | Unique process identifier. |
| PPID     | Parent process ID. |
| UID/GID  | User and group IDs determining ownership and permissions. |
| State    | Current status: running, sleeping, stopped, or zombie. |
| Signals  | Pending and blocked signals for the process. |
| Scheduling Info | Priority, scheduling policy, and CPU affinity. |
| Cgroups    | Resource limits and accounting (CPU, memory, I/O).  |
| Start Time | Time the process was created. |
