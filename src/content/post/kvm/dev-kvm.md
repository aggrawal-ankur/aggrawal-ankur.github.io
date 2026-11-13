---
title: "What is /dev/kvm in KVM? <symlink>"
publishDate: "2026-10-26"
# updatedDate: "2026-M-D"
description: "This text aims to understand the /dev/kvm device used in KVM."
tags: [ linux-arch, linux-kvm]
draft: true
---

# Premise

A text about KVM is, kind of incomplete, if it doesn't mention `/dev/kvm`. Almost all elementary writings about KVM has `/dev/kvm` in them.

The articles that I have read on the internet defines `/dev/kvm` as a "***character device file***" and immediately proceed to use it. The definition is not incorrect, but it is useful only to the people who already understand what a character device file (or a file, in general) is, and I am not one of them.

For me, files are either "text" or "binary". From that standpoint, the definition of a file seems pretty clear. However, when I saw the types of files in Linux, I was surprised. It didn't took much before I realized that the loose definition I had of a file isn't enough.

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

9. I have asked a total of XXXX questions here, and YYYY questions are something I have completely left because they are beyond the scope of this exploration.

10. It is recommended to guard the scope of your exploration. Otherwise, you will never stop spiraling. This heavily applies to shiny objects. However, what about inward expansion of the scope?
    - In my understanding, the advice works great to protect from outward expanding scope. But when the scope increases in terms of depth, it is harder to control it.
    - So far, the only way I know to deal with it is by embracing it. Whatever comes, I explore, capture it and churn it. If it survives, great. If it doesn't, great.

    For this reason, a lot of things are just declarative here. While I myself have dug into them to be sure about what I am writing, I have consciously chosen to conceal those details. They become noise.

11. While I name this an *exploration (or expedition)*, it is important to understand that it doesn't mirror how I understood it. I have gone astray multiple times. If I mentioned everything in its raw form, it's meaning and worth will be questionable to you. Therefore, it has the exploratory nature but it is still guided by a version of me who has already achieved the objective. Also, it has gone through editorial work which, by design, removes some of the rawness.

---

As a reader myself, I absolutely hate when a text doesn't respect my time, energy and attention. While writing this, I have tried my best to follow the standards I expect from such a text. I have been honest when I understand something and when I don't.

The text has gone through multiple rounds of editorial work. As much as I have written new words, I have polished the existing ones on a daily basis. Every morning starts by polishing the work that already exists. The proof is in the `git` [history](https://github.com/aggrawal-ankur/aggrawal-ankur.github.io/commits/main/src/content/post/kvm/dev-kvm.md).

Still, it is a significant investment of your time, energy and attention. So I recommend you to evaluate thoroughly before committing to it. I have confidence in my work, but in the end, I am also a human, and can be wrong.

If you do commit to it, you won't be disappointed. However, if you do get disappointed, I owe it and I am committed to improve it.

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

> *The "symbol" attribute is visible in `ls -l` as the first thing.*
> 
> *"Pipes", and "sockets" aren't relevant to this pursuit, so they are not discussed.*
> *Block devices are relevant, but they are not required to be understood in detail. So, we explore them as much as the pursuit demands, not in detail.*
> 
> *I am aware of the saying "everything is a file", however, we will not explore the why behind it here.*

---

The list is quite strange, is it? If the list gave you questions you can't articulate yet, it did its job.

I am sure we don't have to understand the list to realize that "*a file is more than human-readable or machine-readable bytes*". This realization has costed me a lot of time, energy and attention. All the time, I was trying to understand files from that standpoint.

Now that we have realized that a file is more than text or binary data, we can start exploring what a file is.

# What is a file?

The laptop market has two major players: "***MacOS***" and "***Windows***" laptops. There are specialized vendors that support laptops with a Linux-based distribution out-of the box, but they are not very common.

While we can not purchase a Linux-based laptop laptop directly, we can change the OS to a Linux-based distribution like Debian or Arch, or other OS like FreeBSD, without changing the hardware. ***This is possible because the hardware and OS are separate entities.***

Inside an operating system, there are multiple components, each designed to do a specific thing. There are drivers, a memory management system, processes, scheduler and so on. 

It is obvious that we love "***choices***". However, not everything is swappable. For example, we can switch the OS, but not the memory management facility the chosen OS kernel provides.

---

Among these is a component called "***filesystem***". In simple words, a filesystem is designed to manage files.
> *Please note that this could be considered an over-simplification of the topic*.
> *In case you are looking for a precise definition, please checkout other resources.*

Because there are different types of files, there are different filesystems for them.

A "***storage filesystem***" is used when we want our data to persist across reboots on non-volatile storage hardware like a SSD or HDD.
  - A storage filesystem organizes a flat, unformatted array of storage blocks into a navigable hierarchy of human-readable files and directories while tracking space allocation and metadata.
  - In simple words, a storage filesystem manages metadata about the data that we can see inside files.

There are different ways to manage this metadata, each with different goals and trade-offs. That gives rise to different storage filesystems like ext4, xfs, btrfs, ntfs, and so on.

> *You can gloss over this [Wikipedia](https://en.wikipedia.org/wiki/File_system) article to get an idea of it, although it is not required.*

"***If a storage filesystem organizes the metadata of the data inside a file (among other things), who puts the data on the storage hardware?***"
  - Suppose a storage filesystem also communicate with the storage hardware.
  - Does that mean if there are 10 storage filesystems, then each of them must write the code to communicate with the storage hardware? The answer looks like a YES, is it?
  - I mean, we can do that, but whether we should, is the real question. Obviously, we don't.
  - `ext4` works regardless of an SSD or HDD. Does that mean there is `ext4_ssd` and `ext4_hdd`? NO.
  - There is a separate component whose only job is to communicate with "a" storage hardware and the storage filesystems use it to interact with the storage hardware.

---

Different filesystems means the kernel must support them. How?

To manage this variety of filesystems, allow new ones to be created without disturbing anything, and give userspace a single unified way to access files regardless of their type, the Virtual File System (VFS) was created.

The VFS abstracts different filesystems into one unified interface. Basically, all the complexity is shifted to the kernel space and the userspace is provided with generic, unified handlers, concealing all the details. The kernel takes care of everything.

Let's understand the virtual file system.

## Virtual File System (VFS)

The kernel defines a general filesystem abstraction. It comes with a "***feature set***" and the "***tradeoffs***" the kernel makes to bring that abstraction into existence.

This abstraction is like a "***contract***". If a "thing" can be modeled into that contract, the kernel can manage it as a "***file***".

The contract is defined such that it doesn't alter a filesystem's implementation, only the entrypoints are modeled into the contract. For example, take `read()`. This abstraction is designed to "***read a file***".
  - Different storage hardware "read" data differently.
  - The software that can communicate with this hardware needs to know what exactly on the hardware it needs to "read".
  - A storage filesystem guides that component to the correct location on the hardware (among other things) where the data is stored.
  - The storage filesystem provides this function that initiates the job of "reading a file" to the VFS and the VFS maps it to its generic `read()` abstraction.
  - When a process opens a file and calls `read()` on it, the VFS identifies the details and routes the request to the relevant filesystem handler, which calls the relevant hardware handler.

---

Therefore, the VFS is best understood as a contract and the next step is to understand what this "contract" looks like.
> *The details below are what I am able to identify. It is possible that the VFS is more than this, but I can write about it only when I understand it, and exploring any more detail is beyond the scope of this exploration.*
> 
> *The details below are supposed to introduce you to the contract. They are explored in enough detail when the associated structures are introduced.*

### Feature Set

| Sr. | Feature Set | Brief Contract Details | Kernel Structures |
| :-- | :---------- | :--------------------- | :---------------- |
| 1 | **The Entity** | An identity for the resource. | `struct inode`,<br>`struct inode_operations` |
| 2 | **Access Control** | Standard permission checks before the access is granted. | `struct inode` |
| 3 | **The Session** | An active, stateful dialogue between a process and an entity. Multiple sessions can be opened for the same resource. | `struct file` |
| 4 | **The Userspace Handle** | The userspace is provided an opaque, process-local integer token, protecting the kernel address space. | `struct files_struct`,<br>`struct fdtable` |
| 5 | **Operations & Lifecycle** | A set of generic operations that are routed to implementation-specific handlers. | `struct file_operations`,<br>`struct dentry` |
| | | Deterministic resource and hardware cleanup upon explicit close or abrupt process crash when the final reference drops. |

> *If the description of an "entity" reads like "this is what a file is, isn't it?", I recommend you to hold it for a while. There is a reason I have used the term "entity", instead of "file".*

---

### Trade-offs

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
  - Different type of files means different filesystems are required. Moreover, there are different filesystems solving the same problem differently.
  - The Linux kernel must support this variety of filesystems.
  - The kernel provides a generic file system abstraction, called the VFS, which is a contract and anything that can be modeled into it could be managed as a "file". The implementation of the filesystem remains unaffected.

So, what next? It's time to define files.

## What is a File?

A contract template by itself is just a set of rules. It only comes into reality when an agreement is made, right?

"***If the virtual file system is the contract, then a file is an active instance of that contract.***"

As I have mentioned this already, a file to me was "text" or "binary". But from the perspective of the Linux kernel, it is more than that, and it is so for valid reasons.

As humans, we can easily define a file as "***bytes of data on a hardware storage***". But how the kernel should implement it?
  - A set of abstractions are required to manage these "***bytes***".
  - That's why, the text in a text file is just one part of the story, and considering that the whole story is what the kernel wants the userspace to believe. The abstraction was designed to conceal details from the userspace.

It is clear that we need more than just the text to create a text file. We need "data" on the disk and some "metadata" that describes that "data" to facilitate operations on (or around) it.

---

We have the storage hardware where the bytes reside. We have some machinery to facilitate operations around it. Notice what the abstraction has done here. "***It has separated the machinery required to manage a file from what backs a file.***" We have seen this before, but where?"***The separation between an OS and the hardware.***"
  - A combination of hardware provides raw capabilities.
  - An OS taps into them and provides an interface to utilize them.
  - Different OS tap on those capabilities and provide access to the same hardware resources in different ways with different goals and trade-offs.

Think about it. A text file stored on a physical storage device is backed by it. How about replacing the backing with something else?
  - Replace hardware storage with a table of names and pointers, and we get a directory file.
  - Replace hardware storage with a character-stream hardware device (like a serial port or terminal), and we get a character device file.
  - Replace hardware storage with the KVM kernel module (which taps into the VMX capabilities of the hardware), and we get `/dev/kvm`.
  - Replace hardware storage with a ring buffer in RAM, and we get a pipe.
  - Replace hardware storage with a network interface card (NIC), and we get a socket.

That's how we get those weird looking files.

---

If an article talks only about files that are "***bytes backed by a storage hardware***", it is discussing only regular files, which is a fraction of the virtual file system.

It is clear that regular files provide a perfect starting point to understand VFS, but understanding regular files is not equal to understanding the VFS. They merely provide the right base to understand the rest of the files.

The "***replace X with Y, and we get FILE_TYPE_Z***" simplification was possible only after we have understood "***regular files***".

---

So, what is a file? A file is an active instance of the VFS contract. The contract defines the properties and a file is a runtime instance of it.

While the picture looks complete, there is one piece that is missing.

## One Last Surprise

A file can be opened at multiple places simultaneously. If you have not tried it, you can try right now.

Now think about it. We have one file and there are multiple active instances of it. Each instance has its own independent state. How the kernel makes that possible?

So far, we have a resource that backs a file and some metadata about it. The third and the final component of a file is "***per-instance metadata***". This is what that allows a file to be opened at multiple places simultaneously.

Therefore, a file in Linux is made up of 3 components.
  1. The resource backing the file,
  2. The metadata describing the resource, and
  3. The metadata associated with an open file description.

---

Now what is surprising here?

  - In the Linux kernel's terminology, the metadata about the resource is called "***inode***", and the per-instance metadata is called "***file***". The term "***file***" means an instance of an "***inode***". Not the complete stack.
  - But conceptually, per-instance metadata, inode and the resource backing them together makes a file.

This terminology is why the feature set table uses the term "***entity***", not "***file***".

> *In my understanding, the terminology is loose here. However, I am interested to know why it was chosen in the first place.*
> 
> *As I have mentioned earlier, it is possible that the author(s) perceived it differently, which led to this terminology.*

"***Please remember this distinction and save yourself headaches later.***"

---

That's the core of the VFS. Everything else is a detail that we can choose to explore if we need it.

Now we will explore the details relevant to this pursuit.

# Kernel Structures

The following structures are relevant to this exploration.

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

## Index Node (or inode)

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
| `i_rdev`  | Device number. Only meaningful for character and block device. |  
| `i_size`  | File size in bytes. For regular files, indicates content length; for device nodes like `/dev/kvm`, it is 0. |
| `i_atime_sec`, `i_atime_nsec` | Timestamp of the last file access (seconds and nanoseconds). |
| `i_mtime_sec`, `i_mtime_nsec` | Timestamp of the last file content modification (seconds and nanoseconds). |
| `i_ctime_sec`, `i_ctime_nsec` | Timestamp of the last inode status/metadata change (seconds and nanoseconds). |
| `i_fop` | Pointer to the `struct file_operations`. |
| `i_cdev`<br>in the last union | Pointer to `struct cdev`. Cached in the union once the character device is resolved. |
| `i_link`<br>in the last union | Pointer to the target path string when the inode represents a symbolic link. |


## An instance of an Inode

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
| `f_path`  | Contains pointers to the `struct dentry` and `struct vfsmount` for this open file. |
| `f_pos`   | Current byte offset in the file. Useful to regular files, directories and block devices. |
| `f_ref`   | A file struct can be shared across processes by the means of `fork()`, or file descriptors can be copied using `dup()` or `dup2()`, in which case, they point to the same file struct. This member counts those references. The `struct file` and underlying state is destroyed only when `f_ref` drops to 0. |


## Directory Files

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

An entry in a directory file is represented by `struct dentry`, which literally stands for "directory entry".

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

A `dentry` is probably the simplest structure in this exploration. However, if you have eagle-eyes, you would have noticed two things.
  1. The function of `d_children` is that of a pointer, but it is declared like a structure.
  2. How the kernel knows who points to the filename: `d_name` or `d_shortname`?

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

I don't know about others, but reading kernel code can easily get boring when I am repeatedly seeing the same thing every single day. It gets worse when nothing makes sense.

But the moment I see stuff like this and it clicks, I get such a dopamine rush that no cheap source can match, not even remotely.

---

***Note: How dentries are constructed and maintained is a detail that is not relevant to this exploration, so it is not explored here.***

## Why an inode lacks a filename?

A filename can be classified as metadata, so it should go into an inode. But based on what we have seen so far, that is not the case.

So, why filenames are detached from the rest of the metadata?
> *I have found two points that I can understand and reason about. That's what we are going to discuss. There can be more as well.*
> *However, please note that they may or may not be historically accurate. So please forgive me on that side.*

### 1. Fixed Size Inodes

A filesystem is not an exotic concept. It dates back to 60s and 70s, almost 50-60 years from today. Check this text written by [Paul Krzyzanowski](https://pk.org/articles/big-ideas-fs.html).

Similarly, the concept of inode is not exotic either. It dates back to 1969 during the creation of the first version of the UNIX operating system.

Systems these days have generous resources, be it memory or processing, which was not used to be the case historically, at least in the 50s, 60, or 70s, when these concepts were being designed. Therefore, the design had to be efficient.

From this perspective, separating the filename from the rest of the metadata in an inode is a great design decision as it keeps the size of an inode fixed.

I don't know about you, but I definitely don't understand how this separation keeps the size of an inode fixed. Checkout the full definition of [`struct inode`](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n762) with open eyes, no glossing over.

It doesn't require extra knowledge to understand that all the fields in an inode have deterministic values.
  - I am not saying "pre-defined" values.
  - I am saying that whatever domain of values a member is supposed to contain, the container is confirmed to be able to contain them. There is no situation where a member could be asked to contain a value it couldn't contain.

A filename, on the other hand, is not fixed. Files can be renamed as well. The size can not be determined at compile-time.

Therefore, by separating filename from the rest of the metadata, we can get a fixed size inode. The advantages of this is that finding inode `#N` on the storage device takes `O(1)` time. It is pure arithmetic:
```c
byte_off = inode_table_base + (inode_number-1) * sizeof(struct inode);
```
> *Valid inodes start at 1, that's why the formula subtracts 1 to adjust the math.*

---

However, I have a counter argument. Before you read it, I want to say, "yes, it is as naive as I am".

Linux anyways doesn't allow filenames larger than 255 bytes. The upper bound is fixed. We can allocate an inline buffer at compile-time. No heap overhead.

If we are concerned about "internal fragmentation" or "memory pressure" (memory wastage, basically), I want to say that the kernel has many generic structs and many instances of them don't utilize them properly.
  - Take `file_operations` for example. A lot of the fields are only relevant to files with read/write like capabilities. `/dev/kvm`, on the other hand, is mostly `ioctl` based. Doesn't this generalization waste memory?
  - Yeah, generalization have cost, and we have acknowledged that in the tradeoffs section, but it shouldn't be used as an excuse here.

However, I understand that the authors/maintainers are magnitudes more knowledgeable than me, and if they have agreed on it, then there is a reason for it. I only want to know that reason because I am not able to think what it is.

Anyways, the separation was designed to deal with a real problem. But this separation has created way for a feature as well.

### 2. Multiple Names (Link Files)

We know that a directory file maps human-readable names to inodes. Is it possible to map more than one name to the same inode? Yes, and that's the concept behind "***link files***".

***A link file is a mechanism to create an alternate reference to an existing file without copying its contents.***

There are two kinds of links: "***hard links***" and "***soft links***". Soft links are also called symbolic links or symlinks, in short.
  - Mapping a human-readable name to an inode is what creating a hard link means.
  - Mapping a human-readable name to a path is what creating a soft link means.

---

Link files are conceptually comparable to shallow copy in programming. For example, updating `y` in the snippet below updates `x` too, as both of them point to the same entity.
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

If the inode corresponding to the target path is deleted, or the dentry of the target path is deleted, the soft link will be effectively broken. What if the path is reinstated to a different inode? The symlink will continue to work, but it is not intended to. How the kernel deals with this?
  - The kernel does nothing. That's the design.
  - A symlink only stores a raw text path. It doesn't care about the inode behind it.

The genius of this design is used heavily in version switching. It's like creating a permalink for a resource whose destination is not fixed by design.

---

Now, I leave this question to you.

Personally, the answers aren't very satisfactory to me. But the question is not something I must resolve to move forward, so I have left it for now.

## How open file descriptions are managed?

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

Normally I prefer tables to explain struct fields. But the indirection here is absolutely crazy, which is why I am making an exception here.

Indirection often feels ridiculous, until you know why it exists.

These structs are quite simple, but there is a problem that has made them complex. Once we understand that problem, we will understand this indirection. And the best part is that we have already seen this indirection at play, the worse part is that what we have seen is a miniature version of this, which makes the gap huge and we are not able to see the indirection at play immediately.

Let's start.
> *By the way, I recommend not focus on `__rcu`. It is not necessary.*

---

`fd_array` is a collection of `struct file` pointers, where each pointer correspond to an open file description.
  - Since it is an array, each pointer is on an index. This index is what that is returned to the userspace by the name "***file descriptor***". Therefore, a file descriptor is an opaque, process-local integer that is returned to the userspace.
  - Whenever a process performs an operation using this integer, let's say `read()`, this integer is used to find the `struct file` instance corresponding to it, i.e. `files_struct->fd_array[fd]` and things continue afterwards. It is the "***one-and-only***" key to access an open file description.
  - This array is initialized with `NR_OPEN_DEFAULT` (64) entries. This provides a compile-time start, preventing initial heap overhead.
  - Normally a process don't use these many file descriptors, but if a process ends up opening more than 64 files, what happens? Wait.

---

`close_on_exec_init[1]` is a bitmap tracking which file descriptors have the `O_CLOEXEC` flag set.

`open_fds[1]` is a bitmap tracking which file descriptors are currently open.

Both of them are `unsigned long`, so they have `NR_OPEN_DEFAULT` bits (64) corresponding to 64 initial file descriptions. But they are declared as singleton arrays, instead of `unsigned long` variables. Why? Wait.

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

  - We had `d_name.name` pointing to `d_shortname.string` if the filename was short (< 40 characters).
  - If it was longer, `d_name.name` would point to the dynamically allocated string.

What did we gained from this? I hope I don't have to remind that, at least.
  - In practice, most filenames are short, and the 40 character limit was probably found enough, so they created a compile-time object for it.
  - This removes the overhead of heap allocation for the common case. In rare cases, we just create a heap object and the string points to it instead.

---

Now question how does this apply here. 64 is already a decent number. A normal process doesn't have this much business, so it barely utilizes this. Therefore, this compile-time object ensures no heap overhead for the common case.
```c
files_struct->fdtab.fd = files_struct->fd_array;
files_struct->fdtab.close_on_exec = files_struct->close_on_exec_init;
files_struct->fdtab.open_fds = files_struct->open_fds_init;
```

When a process does happened to open more than 64 files, we just reallocate the resources on heap and redirect the fields in `fdtab` to them. The exact same idea as with a dentry.

---

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

The thing is, when multiple threads share the same `files_struct` and continuously access the shared state, we have to be careful while updating it. Otherwise, we might become a victim of a race condition.

That's why, instead of updating the `fdtable` instance inside the `files_struct` with pointers to the reallocated resources, a new `fdtable` is allocated and its pointers are set to the reallocated resources. This way, any thread accessing the current state always sees a complete and valid `fdtable`.

But, who points to this newly allocated `fdtable` now?
  - `files_struct.fdt` points to the currently active `fdtable`, which always points to the complete resources.
  - Updating a pointer is an atomic operation, so once `files_struct.fdt` is updated to point to the new `fdtable` instance, it's guaranteed that any thread accessing the current state will see the complete resources.

---

I guess this is the first struct we have discussed in this detail. We deserve a summary, so here it is.
  - `files_struct.fd_array[64]` holds pointers to open file descriptions, i.e. `struct file`.
  - `close_on_exec_init` and `open_fds_init` are singleton arrays that hold bitmasks. 64 bits, one for each open fd.
  - `fd_array[64]`, `close_on_exec_init` and `open_fds_init` are compile-time allocated objects provided in the start to prevent heap overhead.
  - Some members of the embedded `fdtable` struct point to these compile-time objects. The struct itself is pointed to by `files_struct.fdt`, which tracks the currently active `fdtable`.
  - When the current resources are exhausted, they are reallocated on heap. A new `fdtable` is allocated, its members point to the reallocated resources, and `files_struct.fdt` is updated to point to the new `fdtable`.

---

`files_struct.count` counts how many threads are sharing this `files_struct`.

`fdtable.max_fds` tracks the current allocated capacity of the `fd_array`.

POSIX requires that `open()` must always return the lowest unused integer. `files_struct.next_fd` caches the lowest integer where the kernel thinks a free slot is available.
> *Performance related stuff. Don't worry about it.*

---

What happens to the older versions of these resources after they are reallocated on heap? Nothing. They sit idle, unused.

---

Sigh! We have discussed a lot of details. `Inodes`, `dentries`, `files`, `files_struct` and the great `fdtable` indirection. It is realistic to ask how far we are from `/dev/kvm`? I don't know about you, but I am tired. Therefore, this question is necessary so that I can continue this journey faithfully.

We have already explored the structures that store the metadata. The next detail is how the VFS defines operations on these structures.
  - Remember that the VFS defines generic endpoints and a filesystem implementation provides the actual implementation of these endpoints.
  - How an endpoint is implemented is of no concern to us. But how that endpoint is connected to the generic one is what we need to understand.

Let's start.


## Operations

To work on inodes, we have `inode_operations`. To work on files, we have `file_operations`. To work on dentries, we have `dentry_operations`, and so on. I bet you can not find a structure simpler than `struct *_operations`, even `struct dentry` looks complicated in front of them.

Before we explore them, I recommend you to take a look at the full declarations of `file_operations` and `inode_operations` structures in [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12). They are at lines 1921 and 1998 respectively.

You can notice a lot of familiar names here, like `*read`, `*write`, `*mmap`, `*open`, `*link`, `*symlink`, `*unlink`, `*rmdir`, and `*rename` etc. These are the generic endpoints defined by the VFS.

However, it is important to mention that these endpoints are generic with respect to the kernel space. When a process calls `open()`, it doesn't resolve to the `open()` defined in `file_operations`. There is one more indirection between them and we will explore it later.
> *This detail might not make sense yet, but it was necessary to mention.*

---

To understand how a generic endpoint like `(*read)` is connected to an actual filesystem specific `read` implementation, we have to explore a problem and find a solution to it. That's it.

The problem is quite simple. "***How we can get*** `object.method(args)` ***like semantics in C?***" Once we understand that, we will understand the whole mechanism.
> *I am sure many of you already understand this. As said, the problem is really simple. However, walking through it would help us understand the whole mechanism with a reasoning grounded in ____ FILL THIS PLACEHOLDER.*

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

For many people, function pointers aren't common. Up until here, I myself knew the term only. So here is a simple explanation.
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

Whenever a specialized subsystem or driver takes control of an open file, its custom `file_operations` table replaces the default one. After that, all the invocations are directly routed to the specific implementation.

---

Let's have a look at some of these.

[*root/fs/ext4/file.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/ext4/file.c?h=v7.2.12#n908) defines `ext4_file_operations`, which provides implementations for operations that can be performed on a regular file residing on an ext4 filesystem.

[*root/fs/char_dev.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/char_dev.c?h=v7.2.12#n449) defines `def_chr_ops`, i.e. "default character device operations", which is the starter table for every single character device in Linux. It's only job is to find the actual operations implementation associated with the device and update the pointer to it.

---

During the start of this section, I have mentioned that the `(*open)` in `file_operations` is not what the userspace `open()` resolves to.

This is the last detail we need to explore to complete our understanding of the VFS, given the pursuit. After that, all we have to do is explore the details specific to character devices.

## The SYSCALL Indirection

We will take the example of `(*read)`.

Starting from line 1761 in [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1761), there are some function declarations with the `vfs_*` prefix. As we go down, we can find `vfs_read` on line 2076.

`vfs_read` is defined in [*root/fs/read_write.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/read_write.c?h=v7.2.12#n554) starting from line 554. However, I want you to gloss over this file starting from line 483 up until 583. You will notice four functions with the word `read` in them: `new_sync_read`, `__kernel_read`, `kernel_read`, `vfs_read`, `ksys_read`.

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

That's it. That's all we need to know to understand "devices", then "character devices" and finally `/dev/kvm`.

What we have studied here is the general template of how things work through the Linux VFS layer. As said previously, regular files are excellent entrypoints to understand this. Character devices or any other type just build on top of this and bring some new details.

Because we have built our foundation from scratch, with questions that appear trivial but what they enable isn't trivial, by building answers ourselves, instead of receiving them in nicely plated manner, we have done everything that is needed to understand devices, character devices and finally `/dev/kvm`.

It's time to explore devices. Yeah, it's been a long time, but I can't help. I am exhausted, but I have not lost the will to continue; I hope you haven't either.


# What is a device?

If you remember the types of files, some of them have the term "device" in them, like "a block device file". This is confusing to me. Is it a "device", a "file", or both, or something else entirely?

Because we have already explored this lore, I will cut directly to the point. Just like there is VFS, there is an abstraction for devices as well. It is called the "***Device Model***".

As you might have guessed it already, we have to explore this "device model" thing in order to understand devices. That is, kind of depressing, given how exhausted we are, I agree, however, the good part is that we already understand the lore, so all we have to do is explore the details and we are done.

Let's start our journey in the "***Linux Device Model***".

## Linux Device Model

Normally a "device" is associated with physical hardware, something that can be touched, like a mouse, or a keyboard. However, the concept of "device" is much broader, just like files are more than bytes on a disk.

A device is any ***resource*** whose control and communication are managed by a component of the kernel called, "***a driver***". The resource could be '***physical***', '***silicon***', or '***virtual***'.

  - "***Physical hardware devices***" are a real piece of hardware plugged into an external or internal bus (PCIe, USB, I2C). For example, a NVMe SSD.

  - "***CPU silicon capability***" are specialized hardware circuits and microcode built directly into the CPU processor die. For example, Intel's Virtual Technology Extensions, i.e. VT-x, which backs the `/dev/kvm` device, or the hardware random number generators.

  - "***Pseudo devices***" are purely software constructs built by the kernel and exposed as devices. No hardware backs them. `/dev/null` is the best example. It discards all the data passed to it.

---

We know that
  1. regular files are made up of three components: a file, an inode and a resource backing them.
  2. a storage filesystem manages the metadata about the data, among other things.
  3. a storage filesystem doesn't know how to talk to the physical storage hardware directly.
  4. their exist a software that knows how to talk to the physical storage device.

To communicate with an NVMe SSD, we need a set of drivers which are defined as kernel modules.

Therefore, kernel modules are the first thing we need to understand.

## Kernel Modules

A kernel module is a compiled piece of binary code (`.ko`) that can be loaded into, or unloaded from, the running kernel on demand without rebooting the system or recompiling the kernel. It runs in Ring 0 (full hardware privileges) and has direct access to the kernel memory and the kernel APIs.

Kernel modules are essentially "***plug-and-playable***" kernel components.

The question we need to ask is "***why we need plug-and-playable kernel components?"*** It is opposite to building everything in the core kernel binary.

Let's find out.

---

The configuration of every machine is different.
  - Some has a NVMe SSD, the other has a SATA SSD.
  - Some has a `802.11n` WiFi adapter (WIFI 4), the other has a `802.11ax` WiFi adapter (WIFI 6).
  - One has an Intel sound card, the other has a Realtek sound card.
  - One has a 120Hz display, the other has a 165Hz display.

The list is long. However, once purchased, it is fixed. But we can plug in new hardware externally. For example, a pen drive, a camera, a USB Hub, or a speaker.

Now the question is, "***what configuration a distro maker should build the kernel with such that it works everywhere?***" Not sure, but baking everything into the kernel could be that configuration? Yes.
  - However, it makes the kernel binary unnecessarily huge. Most of the contents will consume memory without any use.
  - Not every build requires every feature that the kernel supports. Also, systems with limited resources won't be able to afford it.

So, baking everything into the kernel is not a feasible idea. What else could be done?

---

There are a basic set of features, like the scheduler and memory management, which are required by every build. The rest depends on the system configuration.

For example, if the machine doesn't have an ethernet port, why bother building it in the core binary?
  - We can definitely use a "USB to Ethernet" dongle, but does that mean we should bake the support in the core binary?
  - Again, we can, but whether we should, is the question.

The basic features, like the scheduler, needs to exist in the memory as long as the system is live. On the other hand, many features are required only when a need arises. When the need is fulfilled, they are no longer required to exist in memory.

So, how about separating the core kernel with everything that is not mandatory to exist all the time?
  - The core binary will remain truly core.
  - The features can be built as components that can be loaded on demand and shelved when the demand is fulfilled.
  - The memory saved here remains utilizable elsewhere.

That is the idea behind kernel modules. That's why we need kernel modules.

---

The Linux kernel is an entity that supports a wide range of features, and they are supported such that the kernel remains hardware agnostic.

The kernel provides three ways to build every single feature.
  1. Exclude it entirely.
  2. Build it as a kernel module.
  3. Bake it directly into the core kernel binary.

When you exclude a feature, you can't use it, even when the hardware supports it. Either you have to rebuild the kernel or build that feature as a kernel module.

When you build a feature as a kernel module, the code related to that feature resides in the storage device as a `.ko.xz` file (compressed kernel module binary). It is loaded when needed and removed when not.

When you bake a component directly into the core binary, it is always available in the kernel memory.

---

A Linux distribution provider use these build features to provide a lean kernel binary in the ISO file. It only includes the core features and everything else is provided as a kernel module. We can verify this ourselves.

I use Debian 13.
```bash
$ uname -vrsm

Linux 6.12.57+deb13-amd64 
#1 SMP PREEMPT_DYNAMIC Debian 6.12.57-1 (2025-11-05) x86_64
```

The name of the kernel binary is `vmlinux`. It is compressed and a piece of code is baked right before it, making up `vmlinuz`.
> *We will touch it later.*

Let's locate `vmlinuz` on my system.
```bash
$ find / -name 2>/dev/null vmlinuz
/vmlinuz

$ file /vmlinuz
/vmlinuz: symbolic link to boot/vmlinuz-6.12.57+deb13-amd64
```

So it's a symlink. Let's check the target.
```bash
$ ls -lh /boot | grep vmlinuz-6.12.57+deb13-amd64
-rw-r--r-- 1 root root 12M Nov  5  2025 vmlinuz-6.12.57+deb13-amd64

$ file /boot/vmlinuz-6.12.57+deb13-amd64 -b | tr ',' '\n'
Linux kernel x86 boot executable
 bzImage
 version 6.12.57+deb13-amd64 (debian-kernel@lists.debian.org) #1 SMP PREEMPT_DYNAMIC Debian 6.12.57-1 (2025-11-05)
 ....
```

The compressed kernel binary is just 12 MB in size. What about the uncompressed kernel binary?

Distributions normally don't ship `vmlinux` alongside. However, the kernel provides a script, called `extract-vmlinux`, to extract `vmlinux` from `vmlinuz`.

This script is available in the kernel source tree at [*root/scripts/extract-vmlinux*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/scripts/extract-vmlinux?h=v7.2.12). You can download and run it on your machine.

Below are the results.
```bash
# extract-vmlinux  <path-to-vmlinuz>  >  <path-to-output>
$ ./linux-x86-tree/scripts/extract-vmlinux  \
    /boot/vmlinuz-$(uname -r) > ./vmlinux-binary
extract-vmlinux: Extracted vmlinux using 'unzstd' from offset 21197

$ file ./vmlinux-binary
./vmlinux-binary: ELF 64-bit LSB executable, x86-64, version 1 (SYSV),
statically linked, BuildID[sha1]=d29a7c458f7287e043337234ba4b434454b54ff2,
stripped

$ ls -lh ./vmlinux-binary
-rw-rw-r-- 1 username username 55M Nov  7 12:19 ./vmlinux-binary
```

See the difference.
  - The compressed binary is 12 MB.
  - The uncompressed binary is 55 MB.
  - The [complete installation](https://cdimage.debian.org/debian-cd/current/amd64/iso-dvd/) ISO for Debian 13.7.0 is 3.7 GB.

---

Now open the `/lib/modules` directory in a file manager. This is where the kernel modules reside.
```bash
$ ls -l /lib/modules
total 12
drwxr-xr-x 3 root root 4096 Jan  1  2026 6.12.57+deb13-amd64
```

All the modules are available inside this directory. It is possible that your system has more than one of them, but only one is loaded into memory.
  - In `./fs`, we can find all the supported filesystem directories, each containing a `.ko.xz` file.
  - In `./arch/x86/kvm`, we can find the virtualization modules, i.e. `kvm.ko.xz`, `kvm-amd.ko.xz` and `kvm-intel.ko.xz`.
  - In `./drivers/nvme/host`, we have `nvme.ko.xz` and `nvme-core.ko.xz`, among others.
  - In `./drivers/virt/vboxguest`, there is `vboxguest.ko.xz`, which is used by virtual box.

We can count the total number of modules present in my system.
```bash
# Method 1: Read all the ".ko*" files.
$ find /lib/modules/$(uname -r)/ -name "*.ko*" | wc -l
4227

# Method 2: Read the number of lines in the kernel's
# own bookkeeping of all the modules.
wc -l /lib/modules/$(uname -r)/modules.order
4227 /lib/modules/6.12.57+deb13-amd64/modules.order
```

Let that sink in. There are 4227 modules on my system. If I use `lsmod` to check the total number of modules currently in memory,
```bash
$ lsmod | wc -l
203
```
.... it is 203. That's ~5% of the total modules on my system. If they were baked into the kernel binary, we can only imagine the memory it will consume, for absolutely no reason.

I recommend you to open this in a file manager and explore it yourself.

This proves that `vmlinux` includes only the core components and everything else is provided as a kernel module.

That's kernel modules for you.

---

So, we have hardware devices and the drivers to communicate with them. These drivers are often compiled as kernel modules.

When a device is plugged into the machine, the kernel detects it and loads the appropriate kernel module(s). How exactly? That's the next detail that we need to understand.

## Discovery of Devices and Drivers

Before we continue, I want to say something. It is possible for you to have some questions. Although I can't read your mind, because I have gone on a long detour here, I am aware of some of these questions.

  - How is `vmlinuz` read when no drivers exist, as `vmlinuz` is also on the storage device? This sorcery is handled by the bootloader and the firmware.
  - If `vmlinuz` can be read, why not everything else that is required to complete the environment? Yeah, it is read the way `vmlinuz` is read.
  - If `vmlinux` is compressed, who decompresses it? Where does the decompressor come from? The tiny code that goes before the compressed `vmlinux` in `vmlinuz` is the decompressor. It is not compressed, so it can execute directly. It takes the compressed `vmlinux` as input, decompresses it and loads it into memory.
  - Why do we compress `vmlinux` in the first place? Small files can be read faster. But then we have to decompress them, which is not free? It is possible that whoever designed it observed that reading a compressed archive and decompressing it in memory is faster than reading an uncompressed file.
  - Does this "environment" thing have a name? It is named `initrd.img` and is present in the same location as `vmlinuz`. There is something called `initramfs` as well.
  - What is the difference between `initrd.img` and `initramfs`? I don't have the bandwidth to process it.

Why have I mentioned these? I hate it when I have questions but the writing doesn't acknowledge them or guide if they are relevant to the pursuit or not.

I want to say that these questions are great, but not relevant to our pursuit. We can explore them for a greater understanding from the perspective of the boot process. However, they are not "***a necessity***". You can safely move on.

It is possible that you have a question which is genuinely relevant here. In that case, please explore it yourself, and tell me about it, so that I can evaluate it and add it if required.

---

When a physical device is plugged into the machine, the kernel has to perform two tasks:
  1. Detect the device.
  2. Load the appropriate kernel modules.

A physical device is inserted into a slot. This slot is connected to the motherboard by some wires which are called ***bus***.

Each bus is different and it is controlled (or managed) by a hardware component. Different bus specification names them differently. We will call them "***bus controller***" here.

When a device is inserted into a slot, a change in voltage is detected by the bus controller. It then raises a hardware interrupt, notifying the CPU about it. 
> *This change in voltage is automatic. Thanks to physics, we don't have to understand how or why it happens.*

Every bus controller is assigned a unique interrupt vector. When the bus controller raises an interrupt, it specifies the interrupt vector, and the CPU uses it to locate the bus controller's handler in the Interrupt Descriptor Table.

This handler function belongs to the driver that communicates with the bus controller. It then initiates the process of identifying the device.

Some bus specifications require the device to identify themselves, so they carry an identity. Other bus specifications don't require it, so the devices aren't obliged to have it.

For example, devices on the PCIe or USB buses are self identifying. They carry unique identifiers. But devices on simpler and older buses like I2C or SPI often don't.

How the devices that are attached to a non-self-identifying bus are identified? They are identified statically by the motherboard's firmware. The motherboard manufacturer writes a hardcoded blueprint into the laptop's ROM. The kernel reads this blueprint to know which device is available on which bus.

Why some buses are self-identifying and others aren't? It depends on the design goals.
  - For example, when everything is soldered on the motherboard, the designer knows which device is attached to what bus and where it is. A statically compiled table is enough here.
  - On the contrary, there is no limit to plug-and-playable hardware. The hardware needs a way to identify the device.
  - Some devices are small and simple enough that embedding an identity might not be feasible. Complex hardware, on the other hand, might already have space to accommodate the identity.
  - Some buses are designed for a wide range of devices, while others are designed for a specific type of devices.

---

For a self-identifying bus, the bus driver queries the device to identify itself. As per the bus spec, the device can have multiple identification fields, but for now, the three that concern us are: vendor ID, device ID, and class ID.

There are standard bodies (consortium of companies) for each bus. They assign the device manufacturer a Vendor ID. The vendor assigns the device a device (or product) ID. Each unit of that device has a serial number or something, that identifies the unit, but that detail doesn't concern us.

There is a third kind of identity, called the Class ID. The Standards Body defines the official list of Class IDs for the bus specification. The vendor selects the appropriate class ID for their device.

A Class ID identifies the type of a device. An M.2 SSD from Samsung has a different Vendor and Device ID than the one from WD. But both of them are M.2 SSDs, so they have the same Class ID.

Let's take an example to understand their importance.
  - There are so many keyboard-mouse vendors, but does every vendor write a driver for their products?
  - It's unlikely, and it is not required in the first place as they are all USB keyboard and mouse, so they speak the same language.
  - They all have the same Class ID, which identifies the driver for them.
  - However, some vendors have customizable keyboards. For example, RGB lights, programmable keys, etc.
  - To access those features, we need the vendor specific driver, for which, we need the Vendor and Device ID.
  - Obviously if there is an open specification for these features and the vendor follows it, there is no need for vendor-specific driver.

Therefore, Class ID helps to identify the generic driver, while Vendor ID and Device ID are used to identify the vendor-specific driver.

---

Each driver declares a compile-time list of IDs it supports. For example, the generic nvme driver declares `nvme_id_table[]` in [/root/drivers/nvme/host/pci.c](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/nvme/host/pci.c?h=v7.2.12#n4100) to announce all the devices it supports.

On line 4293, there is `PCI_CLASS_STORAGE_EXPRESS`, which refers to the PCI Class Code for storage controllers. It is defined as `0x010802` in [root/include/linux/pci_ids.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/pci_ids.h?h=v7.2.12#n27).

Any device on the PCIe bus that has this class code will be picked up by the nvme driver.

If we check the class code of the SSD on my system, we will get `0x010802`, the generic PCI class code for storage controllers.
```bash
$ cat /sys/bus/pci/devices/0000:02:00.0/class
0x010802
```

But the table also has entries for specific Vendor and Device IDs. Those entries are for devices that have a known issue that needs to be managed in a specific way.

These are the IDs associated with my SSD.
```bash
$ lspci -nn | grep -i nvme
02:00.0 Non-Volatile memory controller [0108]: 
Silicon Motion, Inc. 
SM2263EN/SM2263XT (DRAM-less) NVMe SSD Controllers 
[126f:2263] (rev 03)
```
  - Vendor ID: `126f`
  - Device ID: `2263`
  - Class ID (first two bits): `0108`

This corresponds to an entry on line 4134 for "Silicon Motion Unidentified". So my SSD also has a known issue for which the kernel needs to do some extra work to get it working.

---

When we install the kernel, a userspace program called `depmod` scans all the compressed kernel module binaries and compiles a flat text file: `/lib/modules/$(uname -r)/modules.alias`. The kernel supports different compression algorithms, so the suffix depends on which compression algorithm was chosen. For example, Debian 13 uses `xz`, so the modules are suffixed `.ko.xz`.

If a new module is added to the system later, `depmod` is executed to update this list.

For silicon capabilities like VMX, there are no bus or device Id. They are identified using the CPU assembly instruction `CPUID`.

For pseudo devices, there is no such drama. We will explore them later.

---

So the physical device is inserted into a slot. The bus controller has detected that and raised a hardware interrupt. The CPU jumps to the interrupt handler for the bus. The handler queries the device for its identity. The bus driver has the identity of the device now.

The bus driver creates an in-memory representation of the device.

A device has some state and a set of operations (just like a file or inode). Therefore, there is a standard layout for a device, called `struct device`. But a device doesn't exist in isolation. The existence of a device is closely associated with a bus. Therefore, some bus-specific state is required as well.

Therefore, the generic `struct device` template is embedded in the bus-specific device struct. For example, a PCIe bus has `struct pci_dev`, which has `struct device` in it.

---

After the in-memory representation is created, the matching device driver is needed to be located and attached to the device.


There are some structures relevant to the bus subsystem.

  1. `struct bus_type` represents a type of bus. There is one for each bus type. It is defined in [root/include/linux/device/bus.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/device/bus.h?h=v7.2.12#n24).
  2. `struct pci_bus` represents a single instance of a PCIe bus. It is defined in [root/include/linux/pci.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/pci.h?h=v7.2.12#n706).
  3. `struct pci_dev` represents a device on the PCIe bus. It is defined in [root/include/linux/pci.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/pci.h?h=v7.2.12#n343).
  4. `struct bus_driver` represents a driver for a type of bus. Like, `struct pci_driver` for a PCIe bus. It is defined in [root/include/linux/pci.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/pci.h?h=v7.2.12#n970).
  5. `struct device_driver` represents a driver for a type of device. Like, `struct pci_driver` for a PCIe device.





----

So the bus driver, I guess, enumerated the new device and fetched its identity. The physical device is detected and identified successfully. Now an in-memory representation is required. So, a `struct device` or something will be created for this device. It should contain information about the device, but what exactly, that I don't know yet. It may include vendor ID, product ID, class ID, and other IDs. An operations struct that lead the way to the functions in the driver, etc. I simply don't know the details, so I am not sure about the answer.

The driver then registers itself with the kernel.

Every bus maintains a simple linked list: its list of registered drivers. During bus initialization (done by the core kernel), each driver adds itself to the list.

When an interrupt arrives, the kernel walks the list, calling a driver-supplied function for each driver. The driver inspects the hardware to determine whether it is the correct driver for the interrupting device. If so, it claims the device and performs any necessary initialization. If not, it tells the kernel to move on to the next driver.

What if the bus reaches the end of the list and no driver matched? The driver doesn't exist in RAM.

The kernel creates a userspace event which is picked up by a userspace daemon, which locates the driver and loads it into memory.
