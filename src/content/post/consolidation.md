---
title: "The process of consolidating chunks in malloc."
publishDate: "2026-09-17"
# updatedDate: "2026-M-D"
description: "This is an in-depth exploration of the mechanism by which chunks are consolidated in malloc in glibc-2.43."
tags: [ glibc-malloc ]
---

## Note For The Reader

This writing was originally published in the [glibc-malloc-expedition](https://github.com/aggrawal-ankur/glibc-malloc-expedition) repository of mine.

I have polished it further and published here to keep all of my writings in one place.

---

When the allocator is requested to free a chunk, say `p`, the allocator simultaneously explores the possibility of consolidation.

Three scenarios are possible here.
  1. ***Backward consolidation only***, where (p) is merged into (p-1).
  2. ***Forward consolidation only***, where (p+1) is merged into (p).
  3. ***Full consolidation***, where (p) is extended into (p-1), followed by (p+1) extending into the resulting one. The (p-1) pointer will point to the consolidated memory.

---

The process is quite simple.
  - To consolidate backward, we check the `PREV_INUSE` bit of (p) to find if the (p-1) chunk is free. If free, we merge the (p-1) and (p) chunks into (p-1).
  - To consolidate forward, we check the `PREV_INUSE` bit of the (p+2) chunk to find if the (p+1) chunk is free. If free, we merge the (p) and (p+1) chunks into (p).

So, backward consolidation requires access to (p-1) and (p) chunks, while forward consolidation requires access to (p), (p+1), and (p+2) chunks.

---

***Please note that***
  - backward consolidation is not defined for the first chunk, and
  - the last chunk that can be consolidated is the one at the high end of the usable memory.

---

## The Three Edge Cases

***"The chunk bordering the top chunk."***

  - When (p) borders with the top chunk, the state of memory is `[p, (p+1) == top]`.
  - Here, forward consolidation will lead to the merger of the top chunk and (p) into (p). So we have to update `av->top` to point to (p) and unlink (p) from its bin.
  - Forward consolidation requires access to the (p+2) chunk, but there is no chunk after the top chunk. So we have to make this a special case.

---

***"A new heap is created in a non-main arena."***

  - In non-main arenas, when the existing heap segment (`heap_info`) can not be used to service the request, a new heap is created, followed by the creation of the new top chunk.
  - The old top is regularized and binned appropriately so that it can be used like a normal chunk and `av->top` is updated to the new top chunk.
  - The regularized chunk can undergo consolidation, but only backward consolidation is defined, as heap segments can not be merged.
  - Normally the last chunk is specially identified by `av->top`. When there is no top chunk in a heap segment, how we are going to identify if a chunk is at the high end of the current heap segment?

---

***"A positive foreign sbrk is detected in the main_arena."***

  - In this event, the existing top chunk is regularized and a new top chunk is created after the memory that the allocator doesn't own.
  - Now the main_arena memory looks like this: 
    ```
    [allocate_owned, foreign_sbrk, allocator_owned_new]
    ```
  - Because the allocator doesn't own the memory after the regularized chunk, forward consolidation is not defined. But how we will identify this regularized chunk?

---

To summarize, we have to handle two cases.
```bash
# [CASE 1]: (p) borders with the chunk at the high end 
#            of the usable memory.
[p, (p+1) == high_end_chunk, (p+2) == unavailable].

# [CASE 2]: (p) is the last chunk in the usable memory.
[p == high_end_chunk, (p+1) == unavailable, (p+2) == unavailable].
```

---

## Thinking About The Solution

When (p) is the second last usable chunk, we have a deficit of one chunk. When (p) is the last usable chunk, we have a deficit of two chunks. Therefore, we need two chunks at max to solve this problem. Let's call them E1 and E2 (extra chunk 1 and 2).

After placing these extra chunks in the end of the memory, the state would be:
```bash
[p, (p+1) == high_end_chunk, (p+2) = E1, (p+3) = E2]

[p == high_end_chunk, (p+1) = E1, (p+2) = E2]
```

---

***What should be the type of these chunks?***

> In-use chunk; It prevents them from getting consolidated.


***How much space is required for these chunks?***

> Only the first two fields are important in an in-use chunk, so `CHUNK_HDR_SZ` bytes is enough.


***What will be the state of the `PREV_INUSE` bit?***

> Set (1).

---

Let's see if this solution works.

```bash
# [CASE 1]
[p, (p+1) == high_end_chunk, (p+2) == E1]
```
  - We have checked the `PREV_INUSE` bit of the (p+2) chunk to know if the (p+1) chunk is free.
  - It may or may not be free. So, forward consolidation is possible for (p).

```bash
# [CASE 2]
[p == high_end_chunk, (p+1) == E1, (p+2) == E2]
```
  - We have checked the `PREV_INUSE` bit of the (p+2) chunk. It will always be in the set (1) state.
  - Therefore, for the last usable chunk, the next chunk is always "in-use", preventing forward consolidation.

---

That means, the solution works.

The last question we need to ask is, ***where does the space for these chunks come from?***

> It is carved out from the old top chunk.

We need a total of `MINSIZE` bytes to setup these extra chunks. Based on the size of the old top chunk, we have to do a little more work.

If `(top_size == MINSIZE)`
  - the top chunk has exactly as many bytes as it is required to setup these extra chunks.
  - there is no remainder to regularize.

If `(top_size >= (2 * MINSIZE))`
  - the top chunk has twice as many bytes as it is required to setup the extra chunks.
  - the remainder is functionally a valid chunk, so it is regularized.

If `(top_size == (MINSIZE + CHUNK_HDR_SZ))`
  - the remainder is functionally invalid. It has `CHUNK_HDR_SZ` bytes, but the smallest possible chunk has `MINSIZE` bytes in it.
  - the remainder can not be regularized, so the extra bytes are carried by the first extra chunk.

---

`GLIBC` calls these extra chunks **fenceposts**.

However, I have noticed some inconsistencies about fenceposts.

## Inconsistencies Related to Fenceposts

Fenceposts are used both by the main_arena and the non-main arenas. So it is reasonable to assume that the setup is the same. However, it is not.

### \[\#1] Condition Check.

The non-main arena path checks `(old_size >= MINSIZE)`, while the main_arena path checks `(old_size != 0)`.

The non-main arena path calls \_int\_free\_chunk only when `(old_size >= MINSIZE)`. But the main_arena calls it unconditionally.

### \[\#2] Fencepost-1 mchunk_size

The size of fencepost-1 is either `CHUNK_HDR_SZ` bytes or `2 * CHUNK_HDR_SZ` bytes.

The setup in non-main arena acknowledges this fact, but the main_arena setup doesn't.

### \[\#3] Fencepost-2 mchunk_size

The mchunk_size of fencepost-2 is `CHUNK_HDR_SZ` bytes in the main_arena path and 0 in the non-main arena path.

### \[\#4] The prev_size Confusion

Both the pathways have the `PREV_INUSE` bit set in both the fenceposts.

It is understandable that the size of fencepost-1 is not fixed, so fencepost-2 must know its actual size.

But `mchunk_prev_size` is valid only when the `PREV_INUSE` bit is clear. The main_arena acknowledges this, while the non-main arena sets the `mchunk_prev_size` of fencepost-2 with the size of fencepost-1.
