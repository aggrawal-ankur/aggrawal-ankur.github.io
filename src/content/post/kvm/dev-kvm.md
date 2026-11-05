---
title: "What is /dev/kvm in KVM? <symlink>"
publishDate: "2026-10-26"
# updatedDate: "2026-M-D"
description: "This text aims to understand the /dev/kvm device used in KVM."
tags: [ linux-kvm ]
draft: true
---

# Premise

A text about KVM is, kind of incomplete, if it doesn't mention `/dev/kvm`. Almost all elementary writings about KVM has `/dev/kvm` in them.

The articles that I have read on the internet defines `/dev/kvm` as a "***character device file***" and immediately proceed to use it. The definition is not incorrect, but it is useful only to the people who already understand what a character device file (or a file, in general) is, and I am not one of them.

For me, files are either "text" or "binary". From that standpoint, the definition of a file seems pretty clear. However, when I saw the types of files in Linux, I was surprised. It didn't took much before I realized that they don't fit the definition I was aware of.

I realized that I don't understand "***what a file means to the Linux kernel***", let alone knowing the three words that define `/dev/kvm`.

Therefore, this writing is an attempt to understand files in Linux so that I can understand `/dev/kvm` and move in my virtualization journey.

I prefer long writings, instead of a series of short articles. This is a significant time, energy and attention investment for a reader. Therefore, below are some notes for you so that you can evaluate if this writing is worth your valuable time, energy and attention.

# Notes For The Reader

1. I have used the [*Linux v7.2.12*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/?h=v7.2.12) source tree as the reference for this exploration.

2. This writing explores various structures in the virtual file system (VFS). However, VFS is vast and this writing not an exhaustive guide about it.

3. Many of the data structures that are relevant to this discussion have a lot of fields in them. Many fields, however, were observed to have no relevance in this pursuit. Therefore, they are omitted. The rest of the members follow the same ordering as in the original structure.

4. Exploring the source is an exhaustive task. So I expect the code to be in a certain formatting style. Therefore, I have formatted the structures to my liking.

5. Structures in the kernel are observed to have two kinds of comments. 1) A huge block of multi-line comment explaining each member before the structure is defined, and 2) comments tied to specific members in a struct. Some comments were useful, others were not. I have removed the comments entirely.

6. Steps 3, 4 and 5 were taken to improve the signal. Formatting the source code and removing the comments doesn't change the implementation. The code is not altered by any means.

7. For all the struct definitions, links to the official [*git.kernel.org*](https://git.kernel.org/) web interface are provided to access the original definitions. All links are accessible to the best of my knowledge. However, a `502 Bad Gateway` error is observed sometimes and it gets resolved automatically on a refresh.

8. This is purely an investigative work. I have used the source code to build this understanding and it is possible that my interpretation of certain details is not how the kernel authors/maintainers perceive them. If my interpretation feels incorrect, I welcome your perspective and corrections.

9. While I name this an *exploration (or expedition)*, it is important to understand that it doesn't mirror how I understood it. I have gone astray multiple times. If I mentioned everything in its raw form, it's meaning and worth will be questionable to you. Therefore, it has the exploratory nature but it is still guided by a version of me who has already achieved the objective. Also, it has gone through editorial work which, by design, removes some of the rawness.

# Where to start this exploration?

I am taught to explore the definition of a thing, followed by its types. However, that strategy didn't worked here. The reason is the wide mismatch between what I think is a file and what it means to the Linux kernel. 

To identify that gap, I have explored some questions and eventually, I have come to the realization that exploring the types of files in Linux is the real entrypoint to understand this gap. After that, we can think about files.

Therefore, we will start from the types of files in Linux.

# Types of Files in Linux

Briefly, there are seven types of files in Linux.

| Sr. | File Type | Symbol | Description |
| --- | --------- | ------ | ----------- |
| 1 | Regular File | "-" | or an ordinary file, contains data and can be read from or written to. |
| | | | They come in different types. For example: text files (contains human-readable data), binary files (contains machine-readable data). |
| 2 | Directory File | "d" | or folders, are files that contain references to other files. |
| 3 | Link File | "l" | is a file that points to another file. They come in two types: *hard links* and *soft links*. |
| 4 | Character Device File | "c" | are files that represent devices capable of sending and receiving data character-by-character. |
| | | | Keyboards and serial ports;<br>`/dev/null`, `/dev/tty`, etc. |
| 5 | Block Device File | "b" | represent devices that transfer data in fixed-size blocks (e.g., hard drives, SSDs). |
| 6 | Pipe | "p" | is used for inter-process communication, streaming data from one process to another. |
| 7 | Socket | "s" | is used for data exchange between processes, locally or over a network. |

CHANGE THE DEFINITION OF CHARACTER DEVICE FILES TO ACCOMMODATE THE FACT THAT KVM IS THAT AS WELL BUT NO CHARACTERS ARE INVOLVED THERE.

> *The "symbol" attribute is used by `ls`.*
> *"Block devices", "pipes", and "sockets" aren't relevant to this pursuit, so they are not discussed.*
> *I am aware of the saying "everything is a file", however, it will not be explored here.*

---

The list is quite strange, is it? If the list gave you questions you can't articulate yet, it did its job.

I am sure we don't have to understand the list to realize that "*a file is more than human-readable or machine-readable bytes*". This realization has costed me a lot of time, energy and attention. All the time, I was trying to understand files from that standpoint.

Now that we have realized that a file is more than text or binary data, we can start exploring what a file is.

# What is a file?

The laptop market has two major players: "***MacOS***" and "***Windows***" laptops. Laptops with a Linux-based distribution out-of-the box aren't very common. But we can change the OS to a Linux-based distribution like Debian or Arch, or other OS like FreeBSD, without changing the hardware. ***This is possible because the hardware and OS are separate entities.***

Inside an operating system, we have multiple components, each designed to do a specific thing. There are drivers, a memory management system, processes and so on. 

It is obvious that we love "***choices***". However, not everything is swappable. For example, we can switch the OS, but not the memory management facility the chosen OS kernel provides.

---

Among these components there is a component called "***filesystem***". In simple words, a filesystem is designed to manage files.
> *Please note that this could be considered an over-simplification of the topic*.
> *In case you are looking for a precise definition, please checkout other resources.*

Because there are different types of files, there are different filesystems for them.

A "***storage filesystem***" is used when we want our data to persist across reboots on non-volatile storage hardware like SSD or HDD.

There are different ways to manage the same storage hardware, each with different goals. Therefore, there are different storage filesystems like ext4, xfs, btrfs, ntfs, and so on.

> *You can gloss over this [Wikipedia](https://en.wikipedia.org/wiki/File_system) article to get an idea of it, although it is not required.*

Different filesystems means the kernel must support them. But how?

To manage this variety of filesystems, allow new ones to be created without disturbing anything, and give userspace a single unified way to access files regardless of their type, the Virtual File System (VFS) was created.

The VFS abstracts different filesystems into one layer, allowing user space applications to call unified handlers and the VFS determines what needs to be done.

# Virtual File System (VFS)

The kernel defines a general filesystem abstraction. It comes with a "***feature set***" and the "***tradeoffs***" the kernel makes to bring that abstraction into existence.

This abstraction is like a "***contract***". If a "thing" can be modeled into that contract, the kernel can manage it as a "***file***".

The contract is defined such that it doesn't alter a filesystem's implementation, only the entrypoints are modeled into the contract. For example, take `read()`.
  - This abstraction is designed to "***read a file***".
  - Different filesystems organize data differently, so the mechanism of reading a file is supposed to vary too. All they have to do is to provide the function that does the job of "reading a file" to the VFS and the VFS maps it to its generic `read()` abstraction.
  - When a process opens a file and calls `read()` on it, the VFS identifies the details and routes the request to the relevant file system handler.

Therefore, VFS is best understood as a contract. The next step is to understand what this "contract" looks like.
> *The details below are what I am able to identify. It is possible that the VFS is more than this, but I can write about it only when I understand it, and exploring any more detail is beyond the scope of this exploration.*
> 
> *The details below are supposed to introduce you to the contract. They are explored in enough detail when the associated structures are introduced.*

## Feature Set

| Sr. | Feature Set | Brief Contract Details | Kernel Structures |
| :-- | :---------- | :--------------------- | :---------------- |
| 1 | **The Entity** | An identity for the resource. | `struct inode`,<br>`struct inode_operations` |
| 2 | **Access Control** | Standard permission checks before access is granted. | `struct inode` |
| 3 | **The Session** | An active, stateful dialogue between a process and an entity. Multiple sessions can be opened for the same resource. | `struct file` |
| 4 | **The Userspace Handle** | The userspace is provided an opaque, process-local integer token, protecting kernel address space. | `struct files_struct`,<br>`struct fdtable` |
| 5 | **Operations & Lifecycle** | A set of generic operations that are routed to implementation-specific handlers are provided. | `struct file_operations`,<br>`struct dentry` |
| | | Deterministic resource and hardware cleanup upon explicit close or abrupt process crash when the final reference drops. |

> *If the description of "entity" reads like "this is what a file is, isn't it?", I want you to hold it for a while. There is a reason I have used the term "entity", instead of "file".*

## Trade-offs

"***Syscall & Indirection Latency***"
  - Accessing a resource through a file forces a privilege boundary switch into the kernel, followed by multi-pointer dereference chains (fd $\to$ files_struct $\to$ struct file $\to$ struct inode $\to$ file_operations).
  - This adds microsecond latency that makes the file abstraction unsuitable for atomic, nanosecond-level operations (like CPU locks or high-frequency timers).

"***Kernel Memory Footprint***"
  - Each open file is stateful and consumes non-pageable kernel RAM (struct file, fdtable slots, locks, position cursors).
  - Managing hundreds of thousands of open descriptors imposes measurable memory overhead.

"***Interface Mismatch***"
  - The VFS operations fundamentally assumes a linear byte stream (read/write).
  - Resources that don't fit a stream of bytes (like virtualization engines or hardware accelerators) are forced to rely heavily on `ioctl()`, losing compile-time type safety and standard error contracts in favor of arbitrary integer commands and raw memory pointers.

"***Process-Local Confinement***"
  - A file descriptor is strictly local to the process that opened it.
  - It cannot be directly shared across address spaces through global pointers, and each process remains constrained by strict descriptor limits, requiring deliberate kernel mechanisms to scale or pass access.

"***Concurrency & Lock Contention***"
  - Threads in a process share the exact same open file descriptions (`struct file`) rather than receiving separate copies.
  - Because mutable state like the `read`/`write` cursor (`f_pos`) is shared, concurrent I/O operations from multiple threads on the same descriptor must synchronize behind kernel locks (`f_pos_lock`), causing lock contention and serializing operations that callers might expect to run in parallel.

---

We have unpacked a lot of things, so here is a short recap.
  - There are different types of files in Linux.
  - Different filesystems are required to manage different types of files. Moreover, there are different filesystems solving the same problem differently.
  - The OS kernel must support this variety of filesystems.
  - The kernel provides a generic file system abstraction, called the VFS, which is a contract and anything that can be modeled into it could be managed as a "file". The implementation of the filesystem remains unaffected.

So, what next? It's time to define files.

## What is a File?

A contract template by itself is just a set of rules. It only comes into reality when an agreement is made, right?

"***If the virtual file system is the contract, then a file is an active instance of that contract.***"

As I have mentioned this already, a file to me was "text" or "binary". But from the perspective of the Linux kernel, it is more than that, and it is so for valid reasons.

As humans, we can easily define a file as "***bytes of data on a hardware storage***". But how the kernel should implement it?
  - A set of abstractions are required to manage these "***bytes***".
  - That's why, the text in a text file is just one part of the story, and considering that the whole story is what the kernel wants the userspace to believe. The abstraction was designed to conceal details from the userspace.

Therefore, we need more than just the text to create a text file. We need "data" on the disk and some "metadata" that describes that "data" to facilitate operations on (or around) it.

---

We have the storage hardware where the bytes reside. We have some machinery to facilitate operations around it. Notice what the abstraction has done here. "***It has separated the machinery required to manage a file from what backs a file.***" We have seen this before, but where?"***The separation between an OS and the hardware.***"
  - A combination of hardware provides raw capabilities.
  - An OS taps into them and provides an easy way to utilize them.
  - Different OS tap on those capabilities and provide access to the same hardware resources in different ways with different goals in consideration.

Think about it. A text file stored on a physical storage device is backed by it. How about replacing the backing with something else?
  - Replace hardware storage with a table of names and pointers, and we get a directory file.
  - Replace hardware storage with a character-stream hardware device (like a serial port or terminal), and we get a character device file.
  - Replace hardware storage with the KVM kernel module (which taps into the VMX capabilities of the hardware), and we get `/dev/kvm`.
  - Replace hardware storage with a ring buffer in RAM, and we get a pipe.
  - Replace hardware storage with a network interface card (NIC), and we get a socket.

That's how we get those weird looking files. If an article talks only about files that are "***bytes backed by a storage hardware***", it is discussing only regular files, which is a fraction of the virtual file system.

It is noticeable that regular files provide a perfect starting point to understand VFS, but understanding regular files is not equal to understanding the VFS. They merely provide the right base to understand the rest of the files. The "***replace X with Y, and we get FILE_TYPE_Z***" simplification was possible only after we have understood "***regular files***".

---

So, what is a file? A file is an active instance of the VFS contract. The contract defines the properties and a file is a runtime instance of it.

While the picture reads complete, there is one piece that is missing.

## One Last Surprise

A file can be opened at multiple places simultaneously. If you have not tried it, you can try right now.

Now think about it. We have one file and there are multiple active instances of it. Each instance has its own independent state. How the kernel makes that possible?

So far, we have a resource that backs a file and some metadata about it. The third and the final component of a file is "***per-instance metadata***". This is what that allows a file to be opened at multiple places simultaneously.

Therefore, a file in Linux is made up of 3 components.
  1. The resource backing the file,
  2. The metadata describing the resource, and
  3. The metadata associated with an open file description.

Now what is surprising here?

  - In the Linux kernel's terminology, the metadata about the resource is called "***inode***", and the per-instance metadata is called "***file***". The term "***file***" means an instance of an "***inode***".
  - But conceptually, per-instance metadata, inode and the resource backing them together makes a file.

This terminology is why the feature set table uses the term "***entity***", not "***file***".

> *In my understanding, the terminology is loose here. However, I am interested to know why it was chosen in the first place.*
> 
> *As I have mentioned earlier, it is possible that the author(s) perceived it differently, which led to this terminology.*

"Please remember this distinction and save yourself headaches later."

---

That's the core of the VFS. Everything else is a detail that we can choose to explore if we need it.

> *As decided, block devices, pipes and sockets aren't relevant to this pursuit, so they are not discussed.*
> *Now we will move on to the details that does matter to us.*

# Kernel Structures and their Location

Following structures are relevant to this exploration.

| Structures | Files |
| ---------- | ----- |
| `inode` and `inode_operations` | [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| `file` and `file_operations` | [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| `dentry` | [*root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12) |
| `cdev` | [*root/include/linux/cdev.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/cdev.h?h=v7.2.12) |
| `miscdevice` | [*root/include/linux/miscdevice.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/miscdevice.h?h=v7.2.12) |
| `fdtable` and `files_struct` | [*root/include/linux/fdtable.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fdtable.h?h=v7.2.12) |

We will explore them one-by-one.

> *Please note that these structures don't exist in isolation. Their shape is heavily influenced by one another. This creates an inherent circular dependency. We can not fully understand a struct until others are introduced. Therefore, if a field don't make sense, don't force it.*

# Index Node (or inode)

***An inode is the kernel's master record for a single, distinct entity in a filesystem. It contains everything the OS needs to know about that entity, except its name.***
> *We will talk about this quirk in sufficient detail later.*
>
> *For now, the struct definition.*

Inodes are local to a filesystem. Therefore, the same inode number can exist in multiple filesystems. That means, an inode number is not enough to identify an inode. We need to know the filesystem it belongs to as well. However, that detail is not required here so we will skip it.

Note: Only 16/56 members are relevant here. The complete struct can be accessed at [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n762).

```c
struct inode {
  umode_t i_mode;

  kuid_t i_uid;
  kgid_t i_gid;

  const struct inode_operations	*i_op;
  u64  i_ino;

  union {
    const unsigned int i_nlink;
    unsigned int __i_nlink;
  };

  dev_t	i_rdev;
  loff_t i_size;

  time64_t i_atime_sec;
  time64_t i_mtime_sec;
  time64_t i_ctime_sec;

  u32	i_atime_nsec;
  u32	i_mtime_nsec;
  u32	i_ctime_nsec;

  union {
    const struct file_operations *i_fop;
    void (*free_inode)(struct inode*);
  };

  union {
    struct pipe_inode_info	*i_pipe;
    struct cdev	 *i_cdev;
    char         *i_link;
    unsigned      i_dir_seq;
  };
};
```

Below is a description of each field.

| Field | Description |
| :---- | :---------- |
| `i_mode` | Bitmask encoding the file type (e.g. `S_IFCHR` for character devices and `S_IFREG` for regular files) and file access permissions (e.g. `0660`). |
| `i_uid` | User ID of the file owner. |
| `i_gid` | Group ID of the file. |
| `i_op`  | Pointer to the `struct inode_operations`, defining metadata and directory tree functions. |
| `i_ino` | Inode number. A unique 64-bit identifier for this inode in its file system. |
| `i_nlink` | Number of hard links pointing to this inode. |
| `i_rdev`  | Device number (`dev_t`). Encodes `(Major, Minor)` numbers. Only meaningful for character and block device. |  
| `i_size`  | File size in bytes. For regular files, indicates content length; for device nodes like `/dev/kvm`, it is 0. |
| `i_atime_sec`, `i_atime_nsec` | Timestamp of the last file access (seconds and nanoseconds). |
| `i_mtime_sec`, `i_mtime_nsec` | Timestamp of the last file content modification (seconds and nanoseconds). |
| `i_ctime_sec`, `i_ctime_nsec` | Timestamp of the last inode status/metadata change (seconds and nanoseconds). |
| `i_fop` | Pointer to the `struct file_operations`. |
| `i_cdev`<br>in the last union | Pointer to `struct cdev`. Cached in the union once the character device is resolved during open. |
| `i_link`<br>in the last union | Pointer to the target path string when the inode represents a symbolic link. |


# An instance of an Inode

***A*** `struct file` ***represents an active, open session with an inode in memory.***

While the inode holds the permanent state of the entity, `struct file` holds the per-session state of whoever is currently interacting with it.

If a "file" is opened 10 times, there will be 10 instances of `struct file`, but the inode remains only 1.

**Note: Only 8/19 members are relevant. The complete structure can be accessed at [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1255).**

```c
struct file {
  fmode_t f_mode;
  const struct file_operations *f_op;

  void          *private_data;
  struct inode  *f_inode;
  unsigned int   f_flags;

  union {
    const struct path	f_path;
    struct path  		__f_path;
  };

  loff_t      f_pos;
  file_ref_t  f_ref;
};
```

Below is a description of each field.

| Field | Description |
| :---- | :---------- |
| `f_mode` | Bitmask of internal kernel access modes (e.g. `FMODE_READ`, `FMODE_WRITE`, `FMODE_LSEEK`). |
| `f_op`   | Pointer to the `struct file_operations` dispatch table. |
| `private_data` | Generic pointer used by drivers to attach per-instance state. |
| `f_inode` | Pointer to the underlying `struct inode`. |
| `f_flags` | Status and access flags passed from userspace to `open()` (e.g. `O_RDWR` and `O_CLOEXEC`). |
| `f_path`  | Contains the `struct dentry*` and `struct vfsmount*` for this open file. |
| `f_pos`   | Current byte offset in the file. Useful to regular files, directories and block devices. |
| `f_ref`   | A file struct can be shared across processes by the means of `fork()`, or file descriptors can be copied using `dup()` or `dup2()`, in which case, they point to the same file struct. This member counts those references. The `struct file` and underlying state is destroyed only when `f_ref` drops to 0. |


# Directory Files

The data blocks of a regular file consists of bytes, be it text or binary.

The data blocks of a directory file contains an array of records mapping human-readable strings to inode numbers. Therefore, "***a directory file is a file that associates human readable names to inodes***".

The `i_mode` of an `inode` for a directory file has the `S_IFDIR` bit set.

Every directory starts with at least two entries:
  1. `"."`, which maps to the inode corresponding to the directory file itself.
  2. `".."`, which maps to the inode of its parent directory file.

We can verify this by creating an empty directory and listing its contents.
```bash
$ mkdir empty-dir
$ ls -la empty-dir/

total 8
drwxrwxr-x 2 username username 4096 Nov  1 11:46 .
drwxrwxr-x 8 username username 4096 Nov  1 11:46 ..
```

Reading these entries from disk every single time we navigate a path would be very slow. Therefore, the kernel caches these directory entries in RAM using `struct dentry`.

## An Entry In A Directory File

An entry in a directory file is represented by a `dentry`, which literally stands for "directory entry".

**Note: Only 5/16 members are relevant to us. The complete structure can be accessed at [*root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12#n93).**

```c
struct dentry {
  struct dentry *d_parent;

  union {
    struct qstr __d_name;
    const struct qstr d_name;
  };

  struct inode *d_inode;
  union  shortname_store d_shortname;
  struct hlist_head d_children;
};
```

Below is a description of each field.

| Field | Description |
| :---- | :---------- |
| `d_name`   | The filename component of the entry. |
| | In `/path/to/a/file`, the `d_name` for the dentry representing `file` would be `"file"`; for `to`, it will be `to`. |
| `d_inode`  | Pointer to the associated `struct inode`. |
| `d_parent` | Pointer to the parent directory's dentry. |
| | For the root directory `/`, it points to itself. |
| | For `file` in `/path/to/a/file`, it points to the dentry of `a`. |
| `d_shortname` | An inline character buffer union. |
| | If the filename is short (like `"kvm"`), the string is stored directly inside the dentry struct to avoid a separate heap allocation. |
| `d_children` | Head of the linked list containing all child dentries for a particular directory file. |
| | Meaningful only if this dentry is for a directory file. For a leaf node like "kvm" in `/dev/kvm`, this list is empty. |

A `dentry` is probably the simplest structure in this exploration. However, if you have eagle-eyes, you may have noticed two things.
  1. The function of `d_children` is that of a pointer, but it is declared like a structure.
  2. How the kernel knows whether `d_name` or `d_shortname` points to the filename?
   
Let's talk about them.

---

`struct hlist_head`, the type of `d_children`, is declared in [*root/include/linux/types.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/types.h?h=v7.2.12#n208).
```c
struct hlist_node {
  struct hlist_node *next, **pprev;
};

struct hlist_head {
  struct hlist_node *first;
};
```

You can notice that it is a pointer. But why this indirection? Honestly, it never felt important so I have never explored it in the first place.

---

`struct qstr`, the type of `d_name`, is declared in [*root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12#n49) as follows.
```c
struct qstr {
  union { ... };
  const unsigned char *name;
};
```
> *The union doesn't concern us, so it is removed.*

`struct shortname_store`, the type of `d_shortname`, is declared in [*root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12#n84) as follows.
```c
union shortname_store {
  unsigned char string[DNAME_INLINE_LEN];
  unsigned long words[DNAME_INLINE_WORDS];
};
```

If the filename is short enough, it is written into `d_shortname.string` and the kernel sets `d_name.name` to point to `d_shortname.string`. Otherwise, `d_name.name` points to a heap-allocated string.

So, in either case, `dentry->d_name.name` points to the filename and the kernel need not to check it. *Pretty impressive, huh?*

However, in case the kernel needs to know this detail, it can use the following function defined in [*root/fs/dcache.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/dcache.c?h=v7.2.12#n356).
```c
static inline 
int dname_external(const struct dentry *dentry)
{
  return dentry->d_name.name != dentry->d_shortname.string;
}
```

I don't know about others, but reading kernel code can easily get boring when I am repeatedly seeing the same thing every single day. It gets worse when nothing makes sense and I am putting a lot of energy.

But the moment I see stuff like this and it clicks into place, I get such a dopamine rush that no cheap source can match, not even remotely.

---

***Note: How dentries are constructed and maintained is a detail that is not relevant to this exploration, so it is not explored here.***

# Why an inode lacks a filename?

A filename can be classified as metadata, and this is fixed metadata, so it should go into the inode. But based on what we have seen so far, that is not the case.

So, why filenames are detached from the rest of the metadata?
> *I have found two points that I can understand and reason about. That's what we are going to discuss. There can be more as well.*
> *However, please note that they may or may not be historically accurate. So please forgive me on that side.*

## 1. Fixed Size Inodes

A filesystem is not an exotic concept. It dates back to 60s and 70s, almost 50-60 years from today. Check this text written by [Paul Krzyzanowski](https://pk.org/articles/big-ideas-fs.html).

Similarly, the concept of inode is not exotic either. It dates back to 1969 during the creation of the first version of the UNIX operating system.

Systems these days have generous resources, be it memory or processing, which was not the case in history, at least in 50s, 60, or 70s, when these concepts were being designed. Therefore, the design had to be efficient. It can not be an after-thought.

From this perspective, separating the filename from the rest of the metadata in an inode is a great design decision as it keeps the size of an inode fixed.

I don't know about you, but I definitely don't understand how this separation keeps the size of an inode fixed. Checkout the full definition of [`struct inode`](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n762) with open eyes, no glossing over.

It doesn't require extra knowledge to understand that all the fields in an inode have deterministic values.
  - I am not saying "pre-defined" values.
  - I am saying that whatever domain of values a member is supposed to contain, the container is confirmed to be able to contain them. There is no situation where a member could be asked to contain a value it couldn't contain.

A filename, on the other hand, is not fixed. Files can be renamed as well. The size can not be determined at compile-time.

Therefore, by separating filename from the rest of the metadata, we can get a fixed size inode. The advantages of this is that finding inode `#N` on storage requires zero searching or tree traversal. It is pure arithmetic:
```c
byte_off = inode_table_base + (inode_number-1) * sizeof(struct inode);
```
> *Valid inodes start at 1, that's why the formula subtracts 1 to adjust the math.*

---

However, I have a counter argument. Before you read it, I want to say, "yes, it is as naive as I am".

Linux anyways doesn't allow filenames larger than 255 bytes. The upper bound is fixed. We can allocate an inline buffer at compile-time. No heap overhead.

If we are concerned about "internal fragmentation" or "memory pressure" (memory wastage, basically), I want to say that the kernel has many generic structs and many instances of them don't utilize them properly. Take `file_operations` for example. A lot of the fields are only relevant to files with read/write like capabilities. `/dev/kvm`, on the other hand, is mostly `ioctl` based. Doesn't this generalization waste memory? Yeah, generalization have cost, and we have acknowledged that in the tradeoffs section, but it shouldn't be used as an excuse here.

However, I understand that the authors/maintainers are magnitudes better than me, and if they have agreed on it, then there is a reason for it. I only want to know that reason because I am not able to think what it is.

Anyways, the separation was designed to deal with a real problem. But this separation has created way for a feature as well.

## 2. Multiple Names (Link Files)

We know that a directory file maps human-readable names to inodes. Is it possible to map more than one name to the same inode? Yes, and that's the concept behind "***link files***".

***A link file is a mechanism to create an alternate reference to an existing file without copying its contents.***

There are two kinds of links: "***hard links***" and "***soft links***". Soft links are also called symbolic links or symlinks, in short.
  - Mapping a human-readable name to an inode is what creating a hard link means.
  - Mapping a human-readable name to a path is what creating a soft link means.

Link files are conceptually equivalent to shallow copy in programming. For example, updating `y` in the snippet below updates `x` too, as both of them point to the same entity.
```c
#include <stdio.h>

int main(void){
  int  x = 4;
  int* y = &x;
  printf("x: %d\n", x);
  printf("y: %d\n", *y);

  *y = 8;
  printf("x: %d\n", x);
  printf("y: %d\n", *y);
}
```

The `i_nlink` field in an inode stores the count of hard links to it.
  - Creating a hard link is like preserving a reference to an entity. As long as there is at least one hard link, the entity will be accessible.
  - Deleting a hard link means decrementing `i_nlink`, just like creating one is incrementing it.
  - When `i_nlink` becomes 0 and there is no active file description pointing to the inode, the inode and the state associated with it will be deleted.

The main question is, "***why we would like to create multiple names for the same inode***"! The simplest use case of it is "***a shallow copy***".
  - Suppose a file's permanent location is A, but we need to access it from location B as well without copying its content?
  - All we have to do is to create a hard link to the file's inode at location B. Now, both A and B point to the same inode.

---

Soft links, on the other hand, are mapped to a path, instead of an inode. But how this is possible, as a dentry maps a name to an inode?

A hard link only creates a new dentry, but a soft link creates an inode as well. The name of the soft link maps to this freshly created inode.
  - Its `i_mode` has the `S_IFLNK` bit set.
  - The path to the target file is stored in the `i_link` field (the last union).

If the inode corresponding to the target path is deleted, or the dentry of the target path is deleted, the soft link will be effectively broken. What if the path is reinstated to a different inode? The symlink will start to work, but it is not intended to. How the kernel deals with this?
  - The kernel does nothing. That's the design.
  - A symlink only stores a raw text path. It doesn't care about the inode behind it.

The genius of this design is used heavily in version switching. It's like creating a permalink for a resource whose destination is not fixed by design.

---

Now, I leave this question to you.

Personally, the answers aren't very satisfactory to me. But the question is not something I must resolve to move forward, so I have left it for now.

# How open file descriptions are managed?

In the userspace, a file is generally opened by calling `open()` or similar functions. That happens inside a process. Therefore, the per-instance state is managed on a per-process basis.

**Note: 4/6 and 7/11 members are relevant. The complete structs can be accessed at [*root/include/linux/fdtable.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fdtable.h?h=v7.2.12#n24).**

```c
#define BITS_PER_LONG   64   /* root/include/asm-generic/bitsperlong.h */

#define NR_OPEN_DEFAULT BITS_PER_LONG

struct fdtable {
  unsigned int max_fds;
  struct file  __rcu **fd;
  unsigned long *close_on_exec;
  unsigned long *open_fds;
};

struct files_struct {
  atomic_t count;
  struct fdtable __rcu *fdt;
  struct fdtable fdtab;
  unsigned int next_fd;
  unsigned long close_on_exec_init[1];
  unsigned long open_fds_init[1];
  struct file __rcu * fd_array[NR_OPEN_DEFAULT];
};
```

Normally I prefer tables to explain struct fields. But the indirection here is absolutely crazy, which is why I am making an exception here.As a beginner, I am absolutely on your side. Indirection often feels ridiculous, until you know why it exists.

These structs are quite simple, but there is a problem that has made them complex. Once we understand that problem, we will understand this indirection. And the best part is that we have already seen this indirection at play, the worse part is that what we have seen is a miniature version of this, this makes the gap huge and we are not able to see the indirection at play immediately.

Let's start.
> *By the way, I recommend not focus on `__rcu`. It is not necessary.*

---

`fd_array` is a collection of `struct file*` pointers, where each pointer correspond to an open file description.
  - Since it is an array, each pointer is on an index. This index is what that is returned to the userspace by the name "***file descriptor***". Therefore, a file descriptor is an opaque, process-local integer that is returned to the userspace.
  - Whenever a process performs an operation using this integer, let's say `read()`, this integer is used to find the `struct file` instance corresponding to it, i.e. `files_struct->fd_array[fd]` and things continue afterwards. It is the one-and-only key to access an open file description.
  - This array is initialized with `NR_OPEN_DEFAULT` entries (64). This provides a compile-time start, preventing initial heap overhead.
  - Normally a process don't use these many file descriptors, but if a process ends up opening more than 64 files, what happens? Wait.

---

`close_on_exec_init[1]` is a bitmap tracking which file descriptors have the `O_CLOEXEC` flag set.

`open_fds[1]` is a bitmap tracking which file descriptors are currently open.

Both of them are declared as `unsigned long` variables, so they have `NR_OPEN_DEFAULT` bits (64) corresponding to 64 initial file descriptions. But they are declared as singleton arrays, instead of `unsigned long` variables. Why? Wait.

---

If we expand the `fdtable` member in the `files_struct`, we get:
```c
struct files_struct {
  atomic_t count;
  struct fdtable __rcu *fdt;

  /* fdtable fields */
  unsigned int max_fds;
  struct file  __rcu **fd;
  unsigned long *close_on_exec;
  unsigned long *open_fds;
  /* fdtable fields */

  unsigned int next_fd;
  unsigned long close_on_exec_init[1];
  unsigned long open_fds_init[1];
  struct file __rcu * fd_array[NR_OPEN_DEFAULT];
};
```

Here,
  - `fd` points to `*fd_array[64]`.
  - `close_on_exec` points to `*close_on_exec_init[1]`.
  - `open_fds` points to `*open_fds_init[1]`.

Now think about it. Why three members of this struct are pointing to the other three members of the same struct?

This definitely looks ridiculous, but as I have said, we have seen this before. You might not be able to recall it, but two variable names are all that is required to magically bring it back to your memory. I recommend you to revisit `d_name` and `d_shortname` in `struct dentry`.

  - We had `d_name.name` pointing to `d_shortname.string` if the filename was short (<40 characters).
  - If it was longer, `d_name.name` would point to the dynamically allocated string.

What did we gained from this? I hope I don't have to remind that, at least.
  - In practice, most filenames are short, and the 40 character limit was probably found enough, so they created a compile-time object for it.
  - This removes the overhead of heap allocation for the common case. In rare cases, we just create a heap object and the string points to it instead.

Now question how does this apply here. 64 is already a decent number. A normal process doesn't have this much business, so it barely utilizes this. Therefore, this compile-time object ensures no heap overhead for the common case.
```c
files_struct->fdtab.fd = files_struct->fd_array;
files_struct->fdtab.close_on_exec = files_struct->close_on_exec_init;
files_struct->fdtab.open_fds = files_struct->open_fds_init;
```

When a process does happened to open more than 64 files, we just reallocate the resources on heap and redirect the fields in `fdtab` to them. The exact same idea as with a dentry.

The second unresolved question is why `close_on_exec_init` and `open_fds_init` are defined as singleton arrays. The answer is very simple, we just have to think in the opposite direction. What worse could happen if they are defined as normal variables?
  - `close_on_exec` and `open_fds` in `struct fdtable` are pointer variables. They store a pointer.
  - When we allocate an object on heap, we get a pointer. Assignment here is very clean: `fdtab.open_fds = new_open_fds_obj;`.
  - If their compile-time version are normal variables, we have to use the address-of operator: `fdtab.open_fds = &new_open_fds_obj;`.
  - There is nothing wrong with using the `&` operator, but we can utilize array decay to make it cleaner. That's all.

---

I hope the indirection makes sense now. However, it doesn't stop here. There is a problem we need to understand and resolve.

In a multi-threaded environment, all the threads belonging to the same process share the same `files_struct`.

When multiple threads share the same `files_struct`, concurrency needs to be managed.
> *Since I don't understand concurrency yet, I will not pretend I understand this problem.*

The thing is, when multiple threads share the same `files_struct` and continuously access the state, we have to be careful while updating it. Otherwise, we might become a victim of a race condition.

That's why, instead of updating the `fdtable` instance inside the `files_struct` with pointers to the reallocated resources, a new `fdtable` is allocated and its pointers are set to the reallocated resources. This way, any thread accessing the current state always sees a complete and valid `fdtable`.

But, who points to this newly allocated `fdtable` now?
  - `files_struct.fdt` points to the currently active `fdtable`, which always points to the complete resources.
  - Updating a pointer is an atomic operation, so once `files_struct.fdt` is updated to point to the new `fdtable` instance, it's guaranteed that any thread accessing the current state will see the complete resources.

---

I guess this is the first struct we have discussed in this detail. We deserve a summary, so here it is.
  - `files_struct.fd_array[64]` holds pointers to open file descriptions, i.e. `struct file`.
  - `close_on_exec_init` and `open_fds_init` are singleton arrays that hold bitmasks. 64 bits, one for each open fd.
  - `fd_array[64]`, `close_on_exec_init` and `open_fds_init` are compile time allocated objects provided in the start to prevent heap overhead.
  - Some members of the embedded `fdtable` struct point to these compile-time objects. The struct itself is pointed to by `files_struct.fdt`, which tracks the currently active `fdtable`.
  - When the current resources are exhausted, they are reallocated on heap. A new `fdtable` is allocated, its members point to the reallocated resources, and `files_struct.fdt` is updated to point to the new `fdtable`.

`files_struct.count` counts how many threads are sharing this `files_struct`.

`fdtable.max_fds` tracks the current allocated capacity of the `fd_array`.

POSIX requires that `open()` must always return the lowest unused integer. `files_struct.next_fd` caches the lowest integer where the kernel thinks a free slot is available.
> *Performance related stuff. Don't worry about it.*

---

What happens to the older versions of these three resources after they are reallocated on heap? Nothing. They sit idle, unused.

Sigh! We have discussed a lot of details. `Inodes`, `dentries`, `files`, `files_struct` and the great `fdtable` indirection. It is realistic to ask how far we are from `/dev/kvm`? I don't know about you, but I am tired. Therefore, this question is necessary so that I can continue this journey faithfully.

We have already explored the structures that store metadata. The next detail is how the VFS defines operations on these structures.
  - Remember that the VFS defines generic endpoints and a filesystem implementation provides the actual implementation of these endpoints.
  - How an endpoint is implemented is of no concern to us. But how that endpoint is connected to the generic one is what we need to understand.

Let's start.


# Operations

To work on inodes, we have `inode_operations`. To work on files, we have `file_operations`. To work on dentries, we have `dentry_operations`, and so on. I bet you can not find a structure simpler than `struct *_operations`, even `struct dentry` looks complicated in front of them.

Before we explore them, I recommend you to take a look at the full declarations of `file_operations` and `inode_operations` structures in [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12). They are at lines 1921 and 1998 respectively.

You can notice a lot of familiar names here, like `*read`, `*write`, `*mmap`, `*open`, `*link`, `*symlink`, `*unlink`, `*rmdir`, and `*rename` etc. These are the generic endpoints defined by the VFS.

However, it is important to mention that these endpoints are generic with respect to the kernel space. When a process calls `open()`, it doesn't resolve to the `open()` defined in `file_operations`. There is one more indirection between them and we will explore it later.
> *This detail might not make sense yet, but it was necessary to mention.*

---

To understand how a generic endpoint like `*read` is connected to an actual filesystem specific `read` implementation, we have to explore a problem and find a solution to it. That's it.

The problem is quite simple. "***How we can get*** `object.method(args)` ***like semantics in C?***" Once we understand that, we will understand the whole mechanism.
> *I am sure many of you already understand this. As said, the problem is really simple. However, walking through it would help us understand the whole mechanism with a reasoning grounded in ____.*

---

Suppose we have the following struct and operations.
```c
struct BankAccount {
  uint8_t type;
  int balance;
};

void acc_deposit(struct BankAccount*, unsigned int){ /* body */}
void acc_withdraw(struct BankAccount*, unsigned int){ /* body */}
```

We can simply call the functions to perform a deposit, or withdraw. But we need `object.method(args)` semantics. How we can get that? Just define a function pointer inside the struct and we can access it with the `dot` method. Simple enough!

```c
struct BankAccount {
  uint8_t type;
  int balance;

  void (*deposit)(struct BankAccount*, unsigned int);
  void (*withdraw)(struct BankAccount*, unsigned int);
};
```

For many people, function pointers aren't common. Up until here, I myself only knew the term. So here is a simple explanation.
  - `void` is the return type of the function this "function pointer" points to.
  - `(*deposit)` and `(*withdraw)` are the names of the function pointers. The function itself might be named something else.
  - `(struct BankAccount*, unsigned int)` are the arguments accepted by the function that the pointer(s) points to.
  - Therefore, the syntax is:
    ```c
    return_type (*function_pointer_name)(argument_types);
    ```

---

Anyways, now we have `object.method(args)` like semantics. All we need to do is to point these members to the actual functions.
```c
struct BankAccount myAcc = {
  .deposit  = &deposit,
  .withdraw = &withdraw,
};

myAcc.acc_deposit(&myAcc, 1000);
myAcc.acc_withdraw(&myAcc, 200);
```

Right now, we have two functions pointers, so 16 bytes per-instance of `struct BankAccount`. How about having 100 instances of it? 1600 bytes of memory. Not a big deal.

Now increase the number of function pointers and the instances of `struct BankAccount`.
  - If we have 50 pointers and 1000 instances, that's `50*8*1000` = `400,000` bytes, or 390 KiB.
  - If we have 50 pointers and 5,000 instances, that's `50*8*5000` = `2,000,000` bytes, or 1.9 MiB.

We can notice that the memory requirement is growing linearly with the number of instances.

Think about it, what is this memory eventually used for? The functions are defined once and each struct is individually pointing to the same set of functions.

Ask yourself, is this necessary? If you have understood the problem, the answer is likely not. The design is not efficient for a kernel component, or anything, in general.

So, how we can improve this design?

---

Right now, the function pointers are stored within the struct definition, so each instance separately reserves space for them.

The functions are defined once, so their address is fixed, so are the pointers to them. How about restricting the struct to only the data that varies across instances and keep the shared things separately?

We can store the pointers to the functions in one place and every instance just point to that collection, instead of pointing to every single function separately.

It would do two things immediately. 1) Simplify the design. 2) Eliminate unnecessary memory consumption.

In this design, the majority of the struct fields are for instance-specific data. Data that is common to all instances will exist as a shared object and the instance will have a pointer to it.

We can make the following modifications.
```c
struct BankAccount;
struct BankAccountOps;

struct BankAccount {
  uint8_t type;
  unsigned int balance;
  struct BankAccountOps* acc_ops;
};

struct BankAccountOps {
  void (*deposit)(struct BankAccount*, unsigned int);
  void (*withdraw)(struct BankAccount*, unsigned int);
};

void acc_deposit(struct BankAccount*, unsigned int){ /* body */ }
void acc_withdraw(struct BankAccount*, unsigned int){ /* body */ }

static const struct BankAccountOps ops_struct = {
  .deposit  = &acc_deposit;
  .withdraw = &acc_withdraw;
}

void init_account(struct BankAccount* acc_ref){
  acc_ref->acc_ops = &ops_struct;
}
```
  - The functions are defined once.
  - The pointer to these functions are defined once in static storage. Using `const` ensures that the table goes in `.rodata` and become immutable at runtime.
  - The pointer to the pointer table is per-instance.

---

Let's complete this implementation.
```c
#include <stdio.h>
#include <stdint.h>

struct BankAccount;
struct BankAccount_ops;

struct BankAccount {
  uint8_t flags;
  unsigned int balance;
  const struct BankAccount_ops* acc_ops;
};

#define ACC_TYPE_SAVINGS    (1 << 0)
#define ACC_TYPE_CURRENT    (1 << 1)

struct BankAccount_ops {
  void (*deposit)(struct BankAccount*, unsigned int);
  int  (*withdraw)(struct BankAccount*, unsigned int);
  int  (*fetchBalance)(struct BankAccount*);
  void (*getInterestRate)(struct BankAccount*);
};

void acc_deposit(struct BankAccount* acc_ref, unsigned int amt){
  printf(
    "Prior Balance: Rs. %u\n",
    acc_ref->acc_ops->fetchBalance(acc_ref)
  );

  acc_ref->balance += amt;
  printf("Deposited Rs. %u\n", amt);

  printf(
    "New Balance: Rs. %u\n\n",
    acc_ref->acc_ops->fetchBalance(acc_ref)
  );
}

int acc_withdraw(struct BankAccount* acc_ref, unsigned int amt){
  printf(
    "Prior Balance: Rs. %u\n",
    acc_ref->acc_ops->fetchBalance(acc_ref)
  );

  if (amt > acc_ref->balance) {
    printf("Insufficient Funds.\n");
    return 1;
  }

  acc_ref->balance -= amt;
  printf("Withdrawed Rs. %u\n", amt);

  printf(
    "New Balance: Rs. %u\n\n",
    acc_ref->acc_ops->fetchBalance(acc_ref)
  );

  return 0;
}

int acc_fetchBalance(struct BankAccount* acc_ref){
  return acc_ref->balance;
}

void acc_GetInterestRateSavings(struct BankAccount* acc_ref){
  printf("Interest Rate: 6 percent.\n\n");
}

void acc_GetInterestRateCurrent(struct BankAccount* acc_ref){
  printf("Interest Rate: Not Applicable.\n\n");
}

static const struct BankAccount_ops acc_ops_savings = {
  .deposit  = &acc_deposit,
  .withdraw = &acc_withdraw,
  .fetchBalance = &acc_fetchBalance,
  .getInterestRate = &acc_GetInterestRateSavings
};

static const struct BankAccount_ops acc_ops_current = {
  .deposit  = &acc_deposit,
  .withdraw = &acc_withdraw,
  .fetchBalance = &acc_fetchBalance,
  .getInterestRate = &acc_GetInterestRateCurrent
};

void init_acc(struct BankAccount* acc_ref, int type){
  acc_ref->flags = type;    /* Since no flags exist already, no need to use |= . */

  if (type == ACC_TYPE_SAVINGS) {
    acc_ref->acc_ops = &acc_ops_savings;
  }
  else if (type == ACC_TYPE_CURRENT) {
    acc_ref->acc_ops = &acc_ops_current;
  }
}

int main(void){
  struct BankAccount savingsAccount = {0};
  init_acc(&savingsAccount, ACC_TYPE_SAVINGS);

  savingsAccount.acc_ops->deposit(&savingsAccount, 1000);
  savingsAccount.acc_ops->withdraw(&savingsAccount, 200);
  savingsAccount.acc_ops->getInterestRate(&savingsAccount);

  struct BankAccount currentAccount = {0};
  init_acc(&currentAccount, ACC_TYPE_CURRENT);

  currentAccount.acc_ops->deposit(&currentAccount, 200000);
  currentAccount.acc_ops->getInterestRate(&currentAccount);
}
```
  - We have introduced two account types: savings and current.
  - A few more operations are introduced.
  - Generally, savings account pay interest on the deposit, but current accounts don't. This makes the implementation of `(*getInterestRate)` different for both account types. This one is important.

Run this program.
```bash
$ gcc oop-c.c -o run
$ ./run
```
  - Tested on gcc version 14.2.0 (Debian 14.2.0-19).

---

Let's connect this understanding to the VFS.

The VFS provides several templates of operations. Our primary focus needs to be on `struct file_operations`.

A template, by itself, is meaningless unless an instance of it is defined. Who defines these instances? Any kernel subsystem that exposes a resource as a file descriptor.

For example, search `"static const struct file_operations"` on the GitHub frontend of the Linux kernel source code. You will find hundreds of files. [Mine](https://github.com/search?q=repo%3Atorvalds%2Flinux+%22static+const+struct+file_operations%22&type=code) shows 864 files with multiple occurrences.

The VFS provides standard, pre-built operation templates so that basic file systems and devices don't have to start from scratch.

Whenever a specialized subsystem or driver takes control of an open file, its custom `file_operations` table replaces the default pointer. The generic tables serve as the default baseline until the specific driver takes over the wheel. After that, all invocations are directly routed to the filesystem's implementation.

---

Let's have a look at some of these.

[*/root/fs/ext4/file.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/ext4/file.c?h=v7.2.12#n908) defines `ext4_file_operations`, which provides implementations for operations that can be performed on a regular file residing on an ext4 filesystem.

[*/root/fs/char_dev.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/char_dev.c?h=v7.2.12#n449) defines `def_chr_ops`, i.e. "default character device operations", which is the starter table for every single character device in Linux. It's only job is to find the actual operations implementation associated with the device and update the pointer to it.

---

During the start of this section, I have mentioned that the `(*open)` in `file_operations` is not what the userspace `open()` resolves to.

This is the last detail we need to explore to complete our understanding of the VFS, given the pursuit. After that, all we have to do is explore the details specific to character devices.

# The SYSCALL Indirection

We will take the example of `(*read)`.

Starting from line 1761 in [*/root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1761), there are some function declarations with the `vfs_*` prefix. As we go down, we can find `vfs_read` on line 2076.

`vfs_read` is defined in [*/root/fs/read_write.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/read_write.c?h=v7.2.12#n554) starting from line 554. However, I want you to gloss over this file starting from line 483 up until 583. You will notice four functions with the word `read` in them: `new_sync_read`, `__kernel_read`, `kernel_read`, `vfs_read`, `ksys_read`.

Scroll 150 lines down to line 723 and you can see a `SYSCALL_DEFINEx` instruction.
```c
SYSCALL_DEFINE3(read, unsigned int, fd, char __user *, buf, size_t, count)
{
	return ksys_read(fd, buf, count);
}
```

`SYSCALL_DEFINEx` is a macro that defines a syscall. Since a syscall can take 0-6 macros, there are 7 versions of this macro where `x` refers to the number of arguments. This is the syntax:
```c
SYSCALL_DEFINEx(
  syscall_name
  arg1_type, arg1_name
  arg2_type, arg2_name
  ...
)
```

The userspace `read()` invocation after the syscall transition calls `ksys_read()`, which calls `vfs_read()`, which calls the function referred to by `file->f_op->read()` or invoke `new_sync_read()`. They resolve to the component specific implementation.

You will find similar indirection for others as well.

---

That's it. That's all we need to know to understand character devices and `/dev/kvm`.

What we have studied here is the general template of how things work through the Linux VFS layer. As said previously, regular files are excellent entrypoints to understand this. Character devices or any other type just build on top of this and bring some new details.

Because we have built our foundation from scratch, with questions that appear trivial but what they enable isn't trivial, by building answers ourselves, instead of receiving them in nicely plated manner, we have done everything that is needed to understand character devices and `/dev/kvm`.

It's time for character devices now. I hope you have not lost your will, cause I have not.


# So, what is a device?

Normally a "device" is associated with physical hardware, something that can be touched, like a mouse, or a keyboard. However, the concept of "device" is much broader in the kernel.

A device is any resource, be it ***physical***, ***silicon***, or ***virtual***, whose control and communication are managed by a component of the kernel, called a driver.

Physical Hardware Devices: A real piece of hardware plugged into an external or internal bus (PCIe, USB, I2C). For example, a NVMe SSD.

CPU Silicon Capability Devices: Specialized hardware circuits and microcode built directly into the CPU processor die. For example, Intel's VT-x or random number generators.

Pseudo Devices: Pure kernel software constructs that implement the device interface to provide OS services without any hardware behind them. For example, /dev/null, which discards all the data passed to it.

## The identity of a device

A normal file on an SSD is identified by its Inode Number.

A device is identified by a 32-bit integer called dev_t, which is split into two numbers: (Major, Minor).

```
 31                    20 19                               0
┌────────────────────────┬──────────────────────────────────┐
│   MAJOR NUMBER (12b)   │        MINOR NUMBER (20b)        │
└────────────────────────┴──────────────────────────────────┘
```

The Major Number (Which Driver): Tells the kernel which driver handles this device.

The Minor Number (Which Specific Instance): Tells that driver which specific instance or sub-device is being addressed.

---

Think of an IP address and a Port number:

An IP address identifies the computer on a network.
A Port number identifies which specific program on that computer gets the packet.
In Linux device drivers, dev_t is the exact same concept

## A Character Device

**Note: No member omitted. The structure can be verified at [*root/include/linux/cdev.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/cdev.h?h=v7.2.12#n14).**

```c
struct cdev {
  struct kobject kobj;
  struct module *owner;
  const struct file_operations *ops;
  struct list_head list;
  dev_t dev;
  unsigned int count;
};
```


## A Miscellaneous Device

**Note: No member omitted. The structure can be verified at [*root/include/linux/miscdevice.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/miscdevice.h?h=v7.2.12#n84).**

```c
struct miscdevice {
  int minor;
  const char *name;
  const struct file_operations *fops;
  struct list_head list;
  struct device *parent;
  struct device *this_device;
  const struct attribute_group **groups;
  const char *nodename;
  umode_t mode;
};
```


---

A generic entry for operations structures, then go to specifics.
struct dentry_operations


```c
struct path {
  struct vfsmount *mnt;    // Which mounted filesystem instance is this in?
  struct dentry   *dentry; // Which specific name/node in that filesystem?
};
```

anon_inode

static struct char_device_struct {}

anonymous fs?

# Take an example of a complete walk from userspace to kernel space

# Conclusion

The text feels more about files in general, rather than `/dev/kvm`. I am not sure how the trajectory would be different if I understood files previously.

I tried searching for articles on the internet, specifically about files and devices, not `/dev/kvm`, so that I can understand the primitives that make `/dev/kvm`. However, I couldn't find anything.
