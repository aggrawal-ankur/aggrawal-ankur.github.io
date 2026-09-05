# What is a function?

Animals have organs, where each organ is designed for one single job and the whole body depends on it, directly or indirectly. You don't have to remember what an organ does, just remember the name of the organ and it opens you to its job. Something similar is observed in programs as well.

A function is an entity which helps you create organs for a program, where each function is designed to perform one single task and the whole program depends on its output, directly or indirectly.

When a task is made up of multiple smaller tasks, we can create smaller functions which perform these atomic jobs and create a controller function which orchestrates these smaller functions.

---

*A function names a behavior and provides a way to influence the outcome of the whole program with the outcome of its behavior.*

A function is a named, composable execution context that defines:
  - it's own environment,
  - instructions, and
  - a way to yield control and data back to the caller.

# What makes a function?

A function provides
  1. an environment which is isolated from the main environment.
  2. controlled interaction with other functions in the form of arguments (inputs) and returns (output).
  3. a predictable control boundary after which the control returns to a known continuation point.

This nature of functions enables its most important advantage: **code reusability**.