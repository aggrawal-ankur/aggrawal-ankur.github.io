# Stack Frame

***A stack frame (also known as activation record) is a chunk of the stack that belongs to a single procedure call.***

When a function calls another function, a new stack frame (or activation record) is created and the instruction pointer register (`rip`) is adjusted by the CPU to point to the instruction in the new procedure.

Until the upper stack frame exists, the lower one can't execute. Once the stack frame at top is done with its execution and it is killed, `rip` is adjusted again to continue where it has left in the old frame.

## Stack Frame Internals

This is the general layout of a stack frame.
```
*---------------------*
| Function Arguments  | <-- [rbp+16], [rbp+24], ....
|     (beyond 6)      |
*---------------------*
|   Return Address    |
| (next ins in prev.) | <-- [rbp+8]
*---------------------*
| Old Base Ptr Saved  | <-- [rbp]: old base pointer && rbp: new base pointer
*---------------------*
|   Local Variables   | <-- [rbp-8], [rbp-16], ....
*---------------------*
|     Empty Space     |
|   (for alignment)   |
|     (as needed)     |
*---------------------* <-- rsp
```
