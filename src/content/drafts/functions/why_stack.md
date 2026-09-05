# How functions are created in assembly?

A function is basically a form of control flow where you jump to a specific point and return back to the old context at the appropriate moment.

Labels combined with jump statements is how we achieve control flow in assembly.

You create a label and jump to it. The only problem is **return context**. Plain jump statements don't know to return.

How can we create labels with **return context**? The answer is **stack**.

## What are our needs?

Everyone has some experience with C. You create the `main` function and call `printf` from `stdio.h` to print `Hello, World!`.
  - `printf` itself is a function, which uses other internal functions to perform the task it is meant to.

We would not appreciate one function accessing the variables declared inside another function. But we want functions to receive arguments from the caller function.

When we call printf from the `main()`, we want the `main()` to hang/wait until `printf()` finishes.

When one function calls another function, we want the callee function to return to the caller function, so that it knows it has finished and can continue its execution. Maybe we want to return something to the caller function as well.

## How stack can help?

Imagine a stack of plates.
  * The last plate (the top one) is always taken out first.
  * When more plates come, they sit on the top of the existing stack.
  * Plates can't be taken out in middle or bottom.

That's how we want function calls to exist.
  * Until the plate on the top is not taken, the bottom ones can't be taken out.
  * Until the callee is not finished, caller can't execute further.

***

Imagine a stack of office files, organized from high priority (top) to low priority (bottom), each containing a number of pages.
  * Each file has a case study and each case has its own data collection and outcomes.
  * Similarly, each function should get its own environment where its declarations and nested calls reside.

***

Imagine adding/removing plates from the stack.

Can you see stack smoothly lining up with our priorities?

  * There is `main` which calls `printf`. A stack frame is created and the control is transferred to it.
  * When `printf` is finished, the control naturally returns to `main`, without any extra managerial logic.
  * When `scanf` is called, another stack frame is created and the control is transferred to it. When it finishes, the control returns back to the `main()`.
  * Each stack frame is isolated, so others frame can't mess with it.
