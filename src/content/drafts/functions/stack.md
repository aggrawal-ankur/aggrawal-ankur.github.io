# Stack As Methodology

Stack is a memory management technique that manages memory in a sequential manner.

It works exactly like a stack of plates.

  * The first plate is at the bottom and every other plate comes on the top of it (*push*).
  * The last plate is at the top of the stack.
  * When we take out plates, it happens from the top, not the bottom (*pop*).

---

Although a stack of plates grows upwards, the memory managed by stack grows downwards, because the stack is placed at the top of the user space and it can't go upwards. So it grows downwards.

What downward growth actually means is that every push decreases the stack pointer or the address value and every pop increases the stack pointer or the address value. 

---

***Note: The whole addressable memory is not managed with stack. There are multiple techniques for multiple purposes.***