---
title: "What is a chunk in malloc?"
publishDate: "2026-09-26"
# updatedDate: "2026-M-D"
description: "This is an in-depth exploration of the malloc_chunk struct in malloc in glibc-2.43."
tags: [ glibc-malloc ]
---

The output of `malloc(n)` is a piece of virtual memory. However, the allocator attaches some metadata to it.

This metadata is kept in a structure called `malloc_chunk`. It is normally hidden, as it sits right before the usable memory.
```
metadata  usable-mem
         ^
         |
         pointer returned to the process
```

> The terms "usable-mem", "user-mem", and "payload-mem" refer to the same thing.

---

The layout of this chunk is:
```c
struct malloc_chunk {
  INTERNAL_SIZE_T       mchunk_prev_size;
  INTERNAL_SIZE_T       mchunk_size;

  struct malloc_chunk*  fd;
  struct malloc_chunk*  bk;

  struct malloc_chunk*  fd_nextsize;
  struct malloc_chunk*  bk_nextsize;
};
```

A [comment](https://sourceware.org/git/?p=glibc.git;a=blob;f=malloc/malloc.c;h=a49e211925ae6303d064b7e590fd015e85affe38;hb=f762ccf84f122d135#l1073) in `malloc.c` mentions that this layout is "misleading".
```
/*
  This struct declaration is misleading (but accurate and necessary).
  It declares a "view" into memory allowing access to necessary
  fields at known offsets from a given base. See explanation below.
*/
```

But in my understanding, the layout is well-reasoned. But the reasoning is not available properly, making it complicated to understand. The following is my attempt to make that reasoning visible.

Let's start with the history of this layout and the annotation.

# History

`glibc` adopted `ptmalloc2` in v2.3, which is based on `dlmalloc@2.7.0`. We will use this repository on GitHub: [denizThatMenace/dlmalloc](https://github.com/denizThatMenace/dlmalloc).
  - It claims to be a mirror from Professor Doug Lea's [homepage](https://gee.cs.oswego.edu/pub/misc/).
  - Also, an account named *DougLea* is in the contributors list.

Either you can download each file manually from the primary source, view the version on github, or clone the github repo. I prefer working locally.

---

Now open every file. We can notice that `malloc_chunk` has evolved significantly before taking the shape we are studying here.

```c
/* malloc-2.6.3g.c */
struct malloc_chunk
{
  size_t prev_size;
  size_t size;
  struct malloc_chunk* fd;
  struct malloc_chunk* bk;
};
```

`INTERNAL_SIZE_T` was introduced.
```c
/* malloc-2.6.3i.c */
struct malloc_chunk
{
  INTERNAL_SIZE_T prev_size;
  INTERNAL_SIZE_T size;
  struct malloc_chunk* fd;
  struct malloc_chunk* bk;
};
```

`malloc-2.7.0.c` introduced the aforementioned comment.

Finally, a commit on *May 1, 2007* by *Ulrich Drepper* introduced the remaining fields, i.e. `fd_nextsize`/`bk_nextsize`.
```
[BZ #4349]
2007-04-30  Ulrich Drepper  <drepper@redhat.com>
	          Jakub Jelinek  <jakub@redhat.com>

      	[BZ #4349]
      	* malloc/malloc.c: Keep separate list for first blocks on the bin
      	lists with a given size.  This helps skipping over list elements
      	we know won't fit in two places.
      	Inspired by a patch by Tomash Brechko <tomash.brechko@gmail.com>.
```
  - [Official Sourceware Link](https://sourceware.org/git/?p=glibc.git;a=commit;h=7ecfbd386a340b52b6491f47fcf37f236cc5eaf1)
  - [bminor's GitHub Mirror](https://github.com/bminor/glibc/commit/7ecfbd386a340b52b6491f47fcf37f236cc5eaf1)

---

# Notes for the Reader

Before we explore the layout, we have to understand one thing. This applies not only to `malloc_chunk`, but anything that feels complicated at first.

malloc is a historical codebase. It has received improvements over many decades. Therefore, what we are exploring now is not how it started. We are reading an evolved form of something that might have started very simple.

Often times, accommodating new features requires changing the existing structure. Sometimes these changes are huge, other times they are minimal. But small changes accumulated over decades can significantly complicate the design.

In my understanding, reasoning is the thing that suffers the most. The reasoning no longer belongs to one region. We have to understand multiple things in order to make sense of the design. `malloc_chunk` is a great example of this.

How hard it can be to understand a tiny structure with 6 fields? The use of these fields can be easily summed up in a paragraph. However, it is not what I was looking for. I wanted to understand **the why** behind the design.

Let's start our exploration.

---

# Layout Description

The **allocation size** is divided into "**small**" and "**large**" based on a threshold. Therefore, we have two types of chunks based on **size**: ***small chunks*** and ***large chunks***.

A chunk can exist in two states: *"in-use"* and *"free"*.
  - **"In-use chunks"** (both small and large) require only the `malloc_chunk` struct for metadata.
  - **"Free chunks"**, however, require extra bookkeeping on top of `malloc_chunk` as they can be reused by future requests (more on this later). Small and large chunks are managed differently.

---

Based on the information above, the allocator has 3 chunk states to manage.
  - **"In-use chunks"**: chunks the process is actively using (both small and large).
  - **"Small free chunks"**: small chunks the process has freed.
  - **"Large free chunks"**: large chunks the process has freed.

Here is a high level description of how `malloc_chunk` is used to represent these 3 states of chunks.

## The size fields

`mchunk_size` holds the size of the current chunk, while `mchunk_prev_size` holds the size of the chunk previous to it (in memory). It includes the metadata bytes as well. There are some questions which are discussed later.
  - *Why the size of the previous chunk is stored?*
  - *Why the size of the next chunk is not stored?*
  - *What is* `INTERNAL_SIZE_T`*?* For the time being, treat it like `size_t`.

---

## The pointer fields

Free chunks are managed via bins, which are *"circular doubly linked lists"*. There are small bins for small chunks and large bins for large chunks.

Small free chunks use only the `fd/bk` fields, while large free chunks use all the pointer fields.

Small bins manage free chunks of only one size class, while large bins manage free chunks of multiple size classes falling in a size range. For example:
  - A small bin of size class 80 bytes contains free chunks of size 80 bytes only.
  - A large bin of size range `[1024, 1088)` bytes contains free chunks of size classes falling in that range.

> *This section is explored in detail in a separate writing.*

---

In simple words, ***`malloc_chunk` is a generic implementation designed to provide a single interface for all the three states in which a chunk can exist.***

This is both advantageous and confusing.

---

# Usage Description

***[Note]: For simplicity, all the calculations assume LP64 GNU/Linux (64-bit).***

---

On 64-bit Linux, both `size_t` and pointers are 8-bytes wide. That means, the size of `malloc_chunk` is (8*6) 48 bytes. We can verify this with `sizeof` as well.
  - Create a .c file.
  - Copy the struct declaration.
  - Replace `INTERNAL_SIZE_T` with `size_t`.
  - Print `sizeof(struct malloc_chunk)`.

---

`malloc_chunk` being a generic implementation is advantageous as it allows all the three 3 states of a chunk to be represented by a single struct definition. But each state uses only a subset of the whole struct.

  1. `mchunk_prev_size` and `mchunk_size` are necessary in all the cases.
  2. The pointer fields aren't useful in "**in-use**" chunks.
  3. A small free chunk uses only the fd/bk fields.
  
Only a large free chunk uses all the fields in `malloc_chunk`.

This has increased the difficulty to understand how one struct definition can represent all the states.

Before exploring the existing design, we will think about one ourselves. Like, *if we were tasked with designing a struct that can represent all the three states of a chunk (as discussed previously), what solution we can possibly think about?*

---

We want to use `malloc_chunk` such that,
  - the pointer fields remain garbage in an in-use chunk, and
  - the `fd_nextsize`/`bk_nextsize` fields remain garbage in a small free chunk.

We have two ways to implement this.
  - ***Method-1***: Set the required members appropriately and the not required ones `NULL`.
  - ***Method-2***: Only set the required members and leave the rest.

---

Let's calculate the memory footprint in both the methods for an in-use chunk.

In method-1, we have to allocate full 48 bytes for the metadata, followed by the payload memory. This wastes 32 bytes per in-use chunk, regardless of small or large. Visually:
```
-----------------------------------------------------------------
| prev_size | mchunk_size | fd | bk | fd_nextsize | bk_nextsize | user-mem
-----------------------------------------------------------------
```

In method-2, only the initial 16 bytes in the `malloc_chunk` are usable, followed by the payload memory. Visually:
```
-----------------------------------------------------------------
| prev_size | mchunk_size | fd | bk | fd_nextsize | bk_nextsize |
-----------------------------------------------------------------
                          ^
                          user-mem starts here
```

Method-2 prevents the wastage of the trailing 24 bytes. Those fields still exist, but they are garbage (as intended).

---

Clearly, method-2 wins, but I am not able to understand ***how the trailing fields can be reused?*** The answer is quite simple, though.

  - As humans, we can distinguish whether a piece of memory belongs to a struct or an int. But we also know that the address space is flat and there is no notion of data types. The only thing that matters is how we ***interpret*** those bytes.
  - For the allocator, only the initial two fields are meaningful in an "in-use" chunk. It doesn't matter if we set the remaining fields `NULL`, or reuse them. The allocator never looks at those bytes. That's why the trailing fields could be reused.

---

**--- Important Note ---**

*If you are an experienced person, the note may not concern you. You can skip this part.*

It took me several weeks just to comprehend `malloc_chunk` properly, and multiple rewrites before the understanding could be published.

It is possible that you got it in your first attempt. However, if you don't, remember that you are not alone in this.

I have not noticed that I unconsciously prevent myself from understanding the author's design because I think that the problem should be solved differently. I do the following to deal with this issue.
  - Acknowledge the author's design even if I have to do it against my will.
  - Write my design.
  - Contradict my design with the author's design and notice which performs better.

Either this act reveals why the author chose a particular solution, or I'll end up finding a better one. Either way, it's a win.

---

Method-2 is how glibc does it. After reserving memory for the request, the metadata chunk is placed at the starting bytes and the pointer that is returned to the process is where the `fd` field starts in the struct.

This is how a single `malloc_chunk` exists. But a standard Linux process calls malloc and free several times. This repeated allocation-deallocation fragments the memory and creates a problem for the allocator.

# Fragmentation

When memory is allocated-deallocated multiple times, it creates gaps of "***unused memory***" in the address space. This increases the pressure on physical memory as the freed chunks are still backed by physical memory but not utilized by the process.

The immediate solution is to release the memory back into the system. We can do this in two ways.

"*Release the physical backing but keep the virtual address range. When the address range is accessed again, the system backs the memory again.*"
   - The `madvise` syscall with `MADV_DONTNEED` or `MADV_FREE` is used to tell the kernel that the application no longer needs the data in this range, allowing the kernel to immediately or lazily reclaim the physical pages while keeping the virtual allocation fully intact. It can be used on both the sbrk and mmapped regions.
   - `mmap` with `MAP_FIXED` and `PROT_NONE` can achieve a similar effect but is restricted to mmap only.

---

"*Release both the physical memory and the virtual address range. This entirely tears down the allocation. `munmap` and negative `sbrk` can be used to do this.*"

---

However, there are limitations to this.
  - All the four syscalls above require page granularity. We can not release memory arbitrarily.
  - While `mmap`/`munmap` strictly operate on page-basis, sbrk is arbitrary in nature. But negative arguments alone aren't enough, unless they cross a page boundary. If the decrement leaves the break inside the same page, the program break is virtually decreased, but that page remains mapped and its data is completely untouched and accessible.

As we will read the trimming functions in malloc, we will find a few other complications involved here.

A standard page is 4-KiB in size, but a size like 3000 bytes is not small either. But the available options can be used here. Therefore, we need a way to manage small fragments of memory.

---

The fragmented memory can exist in two layouts, depending on the malloc-free sequence.
  - In-use and free chunks in an alternating sequence, like this:
    ```
    {...., in-use, free, in-use, free, ....}
    ```
  - Multiple free chunks adjacent to each other, like this:
    ```
    {...., in-use, free, free, in-use, ....}
    ```

Suppose two "**distant chunks**", each of size 48 bytes, were freed. Now we have 96 bytes of memory which can be reused. The next malloc request asked 75 bytes. Can we reuse those 96 bytes?
  - No, because those 96 bytes are not contiguous.
  - That is fragmentation in layout-1.

Suppose two "**adjacent chunks**", each of size 48 bytes, were freed. Now we have 96 bytes of memory which can be reused. The next malloc request asked 75 bytes. Can we reuse those 96 bytes? 
  - No. The memory is contiguous yet fragmented across two chunks.
  - That is fragmentation in layout-2.

---

Layout-1 fragmentation can be reduced only when there is a free chunk that can satisfy the request.

Layout-2 fragmentation can be reduced by merging adjacent free chunks into one single chunk.
  - In the example above, the process must request a size that a 48 bytes free chunk can be used for. But if the two free chunk are merged, the possibility of the resulting chunk getting utilized increases multiple times.
  - In simple words, we have reduced layout-2 fragmentation to layout-1.

---

We need two things to implement coalescing.
  1. A way to identify if the next/previous chunk is free.
  2. If the next/previous chunk is free, we need a way to reach that chunk from the current chunk.

> A computer scientist and mathematician named **Donald Knuth** has discussed multiple strategies to manage dynamic memory. One of these strategies describe a way to embed coalescing support directly in the chunk metadata. It is discussed in his book *The Art Of Computer Programming, Volume 1: Fundamental Algorithms*, paragraph 4, page 440. It is called, **the boundary tag method**.

The same strategy is implemented here.

---

# Coalescing

Coalescing can be implemented in two ways.
  - **Forward coalescing**, where we coalesce the n<sup>th</sup> chunk with the (n+1)<sup>th</sup> chunk.
  - **Backward coalescing**, where we coalesce the n<sup>th</sup> chunk with the (n-1)<sup>th</sup> chunk.

Forward coalescing is simple to implement. Just add the size of the current chunk to its pointer and we are on the next chunk. But backward coalescing is complicated as we don't know the size of the previous chunk.

For this reason, `malloc_chunk` comes with `mchunk_prev_size`. This field stores the size of the previous chunk that we can use to offset back to the (n-1)<sup>th</sup> chunk. This answers why the size of the previous chunk (in memory) is stored, but not the next chunk.

Now that we have reached the next/previous chunk, we have to find if they are free. To do this, we use `mchunk_size`. Let's understand how.

---

## The second use of 'mchunk_size'

As discussed previously, the allocator touches some metadata to the payload memory. This metadata obviously requires some memory.

The allocator calculates the total memory required to service a request, which includes the payload memory (the amount requested) and the metadata overhead. The resulting value is aligned to an alignment boundary, which is 8 bytes in x86 and 16 bytes in x86-64.

That means, the size is always a multiple of 8, regardless of the architecture (32-bit or 64-bit). That means, the lower 3 bits in `mchunk_size` are always **unused**. We can use these bits to store state information. It does change the size value, but we can mask the lower 3 bits to get the actual size.

Here is a description of these bits.

| Bit | Bit Name             | State     | Description |
| --- | :-------             | :----     | :---------- |
|  0  | `PREV_INUSE` (P)     | 0 (clear) | The (n-1)<sup>th</sup> chunk is free and the prev_size of the n<sup>th</sup> chunk stores the size of the (n-1)<sup>th</sup> chunk. |
|     |                      | 1 (set)   | The (n-1)<sup>th</sup> chunk is in-use and the prev_size of the n<sup>th</sup> chunk doesn't store the size of the (n-1)<sup>th</sup> chunk. |
|  1  | `IS_MMAPPED` (M)     | 0 (clear) | It is a normal chunk belonging to an arena. |
|     |                      | 1 (set)   | It is an mmapped chunk. |
|  2  | `NON_MAIN_ARENA` (A) | 0 (clear) | The chunk belongs to the main arena. |
|     |                      | 1 (set)   | The chunk belongs to a non-main arena. |

Right now, only the 0th bit concerns us. The remaining two bits aren't discussed here.

Now we can implement coalescing through the boundary tag method.

---

## The Boundary Tag Method

***Boundary tag method is a dynamic memory management technique, where the size is stored both in the head and the tail of the chunk.***

It suggests to have metadata before and after the payload memory. `malloc_chunk` compensates for what comes before the payload memory, where the trailing size field comes from?

If we create a separate struct, like `malloc_chunk_trail`, and put it after the payload memory, that creates bookkeeping havoc. This is where the next confusing trick is implemented.

---

***How about putting another size field in the front of `malloc_chunk` and use it as a property of the previous chunk?***
  - We don't have to create a new metadata struct.
  - The first chunk's `mchunk_prev_size` would be a waste, as nothing exist before it. But we are ready for that tradeoff.
  - There will be some sort of dummy chunk in the end to compensate for the last usable chunk.

The layout would look something like this:
```
Structurally ->  [ Chunk1 Memory                                   ][ Chunk2 Memory                                  ][ Dummy Chunk                              ]
                -----------------------------------------------      ----------------------------------------------       ----------------------------------------------
                | prev_s | chunk_s | fd | bk | fd_ns | bk_ns | .... | prev_s | chunk_s | fd | bk | fd_ns | bk_ns | .... | prev_s | chunk_s | fd | bk | fd_ns | bk_ns |
                -----------------------------------------------      ----------------------------------------------       ----------------------------------------------
Functionally ->           [ Chunk1 Memory                                  ][ Chunk2 Memory                                   ]
```

***Therefore, the `mchunk_prev_size` of the n<sup>th</sup> chunk is functionally a part of the (n-1)<sup>th</sup>chunk. Structurally, it is still a part of the n<sup>th</sup> chunk.***

  - When the `PREV_INUSE` bit is clear, the previous chunk is free and the `mchunk_prev_size` of the current chunk stores the size of it.
  - When the `PREV_INUSE` bit is set, the previous chunk is in-use and bytes of the `mchunk_prev_size` of the current chunk functionally represent its payload memory.

This is boundary tag method.

---

To complete our understanding, we have to explore one last piece, ***the size model***.

# The Size Model

Everything in glibc-malloc is directly or indirectly related to size. The allocator has a size model to work with sizes efficiently.

The size model is about making the "***request size***" usable as per the bookkeeping system.

The size model is described using macros. It contains two types of macros.
  - Macros that resolve to numeric values.
  - Macros that are named blocks of code.

---

malloc() takes a size (in bytes) as argument.

Each data type has a maximum addressable limit. We need a type which can contain the largest addressable value in an architecture. That is, `size_t`.

| Arch | size_t |
| :--- | :----- |
| 32-bit Linux | 4 bytes |
| 64-bit Linux | 8 bytes |

***`size_t` and the clever use of preprocessing is the basis of an architecture-agnostic implementation.***

---

But `size_t` is not used directly. It is masked with a type definition.
```c
#define  INTERNAL_SIZE_T  size_t
```
This makes `size_t` a tunable parameter.

***A parameter whose value can be tweaked at compile-time is called a tunable parameter (or, a tunable).*** Multiple such parameters are provided for the programmers to customize malloc to their needs.

`size_t` being a tunable creates a third possibility, where pointers are 8 bytes and `INTERNAL_SIZE_T` is 4 bytes wide. In this case,
  1. the metadata size per in-use chunk is shrunk by half, reducing the overall memory footprint. Both `mchunk_prev_size` and `mchunk_size` occupy 4 bytes each, totaling to 8 bytes.
  2. the maximum request size is reduced drastically to ~4 GiB of virtual memory (that's what 32-bits can represent).

`INTERNAL_SIZE_T=4` doesn't create possibility for padding bytes in the struct as each member is naturally aligned to its own width given the layout order.

But I am not sure why this configuration actually exist.

---

To summarize, there are the three configurations the allocator must handle.

| Config | `INTERNAL_SIZE_T` | Pointer width |
| :----- | :---------------- | :------------ |
| 1 | 4 bytes | 4 bytes |
| 2 | 8 bytes | 8 bytes |
| 3 | 4 bytes | 8 bytes |

These are the macros that implement this size model.

## SIZE_SZ

It is the width of `size_t` on the target machine's architecture.
```c
/* The corresponding word size. */
#define SIZE_SZ  (sizeof(INTERNAL_SIZE_T))
```

| Arch   | SIZE_SZ |
| :---   | :------ |
| 32-bit | 4 bytes |
| 64-bit | 8 bytes |

## CHUNK_HDR_SZ

It is the minimum metadata bytes required regardless of the type of chunk, i.e. `mchunk_prev_size` and `mchunk_size`.
```c
#define CHUNK_HDR_SZ    (2 * SIZE_SZ)
```

| Arch   | CHUNK_HDR_SZ |
| :---   | :----------- |
| 32-bit | 8 bytes |
| 64-bit | 16 bytes |
| INTERNAL_SIZE_T=4 | 16 bytes |

***Note: It is the "structural overhead", not functional overhead. Because, if it were functional, we wouldn't count `mchunk_prev_size`, as it is a property of the previous chunk.***

## MIN_CHUNK_SIZE

It is the size of the "structurally" smallest possible chunk in an architecture.
```c
#define  MIN_CHUNK_SIZE  offsetof(struct malloc_chunk, fd_nextsize)
```

`offsetof` is an ANSI C macro, defined in `stddef.h`, used to determine the byte offset of a specific member from the beginning of its parent structure.

Let's derive it manually for 64-bit.
```
  0-7 bytes -> mchunk_prev_size
 8-15 bytes -> mchunk_size
16-23 bytes -> fd
24-31 bytes -> bk
32-39 bytes -> fd_nextsize
40-47 bytes -> bk_nextsize
```
So, `MIN_CHUNK_SIZE` would be 32 on 64-bit.

| Config # | MIN_CHUNK_SIZE |
| :------- | :------------- |
| 32-bit   | 16 bytes |
| 64-bit   | 32 bytes |
| INTERNAL_SIZE_T=4 | 24 bytes |

## MALLOC_ALIGNMENT

It defines the minimum alignment for in-use chunks.
```c
#define MALLOC_ALIGNMENT  (                  \
  (2 * SIZE_SZ) < __alignof__(long double)    \
  ? __alignof__(long double)                 \
  : 2 * SIZE_SZ
)
```

`__alignof__` is an operator that returns the alignment requirement of a data type (in bytes).

| Arch   | \_\_alignof__(long double) |
| :---   | :------------------------- |
| 32-bit |  4 bytes |
| 64-bit | 16 bytes |

The macro becomes:
```c
// 32-bit (size_t=4)
MALLOC_ALIGNMENT == (8 < 4)  ?  4  :  8  == 8

// 64-bit (size_t=8)
MALLOC_ALIGNMENT == (16 < 8)  ?  16  :  16  == 16
```

In either case, the alignment is kept twice the maximum addressable width.

malloc is a general purpose allocator. It is unaware of what the caller will store in the returned memory. So it ensures that the returned memory is aligned to all the fundamental types the C standard supports.

| Config # | MALLOC_ALIGNMENT |
| :------- | :--------------- |
| 32-bit   |  8 bytes |
| 64-bit   | 16 bytes |
| INTERNAL_SIZE_T=4 | 16 bytes |

## MALLOC_ALIGN_MASK

`MALLOC_ALIGNMENT` is a power-of-2 value and `MALLOC_ALIGN_MASK` is the bit mask of it.
```c
#define  MALLOC_ALIGN_MASK  (MALLOC_ALIGNMENT - 1)
```

`MALLOC_ALIGN_MASK` has the lowest 4 bits set which are clear in `MALLOC_ALIGNMENT`.
```bash
MALLOC_ALIGNMENT  = 16 = 0001_0000
MALLOC_ALIGN_MASK = 15 = 0000_1111
```

It is used in a variety of bitwise operations.
  1. Check if a size/address is aligned to the alignment boundary (the lower 4-bits in the addr/size must be all 0 to yield a zero against all 1s of the bit-mask).
     ```c
     (addr & MALLOC_ALIGN_MASK) == 0  :=  aligned
     (addr & MALLOC_ALIGN_MASK) != 0  :=  misaligned
     ```
  2. Round a size/address up to the next alignment boundary.
     ```c
     -> (size + MALLOC_ALIGN_MASK) & ~MALLOC_ALIGN_MASK
     -> (34 + 15) & ~15
     -> 49 & -16
     -> 48
     ```
  3. Round a size/address down to the previous alignment boundary.
     ```c
     -> size & ~MALLOC_ALIGN_MASK
     -> 41 & ~15
     -> 32
     ```
---

| Config # | MALLOC_ALIGN_MASK |
| :------- | :---------------- |
| 32-bit   |  7 |
| 64-bit   | 15 |
| INTERNAL_SIZE_T=4 | 15 |

## MINSIZE

It is the smallest size malloc can return.
```c
#define MINSIZE    (unsigned long)( \
  ( (MIN_CHUNK_SIZE + MALLOC_ALIGN_MASK) & ~MALLOC_ALIGN_MASK)
)
```

We know that an in-use chunk requires `(2 * SIZE_SZ)` bytes for storing metadata and when it is freed, it requires `(2 * ptr_width)` bytes to manage `fd`/`bk`.

A request of size greater than `MINSIZE` already requests enough bytes such that the pointer fields can be managed. However, smaller sizes, like 5 bytes or 10 bytes don't request enough bytes. That's why `MINSIZE` exists.

| Config | MINSIZE  |
| :----- | :------  |
| 32-bit   | 16 bytes |
| 64-bit   | 32 bytes |
| INTERNAL_SIZE_T=4 | 32 bytes |

`MIN_CHUNK_SIZE` is the size of the structurally smallest chunk possible in an architecture. `MINSIZE` is the actual smallest chunk size possible in an architecture considering alignment constraints.

The values happen to be equal in the first two configurations because the struct layout is aligned with the alignment constraints. However, it broke with `INTERNAL_SIZE_T=4`.

---

## Macro #7 -> request2size

This macro is responsible for enforcing the size model on the requested size.

**It is the closest we can "statically" see the boundary tag method in implementation.**

It is defined as:
```c
#define request2size(req)    (                    \
  (req + SIZE_SZ + MALLOC_ALIGN_MASK < MINSIZE)    \
  ? MINSIZE                                      \
  : (req + SIZE_SZ + MALLOC_ALIGN_MASK) & ~MALLOC_ALIGN_MASK    \
)
```

Let's take an example on 64-bit architecture: `malloc(20)`.
  - (20 + 8 + 15) < 32
  - (43 < 32); So the false case is chosen.
  - aligned_size = (20 + 8 + 15) & ~15
  - aligned_size = 43 & ~15 = 32 bytes.

Among these 32 bytes, we need 20 bytes of usable memory. That leaves us 12 bytes of memory for metadata. But metadata requires 16 bytes of space. We are short on 4 bytes. Visually:
```
      8           8        8    8
-----------------------------------------------------------------
| prev_size | mchunk_size | fd | bk | fd_nextsize | bk_nextsize |
-----------------------------------------------------------------
                          ^ ptr_to_mem
```

But in the boundary tag discussion, we have agreed on a dummy chunk in the end.
```
      8           8        8    8
-----------------------------------------------------------------
| prev_size | mchunk_size | fd | bk | fd_nextsize | bk_nextsize |
-----------------------------------------------------------------
                                          8
                                    -------------------------------------------------------------------
                                    | prev_size   | mchunk_size | fd | bk | fd_nextsize | bk_nextsize |
                                    -------------------------------------------------------------------
                          ^ ptr_to_mem
```

`request2size` deliberately leaves out `SIZE_SZ` bytes of memory in every chunk because the payload memory of a chunk is allowed to "spill over" and occupy the `prev_size` of the next chunk. For the last allocated chunk, the `prev_size` is provided by the top chunk.

This dummy chunk has a name. It is called "**the top chunk**", which is a special chunk that sits after all the malloc-ed chunk. It is not discussed here.

---

## chunk2mem

`chunk2mem` takes a pointer to a chunk, casts it to `char*` (for pointer arithmetic) and add "chunk header size" to it.
```c
#define chunk2mem(p)    ( (void*)((char*)(p) + CHUNK_HDR_SZ) )
```

This will land us at the `fd` field in the struct, where the payload memory starts in an in-use chunk, as discussed.

Similarly, we have `mem2chunk`, which takes a pointer to the payload memory and returns a pointer to the metadata struct associated with it.

---

# Dynamic Analysis

It is a dense writing and everything discussed here is completely derived from the source.

A Docker environment is provided so that you can verify things yourself, please checkout the experiments in the [glibc-malloc-expedition](https://github.com/aggrawal-ankur/glibc-malloc-expedition/tree/main/dynamic-analysis/chunk) repository.

All experiments target 64-bit GNU/Linux.

---

If you have any suggestions, or something feels incorrect to you, please feel free to reach out to me. All words are welcomed.

Thank you.
