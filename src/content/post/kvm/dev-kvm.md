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

9. While I name this an *exploration (or expedition)*, it is important to understand that it doesn't mirror how I understood it. I have gone astray multiple times. If I mentioned everything in its raw form, it's meaning and worth will be questionable to you. Therefore, it has the exploratory nature but it is still guided by a version of me who has already achieved the objective. Also, it has gone through editorial work which, by design, removes some of the rawness.

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

# Virtual FileSystem (VFS)

The kernel defines a generic filesystem abstraction, called the ***Virtual Filesystem***. The name suggests that it unifies different filesystems into a single interface.

As with every abstraction, the VFS provides certain constructs to enable this "unification". One of these constructs is "function placeholders", which represent a general set of operations that are applicable on a file.
> *What about the operations that don't fit in the general set? It is discussed later.*

These placeholders are intended to be filled by a particular filesystem implementation. That's how the underlying implementation is hidden and a unified interface with standard verbs is provided to the userspace.

These placeholders are defined as function pointers with the following syntax.
```c
return_type (*operation)(args);
```

Here, `operation` is a pointer to a function that takes `args` as arguments and returns a value of type `return_type`.

For example, a file can be present on any storage hardware, managed by any storage filesystem, but we read it with the same `read()` function. It is possible because the function that initiates the job of "reading a file" is registered into the `(*read)(...)` placeholder by a storage filesystem implementation and it is invoked whenever `read` is called.
```c
// Conceptually ....
read = &fs_specific_read;
```

Without the VFS, the userspace has to figure out which hardware device and which storage filesystem it should interact with in order to read a particular file.

With the VFS, we have shifted this search from the userspace to the kernel space. The userspace simply specifies the operation and the kernel figures out how to perform it.

---

If you look at it closely, a "file" is effectively "a bunch of bytes" on the disk, "***in case of storage devices.***" Since storage devices operate on blocks, reading such a file is essentially reading a set of blocks. "***Does that mean, the storage device has decided what "reading a file" is?***"

If the answer is yes, "***does that imply our current definition of files is dictated by storage devices?***" Think about it. What else do we consider a file, anyways?

If the storage hardware defines "what a file is", it is the one that will decide "what reading a file" would be.

In that case, replacing the storage hardware with something else should also change the definition of "file", thus, "reading a file" as well.

From this perspective, a "file" is simply an abstract idea and its definition is decided by an implementation, like the storage hardware defines a file as "a sequence of bytes".

Then what is a file, as an abstract idea?

---

In case of text/binary files, we have bytes that reside on a storage device. We have certain drivers that implement operations on these bytes, like read/write. We can have multiple such files on a single storage device.

  - If we consider the storage device a resource, then "bytes on the disk" is a particular entity of that resource.
  - The resource defines a set of operations on its entities.
  - To make its entities accessible from the userspace, the resource's software implementation registers these entities with the Virtual Filesystem, including the operations applicable on them. The VFS maintains an organized record of all the registered entities.
  - When the userspace requests an operation on an entity, the VFS looks up the entity's VFS record and invokes the function registered by the resource for that operation.

---

Right now, we are assuming that the storage device has only one kind of entity, i.e. "a bunch of bytes on the disk". However, it is not limited to it.
  - A storage device carries a lot of attributes, each of which requires attention to make the storage device function in the intended way.
  - Take "power management", for example. A storage device can't operate without power. But does the userspace have any business with this attribute? No.

A complex resource could have a large variety of attributes. Many of these attributes could be about critical components that the userspace has no business with. If the resource is allowed to define only one kind of entities, it is effectively making the entire resource accessible to the userspace.

That's the weak point in our model. The resource must be allowed to create multiple kinds of entities that map to different attributes of the resource. Each kind has a set of operations that are applicable to its entities. This allows a resource to make only the selected features available to the userspace.

Now the model becomes:
```
                                   Resource
                     __________________/|\___________________
                     |                  |                   |
Types                T1                T2                  T3
                  ___||____         ___||____           ___||____
                 /  |   |  \       /  |   |  \         /  |   |  \
                |   |   |   |     |   |   |   |       |   |   |   |
Entities        e1  e2  e3  e4    e1  e2  e3  e4      e1  e2  e3  e4
                |   |                 |   |
VFS Record      v1  v2                v3  v4
```

The entities that have a VFS record are by choice made available to the userspace, while the entities that don't have a VFS record are by choice retained for the kernel alone.

---

From this perspective, we have a resource that defines one or more types of entities, each with a set of operations to access and modify them.

When a resource makes a type of entities accessible from the userspace, through the VFS, the entity's representation in the VFS is what a file is.

To open a file, we create a session with the entity's VFS representation.

---

Let's apply this definition to the file types listed in the aforementioned table.
> *Please note that it includes details which aren't explored yet. Don't worry about them.*

  1. When the resource is a storage hardware, the entity is "a bunch of bytes on the disk", with operations, like `read`/`write`.
  2. When the resource is a filesystem's "name-to-inode" table, the entity is "a directory", with operations `getdents`, `lookup`, and `unlink`.
  3. When the resource is a path string, the entity is "a symbolic link", with operations like `readlink` (resolving the target path).
  4. When the resource is a raw block-addressable hardware (like an SSD without a filesystem on top), the entity is "a block device", with operations like `read`/`write`, and `ioctl`.
  5. When the resource is a non-block hardware device, a CPU silicon capability, or a software construct, the entity is "a character device" (like `/dev/kvm` or `/dev/null`), with operations like `ioctl`, `mmap`, `read`/`write`.
  6. When the resource is the network stack, the entity is "a socket", with operations, like `read`/`write`.
  7. When the resource is an in-memory kernel data structure, like a ring buffer, the entity is "a pipe" (used in IPC), with operations, like `read`/`write`.

In all the cases, the file is the VFS record of the entity.

---

***Therefore, the virtual filesystem is an accessibility layer connecting entities defined by different resources with the userspace via a unified interface. The VFS record representing these entities is what a file is.***

That's the crux of "types of files" in Linux.

To summarize, what we perceive as a file has 3 components.
  1. A resource,
  2. an entity of this resource, and
  3. a VFS record of this entity.

---

As with every abstraction, there are tradeoffs.
  - **The "one-size-fits-all" overhead**. The constructs in the VFS are generic, so they naturally include a large number of fields, many of which might not be relevant to all entities. But the penalty has to be paid.
  - **"Interface Mismatch"**. The VFS defines a set of function placeholders for file operations. They are usually the ones that are common to all kinds of files. When a resource has to define operations that don't fit in them, it has to use an `ioctl`, which has its own disadvantages that are discussed later.

It's time to explore the structures that implement these ideas.

# Kernel Structures

Now we will explore the structures that implement the resource metadata and per-session metadata. The resource that backs a file is discussed later.

The following structures are relevant to this exploration.

| Class | Structures | Files |
| ----- | ---------- | ----- |
| Resource Metadata | `inode` | [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| Resource Metadata | `dentry` | [*root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12) |
| Resource Metadata | `file_operations` | [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| Per-Session Metadata | `file` | [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| Process-level State | `files_struct` | [*root/include/linux/fdtable.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fdtable.h?h=v7.2.12) |


> *Please note that these structures don't exist in isolation. Their shape is heavily influenced by one another, which naturally creates a circular dependency. A lot of these fields won't make full sense right now, and I recommend you not to force it. They'll make sense once we have the full picture.*

## Resource Metadata (Inode)

***An inode (index node) is the kernel's master record for a single, distinct entity in a filesystem. It contains everything the OS needs to know about that entity, except its name.***
> *We will discuss the WHY later.*

Inodes are local to a filesystem. That's why, the same inode number can exist in multiple filesystems. That means, an inode number is not enough to identify an inode. We need to know the filesystem it belongs to as well. However, that detail is not relevant here, so we will skip it.

Note: Only 15/56 members are relevant here. The complete struct can be accessed at [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n762).

```c
struct inode {
  umode_t i_mode;

  kuid_t i_uid;
  kgid_t i_gid;

  u64    i_ino;

  union {
    const unsigned int i_nlink;
    unsigned int __i_nlink;
  };

  dev_t  i_rdev;
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
    struct cdev  *i_cdev;
    char         *i_link;
    unsigned      i_dir_seq;
  };
};
```

Below is a description of each field.

| Field | Description |
| :---- | :---------- |
| `i_mode`  | Bitmask encoding the file type (e.g. `S_IFCHR` for character devices and `S_IFREG` for regular files) and file access permissions (e.g. `0660`). |
| `i_uid`   | User ID of the file owner. |
| `i_gid`   | Group ID of the file. |
| `i_ino`   | A 64-bit unique identifier (inode number) for this inode in its filesystem. |
| `i_nlink` | Number of hard links pointing to this inode. |
| `i_rdev`  | Device number. Only meaningful for character and block device files. Discussed later in the devices section. |
| `i_size`  | File size in bytes. For regular files, indicates content length; for device nodes like `/dev/kvm`, it is 0. |
| `i_atime_sec`, `i_atime_nsec` | Timestamp of the last file access (seconds and nanoseconds). |
| `i_mtime_sec`, `i_mtime_nsec` | Timestamp of the last file content modification (seconds and nanoseconds). |
| `i_ctime_sec`, `i_ctime_nsec` | Timestamp of the last inode status/metadata change (seconds and nanoseconds). |
| `i_fop` | Pointer to the `struct file_operations` instance associated with this inode. Discussed later in the devices section. |
| `i_cdev`<br>in the last union | Pointer to `struct cdev`. Cached in the union once the character device is resolved. |
| `i_link`<br>in the last union | Pointer to the target path string when the inode represents a symbolic link. |


When a file is stored on the disk, we need some metadata to locate it on the storage hardware. This (among other storage fs specific) information is stored in another type of inode, called an on-disk inode.

The layout of the VFS inode is generic. It contains fields which aren't relevant to storage filesystems. If it is used as an on-disk inode, it would waste a lot of bytes. Moreover, different storage filesystems do it differently, so the layout of an on-disk inode is dependent on the storage filesystem.

When a file is accessed, its on-disk inode is read from the disk and a VFS inode is created from it.
> *A `struct file` is an instance of a `struct inode`, generating which requires reading an on-disk inode? Isn't that a chicken-and-egg problem? Yeah. However, it is not relevant to us, so we will not explore it.*

---

"***This exploration has no business with on-disk inodes, so throughout this discussion, the term 'inode' will represent a VFS inode.***"

## An Open Session (Instance of an Inode)

***A*** `struct file` ***represents an active, open session with an inode in memory.***

While the inode holds the permanent metadata about the resource, a `struct file` instance represents the metadata corresponding to an open session.

**Note: Only 7/19 members are relevant. The complete structure can be accessed at [*root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1255).**

```c
struct file {
  fmode_t f_mode;
  const struct file_operations *f_op;

  void          *private_data;
  struct inode  *f_inode;
  unsigned int   f_flags;

  loff_t      f_pos;
  file_ref_t  f_ref;
};
```

Below is a description of each field.

| Field | Description |
| :---- | :---------- |
| `f_mode` | Bitmask of internal kernel access modes (e.g. `FMODE_READ`, `FMODE_WRITE`, `FMODE_LSEEK`). |
| `f_op`   | Pointer to the `struct file_operations` table. Discussed later in the devices section. |
| `private_data` | Generic pointer used by drivers to attach per-instance state. Discussed in `/dev/kvm` part later. |
| `f_inode` | Pointer to the underlying `struct inode`. |
| `f_flags` | Status and access flags passed with `open()` from the userspace (e.g. `O_RDWR` and `O_CLOEXEC`). |
| `f_pos`   | Current byte offset in the file. Relevant to regular files, directories and block devices.<br>Irrelevant to non-seekable files like/dev/kvm, pipes, and sockets. |
| `f_ref`   | A `struct file` instance can be shared across processes by the means of `fork()`, or file descriptors can be copied using `dup()` or `dup2()`, in which case, they point to the same `struct file` instance.<br>This member counts those references. The `struct file` instance and the underlying state is destroyed only when `f_ref` drops to 0. |


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

An entry in a directory file is represented by `struct dentry`, which stands for "directory entry".

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
| | If the filename is short enough (like `"kvm"`), the string is stored directly inside the dentry struct to avoid a separate heap allocation. |
| `d_children` | Head of the linked list containing all child dentries for a particular directory file. |
| | Meaningful only if this dentry is for a directory file. For a leaf node, like `"kvm"` in `/dev/kvm`, this list is empty. |


### d_children

You may notice that the function of `d_children` is that of a pointer, but it is defined like a structure.

The type of `d_children`, i.e. `struct hlist_head`, is declared in [*root/include/linux/types.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/types.h?h=v7.2.12#n208).
```c
struct hlist_node {
  struct hlist_node *next, **pprev;
};

struct hlist_head {
  struct hlist_node *first;
};
```

So, it is a pointer. But why this indirection? It's not relevant, so I skipped it.

### The location of the character buffer

The type of `d_name`, i.e. `struct qstr`, is declared in [*root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12#n49).
```c
struct qstr {
  union { ... };
  const unsigned char *name;
};
```
> *The union is not relevant, so it is removed.*

The type of `d_shortname`, i.e. `struct shortname_store`, is also declared in [*root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12#n84).
```c
/* In 64-bit Kernel */
#define DNAME_INLINE_WORDS 5

/* 5x8 = 40 bytes */
#define DNAME_INLINE_LEN (DNAME_INLINE_WORDS*sizeof(unsigned long))

union shortname_store {
  unsigned char string[DNAME_INLINE_LEN];
  /* one element omitted */
};
```

`struct qstr dname` basically declares a character pointer.
  - If the filename is short enough, it is written into `d_shortname.string` and the kernel sets `d_name.name` to `d_shortname.string`. This saves us a heap allocation.
  - Otherwise, `d_name.name` points to a heap-allocated string.

So, in either case, `dentry->d_name.name` points to the filename.

If the kernel want to know whether the string is on the heap or not (like, to free it later), it can use the following function defined in [*root/fs/dcache.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/dcache.c?h=v7.2.12#n356).
```c
static inline 
int dname_external(const struct dentry *dentry)
{
  return dentry->d_name.name != dentry->d_shortname.string;
}
```

---

***Note: How dentries are constructed is a detail that is not relevant to this exploration, so it is skipped.***

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

That's enough of the Virtual Filesystem. Obviously it has more details, but they aren't relevant to us.

In our exploration, we have learned that what we perceive as a file is made up of two components.
  1. A resource.
  2. Metadata about the resource.

We have already explored the "*metadata*" and the "*instance*" parts of a file. However, the exploration was partial as many fields didn't made any sense. We have to explore the third component, i.e. the resource backing a file, to complete our understanding. This is where we will explore devices as well.

# The Resource Behind a File

If you remember the types of files, some of them have the term "device" in them, like "a block device file". This is confusing to me. Is it a "device", a "file", or both, or something else entirely?

"***Can a device be exposed as a file? If that's possible, it explains what a 'device file' is!***"
  - We have understood the VFS as a contract, and if a thing could be modeled into that contract, it could be exposed as a file in the userspace.
  - Therefore, it is not about "whether we can", but "why do we need to do so!"

---

Let's take the example of an NVMe SSD and understand this.
  - We have a PCIe slot on the motherboard. This is where the NVMe SSD attaches itself.
  - The SSD needs to be discovered, so a driver is required for that.
  - There will be some state associated with the SSD, so a software representation of the SSD is required.
  - We need the driver that knows how to communicate with an NVMe SSD.
  - The driver may or may not be in the memory already. If it is not already, it has to be loaded dynamically, so we need a mechanism for that.
  - After the driver is located, the in-memory representation of the device must be linked with it so that the driver code could be accessed.

A modern computer has a lot of devices, both in soldered and peripheral form. We must replicate this setup for all the devices that could possibly be connected to a computer.
  - Different devices connect with the motherboard differently, so different drivers are required to discover and manage them.
  - A device like an SSD could be accessed by multiple entities simultaneously, and without proper management (concurrency control), they would corrupt each other's state.

---

These are some of the things that need to be done, but they already read like a long list. Implementing them is another challenge.

Clearly, it is all critical work, so naturally it is the kernel that does it, which implies that the code that touches these devices is in the kernel space. But that code has no value if the userspace can't access it, as it is the userspace that uses these devices to do something, the kernel only does it on its behalf.

Therefore, we need a layer that exposes these critical kernel functionalities to the userspace in a controlled manner. What is that layer? ***The VFS***.

All we have to do is to create an inode, link it with the device and open an instance of that inode. We get immediate access to the device in userspace.

This answers why there are "block device file", or "character device file". These are devices that are exposed as files in the userspace.

---

It is noticeable that managing a device is a complicated process. Therefore, the kernel has a dedicated subsystem for it, called "***The Device Model***".

It is obvious to think that we have to explore the "device model" to understand "devices", but there is a catch. Let's see what that is.

# What is a device?

Normally a "device" is associated with physical hardware, something that can be touched, like a mouse, or a keyboard. However, the concept of "device" is much broader, just like files are more than bytes on a disk.

Therefore, I understand devices as an in-memory representation of a "***resource***". The resource could be '***physical***', '***silicon***', or '***virtual***'.

  1. There are devices which are backed by a real hardware plugged into an external slot, or soldered directly on the motherboard. For example, an NVMe SSD, or a keyboard-mouse pair.

  2. There are devices which are backed by a CPU silicon capability (hardware circuits and microcode built directly into the processor die). For example, the virtualization capability in x86 processors.

  3. There are devices which are backed purely by a software abstraction running entirely in the kernel space (either built into the core kernel binary, or loaded as a kernel module), with no hardware in any form. For example, `/dev/null`, or `/dev/zero`.

If you remember, we have used the term "resource" to describe one of the components of a file, i.e. the component that backs a file. A device could be considered one such resource that backs a file.

For example, regular files, directories and symlinks are backed by a filesystem abstraction. That abstraction could be implemented as a device underneath. Some of these devices are exposed as distinct files in the userspace, while others are not. Access to them is resolved internally.

---

I started exploring the device model from physical devices, in hope that I will steadily build enough (not complete, obviously, it is HUGE) understanding of the device model to understand `/dev/kvm`. But I was wrong.

Physical devices are very complicated for reasons which weren't obvious until I explored them. It is a deep trench, and unless understanding them is the primary motivation, I don't think it is fruitful to explore them.

Silicon capability devices and pseudo devices, on the other hand, are much simpler than physical devices. Since virtualization is a capability of the processor, it is also managed as a silicon capability device. Therefore, we will explore only this part of the device model (in the required detailing).

Honestly, knowing that `/dev/kvm` is a silicon capability device doesn't require much to know, so why did I not skipped physical devices earlier?

Since it is an exploration, I don't know what needs to be explored and what can be skipped safely. It's hard for me to trust anything. I get FOMO, and the only way it can be resolved is by finding out myself, and that's what I did.

Anyways, let's explore devices now.

# The Software Representation of a Device

In my observation, the software representation of a device is divided into three layers: the core, the specifics, and the userspace interface.

However, there are some nuances to this division, and we will explore them properly.

## The Core Attributes

There are certain attributes that are common to majority of the devices. They are represented by `struct device`, defined in [*root/include/linux/device.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/device.h?h=v7.2.12#n702).

This struct has 46 members, but only 3 are relevant to us.
```c
struct device {
  void  *driver_data;
  dev_t  devt;
  void (*release)(struct device *dev);
};
```

Below is a description of these fields.

| Field | Description |
| ----- | ----------- |
| `driver_data` | Pointer to the private scratchpad for the driver bounded to this device. |
| `devt`  | The device number (Major and Minor numbers). |
| `(*release)` | Destructor callback executed when the device's reference count drops to zero to free memory. |


This structure was supposed to represent the common attributes of a device, but only 3 attributes are relevant to us? What kind of core attributes these even are?

As mentioned, these fields are common to majority of the devices, not "ALL" the devices. There are many silicon capability devices that use these fields; the device for KVM also uses more than these 3 fields. However, the other fields aren't relevant to this discussion. They will only add noise.

Pseudo devices, on the other hand, don't use most of the fields in `struct device`. IOMMU, DMA, power management and bus related stuff, which constitute most of the `struct device`, is irrelevant to pseudo devices. However, the generic fields are still required.

Therefore, it won't be incorrect to say that `struct device` primarily represents the core attributes of a piece of hardware. For rest of the things that want to be exposed as a "device", it is the tax that you have to pay.

That's the first nuance in the 3-layered representation of devices.

## The Specifics

A device has attributes of its own. These attributes, combined with the core attributes, completes a device's representation in memory. This is achieved by creating a specialized structure that embeds a `struct device` alongside device-specific attributes.

A device can have a wide range of attributes. While it is possible to manage the entire set with a single device-specific structure, it might not be the best way to do it. For example, physical devices need power to run, but does the userspace has anything to do with power management? No.

Therefore, not all the attributes of a device are required to be exposed to the userspace. If there was a single device-specific struct, all the attributes will be exposed by default.

That's why, when a device has multiple attributes, the driver can split their representation across multiple structures. This allows the driver to choose which features to expose to the userspace and how.

All of these structures combined together represent the complete device, but the userspace doesn't require to access the complete device in order to request an operation.

For example, an NVMe SSD is connected on a PCIe bus, so it is represented by a `struct pci_dev` instance, but it also has a `struct nvme_dev` instance representing the NVMe specific attributes (and it might not be limited to these structs).

---

A device-specific structure can embed the core device attributes in two ways.

  1. A device-specific structure can embed a `struct device` instance directly. This is ***composition by value***.

  2. A device-specific structure can embed a pointer to the core device attributes, i.e. `struct device*`. This is ***composition by reference***.

A driver uses both of these mechanisms, and the reason is quite simple. The physical device is a single entity therefore, the count of the core attributes is single as well. Representing the remaining attributes with multiple structures doesn't imply we have to allocate the core attributes again.

That's why the core attributes are allocated once in one device-specific structure, and the remaining device-specific structures just refer to it.

For example, `struct pci_dev` embeds `struct device` by value, while `struct nvme_dev` embeds a pointer to this structure, i.e. `struct device*`.

---

This can get very complicated, but we don't have to worry about it, as the VMX capabilities of the processor are represented by a single device-specific structure, called `struct miscdevice`, which embeds a `struct device` instance directly.

## Exporting a device to the userspace

We want to expose a device-specific structure to the userspace. How we can do it? Using the VFS. How exactly?

We need an inode to represent the device in the VFS. Because inodes are specific to a filesystem, we need a filesystem specifically for this purpose.

`devtmpfs` is a pseudo (RAM-only) filesystem that is designed to create and manage the VFS specific state for a device. It is mounted at the `/dev` directory.
> *We do not need to understand what mounting a fs means.*
> *Just remember that the dentries and inodes associated with all the devices that are exported to the userspace are present in the `/dev` directory file.*

The inode for a device can be created in two ways.
  1. When a physical device is detected and the in-memory representation of the device is created, inode creation is triggered. `devtmpfs` creates an inode and a dentry in `/dev`.
  2. For silicon capability devices and pseudo devices, the associated driver may or may not be loaded in memory already. During boot, the system creates inodes and dentries for these devices in `/dev`. When a program opens these files, the kernel loads the associated driver in memory, if it is not present already.

When a physical device is removed from the system, the in-memory representation of the device is also removed. This triggers the removal of the inode and dentry from `/dev`.
  - If a process currently has the file open, the entry is unlinked from `/dev`, but the in-memory inode remains in RAM until `close(fd)` is called.
  - The driver is marked detached, and any future operation on the open descriptor will fail with `-ENODEV`.

---

Now we have the VFS inode for a device. How is this inode connected with the actual device?

### The Inode to Device Connection

"***If we were supposed to design this, how would we connect an inode with a device-specific representation?***" The answer is simple. We need a pointer to the device-specific representation.

There are so many device-specific representations, which one the inode should point to?

If we keep a `void*` pointer, the VFS inode layout will be bloat-free and only 8-bytes (on 64-bit systems) of memore is required. The catch is, we have to store device type information to identify which device this pointer is for.

If we keep separate pointers to all the device-specific structures, it will waste a lot of memory, as only one of them is active in an inode. If we use a union of pointers, it will only take 8 bytes on 64-bit systems, but we have to store the device type information to know which device this pointer is for.

Either way, the VFS inode layout is cooked. It will be no longer generic. Adding a new device, or removing an existing one means updating the VFS inode layout, which means compiling the kernel again.

How about pointing to the core device struct instead? We need only one pointer, and its type-information is known at compile-time, so no extra variable for device type information is required.
  - `struct device` is shared by all the device-specific structures for a physical device. How we are supposed to obtain the device-specific struct from this?
  - The device-specific structs embed this core struct in two different ways. Even if we take the union of pointers approach, storing both `struct device*` and `struct device**`, we need to know which one is active and behave accordingly.

---

Can you notice a similarity in all of these approaches (except that all of them failed)? They are trying to put a pointer to the device representation directly into the VFS inode. Is that the root of all problems?

We have already tried putting a direct pointer to the device into the VFS inode and we have only tasted defeat here. Let's try something else. And what exactly? We'll figure that out.

First of all, what is the problem? "***We have to connect the VFS inode with the device it is for.***" Let's start by finding the requirements that the solution must satisfy.

  1. It should be standalone and decoupled from the VFS entirely.
  2. The VFS inode should remain generic. It should not have any device specific fields or device type information.
  3. It must be able to accommodate new device types without requiring any modification.

Basically, what we are looking at is a generic way to find the intended in-memory representation for a device. It's like a middleman.
  - If a device wants to be discoverable in userspace, it must register itself with this middleman.
  - If the VFS inode needs to identify the device it is for, it asks the middleman.

It is clear that the middleman has to maintain some kind of registry.
  - When a device registers itself with the middleman, the middleman provides a token of some kind to it. This token uniquely identifies a particular device representation in the system.
  - The VFS inode should also have this token. The VFS inode invokes the middleman with this token and the middleman returns a pointer to the intended device representation. For this to work, the VFS inode must be provided this token somehow.
  - Also, the token must be opaque to the VFS inode. A hard requirement. We don't want any device specific drama.

If you think about it closely, you will find that something like this has already been discussed here.
  - A process can open multiple files and the kernel simply returns a file descriptor to it.
  - Does that fd reveal anything about the kernel state? No. It's a completely useless thing for the userspace process. Only the kernel knows what to do with it.

This should theoretically solve the problem. However, we've still got two problems to solve.
  1. How the VFS inode will get this token.
  2. Using the middleman for every file operation is sure to affect the performance.

Let's think about them.

We can provide the token at the time of inode creation? Yeah, we have to ensure that the device representation already exist in-memory. Only then the token will exist in the first place. We can consider this solved.

We can cache the device pointer in the VFS inode? But that suffers from the same problem. What we need is a general device representation that leads us to the specific device representation. It seems like a deadlock to me, but if this idea has merit, we will figure out something.

---

The centerpiece of this approach is the token. What does that look like? It could be a simple integer, just like an fd. Every device that registers with the middleman gets one.

The middleman then saves a pointer to the device representation in a data structure indexed by this token, just like an fd. But the problem remains the same. There is no one single composite device representation structure.

How about the middleman defining a generic struct? Every device that registers itself with the middleman gets one. The middleman can maintain an array of these structures. But again, the question remains the same. How it will lead us to the exact device representation?

It is clear that even the middleman generic struct can't hold a device pointer, for very obvious reasons. We have to find something else.

At this point, this device pointer is causing way too much trouble for us, so it is the time to ask the nuclear question. Is the VFS inode, or the generic middleman struct, supposed to hold a pointer to the composite device representation in the first place? At this point, every single idea leads to the same deadlock.

Let's change our perspective once again. What knowledge do we have for now?
  - We have a core device struct that represents features that are common to all devices.
  - We have composite device structures that represent an entire device function.
  - The driver for these composite devices creates and manages them.
  - There are multiple drivers in the kernel, each managing different device compositions.

When we say that the device will register with the middleman, who will actually initiate this registration? The device itself is just a struct. It isn't code. Only the driver that has created it can do that.

As discussed, a driver can create multiple composite device structures for different features of an actual device. Since the driver has created them, the driver has full knowledge of them: the composite device structures themselves, and all of their instances.

The driver already maintains these lists. Since these lists are per-driver, not a flat list of all the devices in the entire system, that can significantly reduce the lookup cost only if we can design the system such that our device search starts from the driver, not the device. Traversing a mega list of hundreds and thousands of devices v/s traversing a list of few tens of devices definitely makes the difference.

So the driver will assign a number to each device that needs to be exported to the userspace. Even better, the programmer already knows which composite device templates are supposed to be exported to the userspace. How about reserving a field that stores this number? The driver can simply access it directly.

So every device has a number local to its driver. Now the driver has to register these devices with the middleman. Earlier we have decided that the middleman assigns a token to each device. However, since the driver maintains the list of devices now, the driver has already assigned a number to them. So, instead of the devices, it is the driver that the middleman assigns a token to.

The flow would be like this:
  1. The VFS inode provides a number to the middleman.
  2. The middleman looks up the driver corresponding to this number.
  3. Now the driver looks up the exact device in the list. But wait.

But how the driver will know which device to look? The VFS inode has to contain both the driver number and the device number. That is not a problem.

The solution already seems complete, except the middleman struct. Where does that fit? Let's talk about it.

There are two ways to allocate it.
  1. On heap, through the kernel's memory allocator.
  2. As a part of the composite device struct.

Both are used in the kernel, depending on the situation.

If you remember, the composite device structure needs to have a field to store its token. This token has nothing to do with the device state. Instead, it is only important for the userspace. What else is required by a composite device that has meaning primarily for the userspace?
  - Think about it. What does the userspace actually access in a device?
  - The entrypoints defined to export to the userspace, i.e. the `file_operations` table.

While this table is a part of the composite device struct only, it doesn't represent the device's internal state. It is there for the userspace. So, how about we include this information in the middleman struct? But then the middleman struct becomes a struct that represents the exported state of a device? Exactly. That's what we need. The userspace has no reason to access the internal device state. It only needs the file operations table and a way to identify it. That's what the middleman struct is about. Embedding this struct directly into the composite device struct means no heap allocation and the export representation remains accessible in the composite struct only. Accessing the composite struct is just a `container_of()` operation for the driver. The driver will have no issues identifying the device to operate on. We will talk about this later.

Now let's talk about the VFS inode. It represents an object in the filesystem. In this case, the file is just a representation. But it is still a file. So, the VFS inode will have the `driver_number`, the `device_number`, and the `middleman_struct` pointer. Wait, we haven't decided if it will store this pointer or not. But since we are embedding the middleman struct into the composite struct, we have the middleman struct. We have the driver number. We have the device number. And this `open()` operation will also be invoked with the VFS inode. So, the `open()` operation can easily access the composite struct (through `container_of()`) and get the `file_operations` table. But how will the VFS inode know which driver has created this device? We will need to store the `driver_number` in the VFS inode.

---

If you notice, the middleman struct is nothing but a stable anchor inside the composite device struct, the exact thing we were tirelessly searching but couldn't find.
> *If you still can not wrap your head around the fact that why `struct device` could be that, I recommend you to hold on to it.*

This is the solution that the Linux kernel actually implements. Let's discuss the details.

# Formalization of the Terminology

## Token (Device Number)

We have talked about a token. Formally, it is called a "***device number***", which is represented as a 32-bit unsigned integer (`dev_t`).

It is split into two parts, called "***major***" and "***minor***" numbers.
  - The lower 20 bits make up the minor number and the upper 12 bits make up the major number.
  - Therefore, there are 4096 major numbers and over a million minor numbers per major number (1,048,576, to be exact).

Major 0 is unused.
  - For VFS inodes corresponding to non-device files, `i_rdev` is 0 to indicate that it is not for a device.
  - Major 0 is used as a way to tell the middleman to find a major number dynamically.

## Middleman

Each composite device structure is classified into one of the following before it is exported to the userspace.
  1. Block Devices
  2. Character Devices

So these are two middlemen.

We have talked about a central registry that this middleman would maintain. It is called `kobj_map`. It is defined in [*root/drivers/base/map.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/base/map.c?h=v7.2.12).

Both the classifications have used `kobj_map` as their central registry, but recently, block devices have switched to `xarray` instead.
  - This is the exact [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e418de3abcda8b102f737919e830024d1455938f).
  - I am not sure why, and I am not interested to find that out.

---

The block device classification is used for devices that handle data in terms of blocks.
  - For example, certain features of storage devices are best classified as block devices as storage devices handle I/O in terms of blocks.
  - Therefore, block devices have a very strict use case.

Block devices don't concern this exploration, so I have not dove into them.

Character devices, on the other hand, are best understood as a "***catch-all category***". If a device needs to be exported to the userspace and is not a block storage device, it is simply classified as a character device. The proof is in the `/dev` directory.
  - Open it in a GUI file manage, click on any file, and focus on the bottom.
  - There are only four types of files: directories, symlinks, block devices and character devices. Most of the non-directory files are character device files.
  - `/dev/kvm` is a character device. What characters does it deal with?
  - `video0` represents a video capture stream. What characters does it deal with?

A character device is simply an interface to export a hardware device, a particular feature of a hardware device, a silicon capability, or a software construct defined in the kernel, to the userspace.
> *That's why it is a catch-all category.*

Why it is called a character device is something I don't know. But I'd love to know.

Since character devices is what that concern us, we will talk only about them.

# Character Devices

The middleman for character devices is defined in [*root/fs/char_dev.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/char_dev.c?h=v7.2.12).

There are two ways in which a driver can request a major number.
  1. Ask for a specific major number and allocation would be denied if it is not available. `register_chrdev_region()` is used for this purpose.
  2. Just ask for a major number and let the middleman find one dynamically. `alloc_chrdev_region()` is used for this purpose.

The middleman compulsorily asks the driver to specify the count of minor numbers it needs corresponding to a major number.
  - The driver has to specify the lower bound minor number and the count of minor numbers.
  - Therefore, the final range that the driver reserves is `[baseminor, baseminor + count - 1]` for `major`.

A driver can claim 
  1. a set of contiguous minor numbers for a major number.
  2. multiple sets of contiguous minor numbers for the same major number.
  3. a set of minor ranges corresponding to different major numbers.
  4. all the minor numbers corresponding to a major number, effectively claiming the whole major number.

But there are some nuances to it, discussing which is out of the scope of this exploration. We don't require them anyways.


## Registry of Range Reservations

Whenever a driver requests a major number, the middleman creates a `char_device_struct` entry for it upon successful allocation. It is defined in [*root/fs/char_dev.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/char_dev.c?h=v7.2.12#n32). One field is omitted here.

```c
#define CHRDEV_MAJOR_HASH_SIZE 255

static struct char_device_struct {
  struct char_device_struct *next;

  unsigned int major;
  unsigned int baseminor;
  int minorct;

  char name[64];
} *chrdevs[CHRDEV_MAJOR_HASH_SIZE];
```

We can break it in two parts: the struct declaration, and the array declaration.
```c
struct char_device_struct {
  struct char_device_struct *next;

  unsigned int major;
  unsigned int baseminor;
  int minorct;

  char name[64];
};

static struct 
char_device_struct *chrdevs[CHRDEV_MAJOR_HASH_SIZE];
```

A `struct char_device_struct` represents one contiguous range reservation. These structures are organized into linked lists, instead of a flat registry.

`chrdevs` is an array of pointers, each pointing to a linked list of `struct char_device_struct`.

| Field | Description |
| ----- | ----------- |
| `next`  | Points to the next `struct char_device_struct` in the linked list. |
| `major` | The major number reserved by the driver. |
| `baseminor` | The lower bound minor number in the range of minor numbers reserved by the driver. |
| `minorct`   | The count of minor numbers reserved by the driver. |
| `name`  | The name of the driver. |


The highlight of this data structure is how the linked lists are populated. It uses `(major % CHRDEV_MAJOR_HASH_SIZE)` to determine the index of the linked list to which a `struct char_device_struct` should be added.

  - When a driver reserves major 10 for 0-20 minor range, its `char_device_struct` goes into `chrdevs[10]`, as `(10 % 255) is 10`. When a driver reserves major 10, but for 60-100 minor range, its `char_device_struct` goes into the same linked list.
  - When a driver reserves major 265 for any minor range, its `char_device_struct` also goes into the `chrdevs[10]` linked list as `(265 % 255) is 10`.

A `char_device_struct` only declares a range reservation. How is that range used, whether it is used at all, etc, is not any of its business. It lives until the driver is unloaded, or it frees the reservation.


## Userspace Representation of a Composite Device Struct

When the driver prepares a composite device struct for export, it assigns it a minor number corresponding to a major number.

The composite device will have a file operations table defined for it by the driver.

The device number (major-minor pair) and the file operations table for that composite device struct are packed into a `struct cdev` instance. It is defined in [*root/include/linux/cdev.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/cdev.h?h=v7.2.12).

```c
struct cdev {
  struct kobject kobj;
  struct module *owner;

  const struct file_operations *ops;
  struct list_head list;

  dev_t dev;
  unsigned int count;
} __randomize_layout;
```
  - *No member is omitted here.*

Below is a description of the relevant fields.

| Field   | Description |
| -----   | ----------- |
| `ops`   | The driver's function pointer table for userspace calls. |
| `list`  | Linked list tracking all open `inode`s pointing to this device (used to purge them if the device unplugs). |
| `dev`   | The starting 32-bit device number encoding the Major and starting Minor number. |
| `count` | The number of consecutive minor numbers this `cdev` instance is responsible for handling. |


Earlier we have discussed that each composite device struct is classified into a block device or a character device if it needs to be exported to the userspace. That means, one `struct cdev` corresponds to one composite device struct, which either represents a whole device, or a particular functionality in the device. This thing is still true, but there is one more thing.

We have discussed that a device can have multiple features which might be distinct enough to be represented as separate composite device representations. What about devices that have the same features multiple times? For example, take a USB Hub. It has multiple identical USB ports.
  - We can simply create one `struct cdev` representing the entire USB Hub.
  - We can assign each USB port's device representation a minor number and a function that directs control to the exact USB port based on the minor number.

That's the idea behind one one cdev managing multiple devices. That's why `struct cdev` has the `count` field. It indicates the total number of devices (minor numbers) this `struct cdev` manages.
  - When there one `struct cdev` per composite device, `count` is simply 1 and the device number represents the exact device token.
  - When there is one `struct cdev` for more than one composite device representation, the count of devices is indicated by `count` and the minor number in the device number is the `baseminor` of the minor range.

This detail is very crucial to understand `/dev/kvm` as well.

## Registry of all the registered Userspace Representations

`cdev_map` is the central character device registry. It is a record of all the composite device structures that are exported to the userspace.

It is a `kobj_map` instance, defined in [*root/drivers/base/map.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/base/map.c?h=v7.2.12). The file also includes the operations defined on a `kobj_map`.

```c
struct kobj_map {
  struct probe {
    struct probe *next;

    dev_t dev;
    unsigned long range;

    kobj_probe_t *get;
    void *data;
  } *probes[255];

  struct mutex *lock;
};
```
  - 2 members in `struct probe` are omitted.

`kobj_map` declares an array of pointers to `struct probe` linked lists. It is initialized on the heap by `kobj_map_init()`. `cdev_map`, which is the pointer to it, is declared on static storage.

| Field   | Description |
| -----   | ----------- |
| `next`  | Points to the next `struct probe` in the linked list. |
| `dev`   | The starting device number (major-minor pair) for this range. |
| `range` | The number of consecutive minor numbers this `probe` covers. |
| `get`   | The function pointer used to look up the actual device. *More on this later.* |
| `data`  | Pointer to the actual device data, i.e. `struct cdev` for character devices. |


`kobj_map` is quite similar to `chrdevs`.
  - Both declare an array of 255 pointers, each pointing to the head of a linked list.
  - The linked lists are populated using `(major % 255)`.

---

To understand this central registry, we have to understand `kobj_map`. There are four operations defined on it. I recommend opening [*root/drivers/base/map.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/drivers/base/map.c?h=v7.2.12) and walk along.

### kobj_map_init()

It is called by `chrdev_init()` in [*root/fs/char_dev.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/char_dev.c?h=v7.2.12#n671). It allocates a `kobj_map` instance on heap and returns a pointer to it, which is stored in `cdev_map`.

All the linked lists are initialized to a sentinel `struct probe` node. This sentinel node is very important as it is responsible to load a module on demand (if it not exist already).

The function allocates a zero-initialized instance of `struct probe` on heap. This instance is the sentinel node (probe) in every linked list.

Its device number (dev) is set to 1 and the range is set to `~0UL`. First of all, a minor number spans across 20 bits, then why the range variable is a 64-bit field? I am not sure why!

Let's understand this sentinel probe.

We know that major 0 is reserved. So, the smallest valid major is 1.
  - Since the lower bits of `dev` represents the minor number, when major is 1, `dev` is `1 << 20`. i.e. `1,048,576`. Here, the minor number is 0.
  - Therefore, the smallest possible value of `dev` is 1,048,576. Every valid device number is greater than or equal to 1,048,576.

When the range is set to `~0UL`, it means all 1s.

Every VFS inode will be initialized with a valid `i_rdev`, which will always be greater than or equal to `1,048,576`. Thus, `dev=1` becomes the sentinel node. Because its range is `~0UL`, it will match all the possible minor numbers.

It's highly likely that it doesn't make any sense right now, at least to me. Next we will discuss `kobj_map()`, which will make this clear. We will discuss `base_probe` in `kobj_lookup()`.

### kobj_map()

This function inserts a `struct probe` corresponding to a `struct cdev` in an appropriate linked list.

It is called by `cdev_add()`, defined in [*root/fs/char_dev.c*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/char_dev.c?h=v7.2.12#n466).

The table below lists the arguments this function takes and the actual arguments passed by `cdev_add()`.

| Argument Expected By `kobj_map()` | Argument Provided By `cdev_add()` | Description | 
| ---- | ---- | ---- |
| `struct kobj_map *domain` | `cdev_map` | Pointer to the central registry. |
| `dev_t dev` | `dev` | The device number. |
| `unsigned long range` | `count` | The number of minor numbers this `cdev` covers. |
| `struct module *module` | `NULL` |
| `kobj_probe_t *probe` | `exact_match` | More on this below. |
| `int (*lock)(dev_t, void *)` | `exact_lock` | No need to understand. |
| `void *data` | `p` | Pointer to the `struct cdev` instance. |


It starts by computing `n`. This is the most confusing thing in my understanding.

`MAJOR(dev)` is defined in [root/include/linux/kdev_t.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/kdev_t.h?h=v7.2.12#n10).
```c
#define MINORBITS	20
#define MAJOR(dev)	((unsigned int) ((dev) >> MINORBITS))
```

It is calculating the major number corresponding to two inputs. `dev` makes sense, but what does `dev + range - 1` mean? For `MAJOR`, both are treated as device numbers.

  - `dev` becomes `(major << 20) | minor`. So, `dev + range - 1` would be `(major << 20) | (minor + range - 1)`.
  - Therefore, `dev + range - 1` gives us the highest possible device number in the given range.

If a range is small, `MAJOR(dev)` and `MAJOR(dev + range - 1)` will be equal. But, if a range is large enough that it crosses the current major number boundary, then they will be unequal.
  - For example, take major 10 and baseminor 1,048,570. The device number would be: 11534336.
  - If the range is 40, `dev + range - 1` would be 11534376, which corresponds to major 11. So the range is split across two majors, which is what `n` represents.

The thing that is disturbing here is why a driver would choose a range which splits across two majors? I mean, the driver has all the information to prevent it. It has to pass the `baseminor` and the count of minor numbers. It can simply ensure that the range does not cross the major number boundary.

Fine. For some reason, the driver can request a range which splits across two majors. Why does `kobj_map` allows it? Why it doesn't deny that? I understand that the authors/maintainers are smarter and knowledgeable than me. If they have settled on this design, there is some reason behind it and I just want to know that. Simple.

Therefore, `n` represents the number of `struct probe` instances that will be inserted in the linked list.

Since there are only 255 linked lists, a value of `n` greater than 255 is resolved to 255.

For normal cases, this doesn't seem to be bothersome. It will be simply 1.

For some reason, the major number is called `index`, which doesn't make sense.
  - If `index` implies a position in an array, then it has to be used directly to subscript into the array. But `MAJOR(dev)` doesn't correspond to an index on itself.
  - The index is computed as `MAJOR(dev) % 255`, which is what the `for` loop uses as well.

Then we allocate `n` units of `struct probe` on heap. Again, for normal cases, this would be 1. Each probe's members are set as per the values provided by `cdev_add()`.

Next we traverse the `kobj_map` instance to find the correct linked list.

`p` is rewound `n` times as it is proceeded `n` times by the previous for loop so it was pointing one past the array of `struct probe`(s) created by `kmalloc_obj`. As usual, in the normal case, it will be just 1.

In normal cases, it should be pretty much:
```c
struct probe **s = &domain->probes[index % 255];

while (*s && (*s)->range < range)
  s = &(*s)->next;

p->next = *s;
*s = p;
```

It's a classic loop to maintain a sorted linked list. In any case, the new probe is inserted before the sentinel probe.

And it is done.

### kobj_unmap()

It is called by `cdev_unmap()`.

It starts with the same calculation of `n` and extraction of the major number in `index`. In normal cases, the outer `for` loop is a single iteration.

We identify the linked list and traverse it to find the probe we want to remove. That probe that has the matching device number and range is unlinked from the list and a pointer to it is noted in `found`. We break out of the loop and `kfree()` is called to free the memory.

### kobj_lookup()

It is called by `chrdev_open()` every time the VFS inode corresponding to a character device file is opened.

It starts by declaring three variables.
  - Pointers to `struct kobject` and `struct probe`.
  - A variable whose name is a little confusing, `best`, which is initialized to all 1s (`~0UL`).

Now the code is declared before `retry` label. We will explore this soon.

Now we start by identifying the linked list and starting with its first node.

We create three more variables which resemble the `struct probe` fields. Next comes the actual logic that determines whether a `struct probe` is a match to the provided value of `dev`.

```c
if (p->dev > dev || p->dev + p->range - 1 < dev)
  continue;
```
  - As we have discussed in `kobj_map_init()`, a valid value of `dev` is greater than or equal to 1,048,576.
  - Consider this question: "***what has to be true for an input `dev` to match a particular `struct probe`?***"
  - For an input `dev`, it strictly contains a major and a minor number. No baseminor or stuff. The `dev` for a `struct probe`, on the other hand, contains a major number and a baseminor.
  - For an input `dev` to match a `struct probe`, it must be in the range: `[p->dev, p->dev + range -1]`. The condition above, on the other hand, is strictly checking if an input `dev` is outside of this range. Is it?
    - `dev` must be greater than or equal to `p->dev` to fall in its range, not less than it.
    - `dev` must be less than or equal to `p->dev + range -1` to fall in its range, not greater than it.
  - Therefore, this condition implies that if an input `dev` is not in the range of the current probe, move to the next iteration.
  - Suppose the whole linked list is traversed and we are on the sentinel probe now. Does this condition still hold? Let's check.
    - `dev` must be greater than `p->dev` to be in the range. A valid `dev` is a decent non-zero value, while the `p->dev` of a sentinel probe is 1. That means, this condition will be false.
    - `dev` must be less than `p->dev + range -1` to fall in its range. Now evaluate the expression. It is obvious to think that `1 || 2**20` will be `2**20`, and any valid `dev` (except the first one) could be greater than it. However, remember that `p->range`, while representing a 20-bit value, is not in a 20 bit container. It is inside a 64-bit container, with all bits 1. The expression is effectively `p->range < dev`, which is always going to be false because `dev` has the lowest bit set, while `p->range` has all the bits set.
  - Therefore, if this `if` executes, the `probe` is not a match.

For valid probes, the second `if` will always be false. Even if the probe reserves the whole 20-bit space, it will still be magnitudes small than `~0UL`. And the range can not be set more than 20-bits. If it is set so, it is the sentinel probe.

We will get back to the second if block soon. The third one is not interesting for us, so we will leave it.

So, if the first `if` has passed, either have found a matching probe, or the sentinel probe. Either way, we move forward. We extract `owner`, `data` and `probe` in locally reserved variables.

Then we call the `probe` function with device, the index and some `void` data. Check if `kobj` is not `NULL`, and return `kobj`. Otherwise, we jump to `retry` label with `goto` and repeat the same thing.

---

`kobj_probe_t` is defined in [*root/include/linux/kobj_map.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/kobj_map.h?h=v7.2.12).

```c
typedef struct kobject *kobj_probe_t(dev_t, int *, void *);
```

I am more tuned to the asterisk being on the left side. When it is on the right side, it confuses me.
```c
typedef struct kobject* kobj_probe_t(dev_t, int *, void *);
```

`kobj_probe_t` is an alias to a function that takes 3 arguments and returns a pointer to a `struct kobject` instance.
> *It is a function type, basically.*

`kobj_probe_t *probe` declares `probe` as pointer to `kobj_probe_t` function.

---

If we open `char_dev.c`, we can find two functions with `strut kobject*` as their type. Both are fairly simple.
```c
static struct kobject*
exact_match(dev_t dev, int *part, void *data)
{
	struct cdev *p = data;
	return &p->kobj;
}

static struct kobject*
base_probe(dev_t dev, int *part, void *data)
```{
	if (request_module("char-major-%d-%d", MAJOR(dev), MINOR(dev)) > 0)
		/* Make old-style 2.4 aliases work */
		request_module("char-major-%d", MAJOR(dev));

	return NULL;
}
```

When `kobj_map()` is called by `cdev_add()`, it passes `exact_match()` as the `probe` function argument required by `kobj_map()`. Therefore, every non-sentinel `struct probe` has its `probe` function pointer pointing to this `exact_match()` function. For sentinel probes, the `probe` function pointer points to the `base_probe()` function.

If the matched probe is not the sentinel probe, `exact_match` is called and the pointer to the `struct kobject` instance inside the `struct cdev` instance is extracted and returned. A pointer to the `struct cdev` instance associated with the device is stored in `p->data` is passed to it. Remember, `kobj_map` was used by block devices as well, which explains why `data` is of the type `void*`. Later on, `chrdev_open()` operates on it, which we will discuss shortly.

If it was the sentinel probe, then `base_probe` is called, which calls `request_module()`.

You might wonder what is `*index`. Both the probe functions expect itt and none of it actually use it. So I don't know what's the point of it. Let's ignore that for now.

In case of the sentinel probe, `request_module()` is called, which initiates the process of loading the relevant kernel module. We don't have to understand how it does it.

`request_module()` can succeed, or fail. Regardless of that, `NULL` is returned to indicate the sentinel probe has tried loading the module and we can go retry the lookup.

Loading a module doesn't only means loading it in the memory. It has to be initialized. When the module initializes itself, it sets up the relevant device representations in memory and updated `cdev_map`. If the module was loaded successfully and no error occurred while updating the `cdev_map`, the entry we were looking for is now present in the `cdev_map`. And `kobj_lookup()` will now succeed, so a retry is triggered with the help of `goto`.

This time, when the fn reaches the second if block, it will fail it, regardless of the module was loaded or not. How?
  - `best` was initialized with `~0UL` and it was reduced by 1 in the previous attempt. If module loading succeeded, the current probe is a non-sentinel probe. Even if all the 20 bits of the range are set, it is still magnitudes smaller than `~0UL`.
  - If module loading failed, p->range would be `~0UL` as it is the sentinel node, and subtracting one would make it the same as `best`, which indicates that we have already tried module loading, which has failed, so exit now.

That's how a valid probe is searched. Now let's read char_dev.c. There are lots of them, which is obvious as they represent the whole lifecycle of it, but we don't need that much depth.

----

### cdev_init()

It takes a pointer to the `struct cdev` in the composite device struct. It iniatlizes all the members to zero.
  - Initializes the inode list head.
  - Initializes the kobject.
  - Sets its file pointer to the table of file operations passed by the driver.

### cdev_alloc()

We know that `struct cdev` could be embedded directly in the composite device struct, or could be allocated on heap when a case requires it. This function is used for that purpose.
> *We will see where it is used later.*

It allocates one on heap (`kzalloc_obj`, so zero-initialized), initializes its list head and kobject, and returns a pointer to it.

### chrdev_open()

In [root/fs/inode.c](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/inode.c?h=v7.2.12#n2679), there is a function called `init_special_inode`.
  - It runs whenever a VFS inode is created for a device file.
  - It takes an inode and sets the file_operations table pointer. On line 2684, it sets it to `&def_chr_ops` for character devices.

Therefore, all the VFS inodes corresponding to a character device have their `file_operations` table set to `&def_chr_ops` initially, which is defined in char_dev.c.
```c
const struct file_operations def_chr_fops = {
	.open = chrdev_open,
	.llseek = noop_llseek,
};
```
  - Don't worry about `.llseek`.

Whenever a character device file is opened using the `open()` syscall, the control eventually reaches `def_chr_ops.open()`, which resolves to `chrdev_open()`.
> *We will talk about this flow in detail later.*

That's how `chrdev_open()` receives the `struct file` and `struct inode` pointers.

It calls `kobj_lookup()` with `inode->i_rdev` as the device number. As discussed,
  - if the `cdev` representation is already registered with the `cdev_map`, a pointer to the `kobject` instance inside it is returned.
  - if the `cdev` representation is not registered yet, `kobj_lookup()` tries to load the corresponding kernel module and get the device registered with it. If succeeded, the expected `kobject` pointer is returned, otherwise, `NULL`.

If `kobj_lookup()` returns `NULL`, `-ENXIO` is returned, which means no such device or address ([root/include/uapi/asm-generic/errno-base.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/uapi/asm-generic/errno-base.h?h=v7.2.12#n10)).

If not null, `container_of()` is used to find the `struct cdev` instance. This pointer is cached in `inode->i_cdev` so that successive operations don't have to undergo lookup.

Next it extracts the actual `file_operations` table associated with this character device and assign that pointer to the `struct file` instance's `f_op`.

If the driver's provided file pointer table has an entry for the `open()` fn, it is called. It is not mandatory, but many drivers provide it. Two possible reasons are:
  1. When a `cdev` represents multiple devices, the `open()` resolves the actual device associated with the minor, as the cdev only represents the range record here. That function further updates the file operations table pointer and attaches driver specific state to the `struct file` instance.
  2. If the driver involves per instance data, that needs to be attached to the file instance, and the open() does that.

That's `chrdev_open()` for you.

----

We can notice that everything here is structured around `struct kobject`. When both char devices and block devices used `kobj_map`, `struct kobject` acted as a stable anchor inside a struct which is not known to `kobj_map`.

# Miscellaneous Devices

If a driver wish to define only one device for the userspace accessibility, they would have to claim one major and one minor. This thing happening on a large scale would pollute the cdev_map, slowing down lookups, among other things that I would love to know.

Then there are devices which offer the same feature multiple times.

Earlier, major numbers were scarce (255 only). For every device register, you need a major before you get a minor.

For these reasons, miscellaneous devices were introduced. The miscellaneous subsystem reserves a fixed major number, i.e. 10, and any driver can hook into it and request a minor number for their device.

As per the rule, the miscellaneous subsystem gets a cdev, and the devices that hook into it don't. Instead of `struct cdev`, they get a `struct miscdevice`, which is strictly for one device. No range drama. The misc subsystem ensures connecting the device with the userspace.

The virtualization machine extensions, which are exported as KVM, also use the miscellaneous subsystem. Remember (10/232) in the output of `file`? That's the identity of the `/dev/kvm` character device file, i.e. major 10 and minor 232.

```bash
$ file /dev/kvm                               
/dev/kvm: character special (10/232)
```

The whole subsystem is defined in two files: [root/drivers/char/misc.c]() and [root/include/linux/miscdevice.h]().

## misc_init()

It claims the major number 10 for the misc subsystem by registering a cdev for it. 

The highlight of this is `&misc_ops`, which is passed in place of the `file_operations` table for this character device.

```c
static const struct file_operations misc_fops = {
	.owner   = THIS_MODULE,
	.open    = misc_open,
	.llseek  = noop_llseek,
};
```

It defines `misc_open` as the `open` function. We will explore it soon.

## misc_register()

It is used to register a device in the miscellaneous subsystem.

The miscellaneous subsystem allows a driver to request a minor number in two ways.
  1. A fixed minor.
  2. A dynamically chosen minor.

Thr driver creates a `miscdevice` struct.
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

If the minor is set with a number less than 255, it's a fixed minor number request. If the minor is set to 255, it is a dynamic minor request.

The function starts by evaluating what type of request it is.

If the minor is set to anything else, i.e. `>255`, the request is rejected. Otherwise, the process of minor number allocation is started.

If it is a dynamic minor request, `misc_minor_alloc()` is called directly to find and allocate a free minor number.

If it is a fixed minor request, the driver traverses `misc_list`, a doubly linked list of all the registered miscellaneous devices to check if the request minor number is free. If it is, `misc_minor_alloc()` is called to allocate it.

If allocation was successful, the registration is added into `misc_list`.

## misc_open()

It starts by extracting the minor number from `inode->i_rdev`.

It traverses the `misc_list` linked list and find the node that matches with the minor number in the inode.

If a match is found, the pointer to the `struct miscdevice` is cached in `c` and the pointer to the `file_operations` table is extracted from it and cached into `new_ops`.

If it is a fixed minor (i.e. `<255`) and `new_ops` is `NULL`, the driver associated with the `miscdevice` is not in the memory yet. So the module is loaded dynamically with `request_module()` and the list is traversed again to find the miscdevice pointer and the file operations table. If it has failed, we return "No such device or address".

The `miscdevice` is attached to the `struct file` instances `private_data` field. Why thought? And the `file_operations` table, which was oreviously for the misc system, is replaced by the driver's table. If the driver defines it's own `open()`, it is executed, otherwise returned.

That's the miscellaneous subsystem.

## ioctl(): Input/Output Control System Call

The driver exists in the kernel space, hence the functions it defines also exist there. These functions are accessed by a userspace application.

Userspace apps rely on system calls to transition to ring 0. That means, we need the same syscall mechanism to access these driver functions. If every entrypoint function in a driver is defined as a system call, that will pollute the system call table (Linux ABI), but we need the same mechanism.

Basically, we need a method to define custom system calls, such that
  1. the core system calls table remains untouched,
  2. access to arbitrary entrypoint functions inside a driver can be provided as system calls,
  3. no central registry of these "custom system calls" is maintained.
  4. these custom system calls have a transient existence, where they exist as long as the provider exist (driver is in memory) and they vanish once the driver is unloaded from memory.

To achieve this, the kernel has created a system call whose only purpose is to allow a driver to export its entrypoint functions as system calls.

This system call is `ioctl()`. It stands for "***Input/Output Control***".

It is defined in [root/fs/ioctl.c](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/fs/ioctl.c?h=v7.2.12).

We know that every driver defines a `file_operations` table, which contains pointers to all the functions it wants to export.

Let's look at [root/virt/kvm/kvm_main.c](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/virt/kvm/kvm_main.c?h=v7.2.12).

Search for "struct file_operations". We can find 9 occurrences of it, 8 of which are for actual pointer tables, of which, four are relevant to us.
```c
static struct file_operations kvm_vcpu_fops = {
	.release        = kvm_vcpu_release,
	.unlocked_ioctl = kvm_vcpu_ioctl,
	.mmap           = kvm_vcpu_mmap,
	.llseek		= noop_llseek,
	KVM_COMPAT(kvm_vcpu_compat_ioctl),
};

static struct file_operations kvm_device_fops = {
	.unlocked_ioctl = kvm_device_ioctl,
	.release = kvm_device_release,
	KVM_COMPAT(kvm_device_ioctl),
	.mmap = kvm_device_mmap,
};

static struct file_operations kvm_vm_fops = {
	.release        = kvm_vm_release,
	.unlocked_ioctl = kvm_vm_ioctl,
	.llseek		= noop_llseek,
	KVM_COMPAT(kvm_vm_compat_ioctl),
};

static struct file_operations kvm_chardev_ops = {
	.unlocked_ioctl = kvm_dev_ioctl,
	.llseek		= noop_llseek,
	KVM_COMPAT(kvm_dev_ioctl),
};
```

`kvm_chardev_ops` is registered with `struct miscdevice` instance corresponding to the character device file `/dev/kvm`. It handles system-wide capabilities. Check line 5586.
```c
static struct miscdevice kvm_dev = {
	KVM_MINOR,
	"kvm",
	&kvm_chardev_ops,
};
```

`kvm_vm_fops` handles the VM-wide configurations.

`kvm_vcpu_fops` handles vcpu related stuff.

`kvm_device_fops` is used for emulated hardware devices inside a virtual machine.

---

Remember the `open()` function in `struct cdev` instance that manages multiple devices (minors)? It basically is a switch case that traverses a list and finds the appropriate `file_operations` table.

Similarly, `unlocked_ioctl` is a function pointer to a function that takes the ioctl code and argument and resolves it to the intended driver function.

That's how you define custom system calls.

# Anonymous FS

If you have already explored an elementary `kvm` guide, you'd know that there are three file descriptors involved here. This is an excerpt from a very famous guide, called [kvm-hello-world](https://github.com/dpw/kvm-hello-world/blob/master/kvm-hello-world.c).

```c
struct vm {
  int sys_fd;
  int fd;
  char *mem;
};
vm->sys_fd = open("/dev/kvm", O_RDWR);
vm->fd = ioctl(vm->sys_fd, KVM_CREATE_VM, 0);

struct vcpu {
  int fd;
  struct kvm_run *kvm_run;
};
vcpu->fd = ioctl(vm->fd, KVM_CREATE_VCPU, 0);
```
  - One fd for `/dev/kvm`.
  - One fd for the `vm`.
  - One fd for the `vcpu`.

If you recall our understanding of the VFS, we know that a file descriptor is just an index into the file descriptor table, which contains pointers to `struct file` instances. Each `struct file` instance is associated with a `struct inode` instance.

We are receiving `fd`s here, so it is natural to ask which `struct file` instances they are associated with.
  - `vm->sys_fd` corresponds to the `struct file` instance of the VFS inode associated with `/dev/kvm`.
  - What does `vm->fd` and `vcpu->fd` correspond to?

They belong to an anonymous VFS inode. Let's understand them.

---

Physical devices and silicon capabilities are a piece of hardware. But in-memory resources, or virtual devices, have no hardware backing them.
> *Remember, the driver only represents the operations defined on the files, not the resource itself.*


There is a filesystem, called the anonymous filesystem, or `anon_inodefds`, which is a pseudo filesystem. It is completely invisible to the userspace. It is never mounted anywhere. It is defined in [root/fs/anon_inode.c]().

This filesystem only consists of one inode allocated by `anon_inode_init()` during boot. Whenever a subsystem requires a file descriptor to a resource that has no physical backing, it asks this inode to return a fd to it using `anon_inode_getfile()`.

You may ask, "who deals with the `file_operations` table drama?" It is literally passed to `anon_inode_getfile()` as an argument, so as driver's private data. It is literally assigned and that's it.

```c
static struct file *__anon_inode_getfile(
	const char *name,
	const struct file_operations *fops,
	void *priv, int flags,
	const struct inode *context_inode,
	bool make_inode
){
  struct file* file;
  ....

	file = alloc_file_pseudo(
    inode, anon_inode_mnt, name, 
    flags & (O_ACCMODE | O_NONBLOCK), 
    fops
  );

  file->private_data = priv;
  return file;
}
```

`alloc_file_pseudo()` is define in [root/fs/file_table.c](). It calls `alloc_file()`,  which calls `file_init_path()`, which initializes this `struct file` instances f_op to the pointer passed by the caller.

That's it. The whole drama is resolved instantly.
