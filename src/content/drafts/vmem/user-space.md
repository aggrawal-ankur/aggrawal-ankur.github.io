# User Space

The user space is where unprivileged jobs are managed.

This is the general layout of the user space:
```
0x0000800000000000 *-----------------------------* End of User Space ↓
                   |   Stack (grows downward) ↓  |
                   *-----------------------------*
                   |    Memory-Mapped Region     |
                   |  (shared libs, mmap, ....)  |
                   *-----------------------------*
                   |         Free Space          |
                   *-----------------------------*
                   |    Heap (grows upward) ↑    |
                   *-----------------------------*
                   |  Static && Extern Variables |
                   |       (.bss / .data)        |
                   *-----------------------------*
                   |        Code (.text)         |
0x0000000000400000 *-----------------------------* Start Of User Space ↑
```

`.data` and `.bss` are packed together because they are functionally the same thing, just differ in initialization.

---

Memory was flat, is flat and will be flat. Stack and heap are two of the dozens of approaches to manage this memory. There are no specialized regions in the physical memory which refer to stack or heap.

---

A stack of plates grows upwards, but the stack in memory grows downwards. It is because the stack is placed at the top of the user space memory. It can't grow upwards, so it grows downwards. Simple.

As the stack grows, the address decreases.

The stack growing downwards bothers everyone for some time, but we get used to it.
  - A simple solution is to invert the diagram. Now the stack grows upward again.
  - Jokes aside, the addresses still decrease, not increase.

---

People say, "stack is fast, heap is slow". That can be attributed to how they are managed.
  - Stack is sequential, so you don't have the overhead to manage every single allocation.
  - Heap isn't sequential, you can allocate anywhere in the heap, which is why you have to keep extra bookkeeping to manage allocations.