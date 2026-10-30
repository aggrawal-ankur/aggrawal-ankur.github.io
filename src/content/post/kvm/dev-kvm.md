---
title: "What is /dev/kvm in KVM?"
publishDate: "2026-10-26"
# updatedDate: "2026-M-D"
description: "This text aims to understand the /dev/kvm device used in KVM."
tags: [ linux-kvm ]
draft: true
---

# Premise

A text about KVM is, kind of incomplete, if it doesn't mention `/dev/kvm`. Almost all elementary writings about KVM has `/dev/kvm` in them. But what is `/dev/kvm` exactly?

Normally, an article defines `/dev/kvm` as a "character device file" and immediately proceeds to use it. The definition is not incorrect, but it is useful only to the people who understand what a character device file is.

My situation is that I only know the terms "text files" and "binary files". I don't understand what does a file means to the Linux kernel, let alone knowing the three words that define `/dev/kvm`.

This writing is an attempt to understand files in Linux so that I can understand `/dev/kvm` and move in my virtualization journey.

I prefer long writings, instead of a series. This is a significant time, energy and attention investment for a reader. Therefore, below are some notes for you so that you can evaluate if this writing is worth your valuable resources. I request you to read it before moving on further.

# Notes For The Reader

1. I have used the [*Linux v7.2.12*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/?h=v7.2.12) source tree as the reference for this exploration.

2. This writing explores various structures in the virtual file system (VFS). However, VFS is vast and this writing not an exhaustive guide about it.

3. Many of the the data structures that are relevant to this discussion have a lot of fields in them. Many fields, however, were observed to have no relevance in this pursuit. Therefore, they are omitted from this text. The rest of the members follow the same ordering as in the original structure.

4. Exploring the source is an exhaustive task. So I expect the code to be in a certain formatting style. Therefore, I have formatted the structures to my liking.

5. Structures in the kernel are observed to have two kinds of comments. 1) A huge block of multi-line comment explaining each member before the structure is defined, and 2) comments tied to specific members in a struct. Some comments were useful, others were not. I have removed the comments entirely.

6. Steps 3, 4 and 5 were taken to improve the signal. Formatting the source code and removing the comments doesn't change the implementation. The code is not altered by any means.

7. For all the struct definitions, links to the official [*git.kernel.org*](https://git.kernel.org/) web interface are provided to access the original definitions.

8. This is purely an investigative work. I have used the source code to build this understanding and it is possible that my interpretation of certain details is not how the kernel authors/maintainers intend to perceive it. If my interpretation feels incorrect to you, I welcome you to share your perspective on it. I welcome your corrections.

9. While I name this an *exploration (or expedition)*, it is important to understand that it doesn't mirror how I understood it. I have gone astray multiple times. If I mentioned everything in its raw form, it's meaning and worth will be questionable to you. Therefore, it has the exploratory nature but it is still guided by a version of me who has already achieved the objective. Also, it has gone through editorial work which, by design, removes some of the rawness.

"***Let's start this expedition.***"

# Where to start this exploration?

All the elementary articles that I have read describes `/dev/kvm` as a "device file", or a "character device file".

The most common usage of it is opening it with the `open()` syscall:
```c
int fd = open("/dev/kvm", O_RDWR);
```

This is the man page for the `open` syscall.
```bash
NAME
       open, openat, creat - open and possibly create a file

SYNOPSIS
       #include <fcntl.h>

       int open(const char *pathname, int flags, ...
                  /* mode_t mode */ );

DESCRIPTION
       The open() system call opens the file specified by pathname.  If the specified file does not exist, it may optionally (if O_CREAT is specified
       in flags) be created by open().
```

> *It has more things to say and we will explore them as required.*

This description matches what the articles say about `/dev/kvm`.

---

When I use `ls` and `file`, I get the following output.
```bash
$ ls -l /dev/kvm
crw-rw----+ 1 root kvm 10, 232 Oct 26 20:26 /dev/kvm

file /dev/kvm
/dev/kvm: character special (10/232)
```

The output of `file` supports the aforementioned definition of `/dev/kvm`. However, I am not familiar with this format of `ls`. For example, when I run `ls` on a markdown file, I get
```bash
$ ls -l dev-kvm.md
-rw-rw-r-- 1 username username 8631 Oct 26 22:56 dev-kvm.md
```

Focus on the content between "username" and "Oct".
  - For the markdown file, it is 8631, the size of the file (in bytes).
  - For `/dev/kvm`, it is `10, 232`. The output of `file` also have this, just in a different format, i.e. `(10/232)`.

The `c` in the output of `ls` might denote a "character device".

---

The description of `open()`, `ls` and `file`, all identify `/dev/kvm` as a character device file. This gives us another important question: "*what are the different types of files in Linux?*"

We are taught to explore the definition of a thing, followed by its types. That strategy didn't worked here.

For me, files are basically code files (.c, .py, ....), images, executable binaries, or plain text files. From that standpoint, the definition of a file is already pretty clear. But when you look at the types of files, it doesn't take much before you realize the problem. They don't fit the definition we are aware of.

To understand what a file really is, we have to start with the types of files.

# Types of Files

| Sr. | File Type | Symbol (`ls`) | Description |
| --- | --------- | ------------- | ----------- |
| 1 | Regular File | "-" | or an ordinary file, contains data and can be read from or written to. |
| | | | They come in different types. For example: text files (contains human-readable data), binary files (contains machine-readable data). |
| 2 | Directory | "d" | or folders, are special files that contain references to other files or directories. |
| 3 | Link File | "l" | is a file that points to another file or directory. There are two types of links: hard links and soft (or symbolic) links. |
| 4 | Character Device File | "c" | are special files that represent devices capable of sending and receiving data character-by-character. |
| | | | Keyboards and serial ports; /dev/null, /dev/tty, etc. |
| 5 | Block Device File | "b" |
| 6 | Pipe | "p" |
| 7 | Socket | "s" |


> *This list is available on the internet as well and that's where I got it from.*
> *"Block devices", "pipes", and "sockets" aren't relevant to this pursuit, so they are not discussed.*

I am sure we don't have to understand the list to realize that "*a file is more than a blob of human-readable or machine-readable text*".

This realization has costed me a lot of time, energy and attention. All the time, I was trying to understand files from that standpoint. Even when I realized the seriousness of the situation, I was still thinking in terms of that because I wasn't able to identify what was missing. This realization was the thing that was missing.

Now that we have realized that a file is more than text or binary data, we can start exploring what a file is.

# What is a file?

If you don't purchase an Apple laptop, it is highly likely that you get a Windows one. Laptops with a "Linux-based distribution" out of the box are still not common.

We can change the operating system of our laptop to a Linux-based distribution like Debian or Ubuntu, or other OS like FreeBSD. Does that change the underlying hardware? NO. The hardware is fixed, only the OS changes, that's why we have multiple operating systems.

Inside the operating system, we have multiple components, each designed to do a specific thing. There are drivers, a memory management system, processes and so on. 

It is obvious that we love ***choices***. However, not everything is swappable. For example, we can switch the OS, but not the memory management facility the chosen OS kernel provides.

---

There is a component called "***file system***". In simple words, a file system is designed to manage files. Because there are different types of files, there are different file systems for them.

For regular files, we have "***storage file systems***". There are different ways to manage the same storage hardware, each with certain priorities and trade-offs. Therefore, there are different storage file systems.

> *You can gloss over this [Wikipedia](https://en.wikipedia.org/wiki/File_system) article to get an idea of it, although it is not required.*

Different file systems means the kernel must support them. But how?

To manage this variety of filesystems, allow new ones to be created without havoc, and give userspace a single unified way to access any file, the Virtual File System (VFS) was created.

The VFS abstracts different file systems into one layer, allowing user space applications to call one single handler and the VFS determines what needs to be done.

Our next destination is the VFS.

# Virtual File System (VFS)

The virtual file system is best understood as a ***contract***.

Filesystem implementations are different, for obvious reasons.

For the kernel to manage different file systems, it defines what a file system is to the kernel. It defines the core "***feature set***" of a filesystem and the "***tradeoffs***" the kernel makes to bring this abstraction into existence.

The kernel defines the contract. If a problem could be modeled into that contract, the kernel can manage it as a "file".

The contract is defined such that it doesn't alter a filesystem's implementation, only the entrypoints are modeled in the contract. For example, take `read()`. "ext4" might read a file differently, compared to "XFS". All they have to do is to provide the entrypoint for `read()` to the VFS.

The next step is to understand what this "contract" looks like. 

Below is the feature set provided by the VFS.

| Sr. | Feature Set | Brief Contract Details | Kernel Structures |
| :-- | :---------- | :--------------------- | :---------------- |
| 1 | **The Entity**<br>*(Resource State & Metadata)* | Guarantees an independent, canonical identity for the resource that exists independently of active open sessions. | `struct inode`<br>`struct inode_operations` |
| 2 | **The Gate**<br>*(Universal Access Control)* | Provides standard permission checks before access is granted. | `struct inode` |
| 3 | **The Session**<br>*(Interaction State)* | Manages an active, stateful dialogue between a process and an entity. | `struct file` |
| 4 | **The Userspace Token**<br>*(Process Isolation Handle)* | Decouples userspace from raw kernel memory addresses by handing back an opaque, process-local integer (`fd`). | `struct files_struct`<br>`struct fdtable` |
| 5 | **The Grammar & Lifecycle**<br>*(Polymorphic Verbs & Cleanup)* | Defines uniform verbs (`read`, `write`, `ioctl`) that route dynamically to driver-specific function pointers. Guarantees deterministic resource and hardware cleanup upon explicit close or abrupt process crash when the final reference drops. | `struct file_operations`<br>`struct dentry` |

These are the tradeoffs the kernel makes to bring this abstraction into existence.

"***Syscall & Indirection Latency***"
  - Accessing a resource through a file forces a privilege boundary switch into the kernel, followed by multi-pointer dereference chains (fd $\to$ files_struct $\to$ struct file $\to$ struct inode $\to$ file_operations).
  - This adds microsecond latency that makes the file abstraction unsuitable for atomic, nanosecond-level operations (like CPU locks or high-frequency timers).

"***Kernel Memory Footprint***"
  - Each open file is stateful and consumes non-pageable kernel RAM (struct file, fdtable slots, locks, position cursors).
  - Managing hundreds of thousands of open descriptors imposes measurable memory overhead.

"***Interface Mismatch***"
  - The VFS grammar fundamentally assumes a linear byte stream (read/write).
  - Resources that don't fit a stream of bytes (like virtualization engines or hardware accelerators) are forced to rely heavily on ioctl(), losing compile-time type safety and standard error contracts in favor of arbitrary integer commands and raw memory pointers.

"***Process-Local Confinement***"
  - A file descriptor is strictly local to the process that opened it.
  - It cannot be directly shared across address spaces through global pointers, and each process remains constrained by strict descriptor limits, requiring deliberate kernel mechanisms to scale or pass access.

"***Concurrency & Lock Contention***"
  - Threads in a process share the exact same open file descriptions (struct file) rather than receiving separate copies.
  - Because mutable state like the read/write cursor (f_pos) is shared, concurrent I/O operations from multiple threads on the same descriptor must synchronize behind kernel locks (f_pos_lock), causing lock contention and serializing operations that callers might expect to run in parallel.


CONTINUE FROM HERE.


So, what is a file?

## What Is A File?

## What is a directory file?

## What is a link file?

> a hard link is like preserving references to the file. If one reference is destroyed, the other one could be used. As long as there is a reference, the file will be accessible.
> analogy of secret.
> what happens if the target file of a symlink is destroyed and a new file with the same name is created but with different intentions? The kernel has ways to deal with it.

---

The structures relevant to this exploration are defined in four separate files.

| Structures | Files |
| ---------- | ----- |
| `inode` and `inode_operations` | [*/root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| `file` and `file_operations` | [*/root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| `dentry` | [*/root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12) |
| `cdev` | [*/root/include/linux/cdev.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/cdev.h?h=v7.2.12) |
| `miscdevice` | [*/root/include/linux/miscdevice.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/miscdevice.h?h=v7.2.12) |
| `fdtable` and `files_struct` | [*/root/include/linux/fdtable.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fdtable.h?h=v7.2.12) |

## Index Nodes (or inode)

Inode (or i-node) stands for index-node.

---

**Note: Only 16/56 members are relevant. The complete struct can be accessed at [*/root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n762).**

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

  dev_t	 i_rdev;
  loff_t i_size;

  time64_t i_atime_sec;
  time64_t i_mtime_sec;
  time64_t i_ctime_sec;

  u32	i_atime_nsec;
  u32	i_mtime_nsec;
  u32	i_ctime_nsec;

  union {
    const struct file_operations *i_fop;
    void (*free_inode)(struct inode *);
  };

  union {
    /* used if the file is a pipe. */
    struct pipe_inode_info	*i_pipe;

    /* used if the file is a character device. */
    struct cdev	 *i_cdev;

    /* used if the file is a symbolic link. */
    char         *i_link;

    /* used if the file is a directory. */
    unsigned      i_dir_seq;
  };
};
```

Below is a description of each field.

| Field | Description |
| :---- | :---------- |
| `i_mode` | Bitmask encoding the file type (e.g. `S_IFCHR` for character special device, `S_IFREG` for regular file) and file access permissions (e.g. `0660`). |
| `i_uid` | User ID of the file owner. |
| `i_gid` | Group ID of the file. |
| `i_op`  | Pointer to `struct inode_operations`, defining metadata and directory tree functions. |
| `i_ino` | Inode number. Unique 64-bit identifier for this inode within the filesystem instance. |
| `i_nlink` | Number of hard links pointing to this inode. |
| `i_rdev`  | Device number (`dev_t`). Encodes `(Major, Minor)` numbers. Only meaningful for character and block device nodes. |
| `i_size`  | File size in bytes. For regular files, indicates content length; for device nodes like `/dev/kvm`, size is 0. |
| `i_atime_sec`, `i_atime_nsec` | Timestamp of the last file access (seconds and nanoseconds). |
| `i_mtime_sec`, `i_mtime_nsec` | Timestamp of the last file content modification (seconds and nanoseconds). |
| `i_ctime_sec`, `i_ctime_nsec` | Timestamp of the last inode status/metadata change (seconds and nanoseconds). |
| `i_fop` | Pointer to the initial `struct file_operations`. For character devices, points to `def_chr_fops` to route the initial `open()` into the character device subsystem. |
| `i_cdev` | Pointer to `struct cdev`. Cached in the union once the character device is resolved during open. |


## An instance of an inode, i.e. a file

It is an active instance of a file (or inode). 10 active instances means 10 `struct file` objects in memory, but the inode remains 1 only.

---

**Note: Only 8/19 members are relevant. The complete structure can be accessed at [*/root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1255).**

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

  loff_t  f_pos;
  file_ref_t f_ref;
};
```

Below is a description of each field.

| Field | Description |
| :---- | :---------- |
| `f_mode` | Bitmask of internal kernel access modes (e.g. `FMODE_READ`, `FMODE_WRITE`, `FMODE_LSEEK`). |
| `f_op`   | Pointer to the active `struct file_operations` dispatch table. |
| `private_data` | Generic pointer used by drivers to attach per-instance state. |
| `f_inode` | Pointer back to the underlying `struct inode` (which stores the device numbers `10, 232`). |
| `f_flags` | Status and access flags passed from userspace to `open()` (e.g. `O_RDWR`, `O_CLOEXEC`, `O_NONBLOCK`). |
| `f_path` | Contains the `struct dentry*` (filename `"kvm"`) and `struct vfsmount*` (the mounted `devtmpfs` instance) for this open file. |
| `f_pos` | Current byte offset in the file. |
| `f_ref` | Atomic reference counter tracking how many descriptors or tasks reference this `struct file`. The file and underlying driver state are destroyed only when `f_ref` drops to 0. |


## File Operations

The VFS provides standard, pre-built operation templates (def_chr_fops, simple_dir_operations, generic_ro_fops) so basic filesystems and devices don't have to reinvent the wheel.

Whenever a specialized subsystem or driver (like ext4, btrfs, or kvm) takes control of an open file, its custom file_operations table (kvm_chardev_ops) replaces the default pointer. The generic tables serve as the default baseline until the specific driver takes over the wheel.


**Note: Only 11/35 members are relevant. The complete structure can be accessed at [*/root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1921).**

```c
struct file_operations {
  struct module *owner;

	loff_t  (*llseek) (struct file *, loff_t, int);
	ssize_t (*read) (struct file *, char __user *, size_t, loff_t *);
  ssize_t (*write) (struct file *, const char __user *, size_t, loff_t *);

	int (*iopoll)(struct kiocb *kiocb, struct io_comp_batch *, unsigned int flags);
  __poll_t (*poll) (struct file *, struct poll_table_struct *);

 	long (*unlocked_ioctl) (struct file *, unsigned int, unsigned long);
  long (*compat_ioctl) (struct file *, unsigned int, unsigned long);

	int (*mmap) (struct file *, struct vm_area_struct *);
  int (*open) (struct inode *, struct file *);

  int (*release) (struct inode *, struct file *);
}
```

## Inode Operations

**Note: Only 8/26 members are relevant. The complete structure can be accessed at [*/root/include/linux/fs.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1998).**

```c
struct inode_operations {
	int (*permission) (struct mnt_idmap *, struct inode *, int);
	int (*unlink) (struct inode *,struct dentry *);
	int (*symlink) (struct mnt_idmap *, struct inode *, struct dentry *, const char *);
	struct dentry *(*mkdir) (struct mnt_idmap *, struct inode *, struct dentry *, umode_t);
	int (*rmdir) (struct inode *,struct dentry *);
	int (*rename) (struct mnt_idmap *, struct inode *, struct dentry *, struct inode *, struct dentry *, unsigned int);
	int (*setattr) (struct mnt_idmap *, struct dentry *, struct iattr *);
	int (*getattr) (struct mnt_idmap *, const struct path *, struct kstat *, u32, unsigned int);
}
```

## An Entry In A Directory File

An entry in a directory file is represented by a dentry, which literally stands for "a directory entry".

**Note: Only 5/16 members are relevant to us. The complete structure can be accessed at [*/root/include/linux/dcache.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12#n93).**

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
| `d_inode`  | Pointer to the associated `struct inode`. |
| `d_parent` | Pointer to the parent directory's dentry. For the root directory `/`, it points to itself. |
| `d_shortname` | An inline character buffer union. |
| | If the filename is short (like `"kvm"`), the string is stored directly inside the dentry struct to avoid a separate heap allocation. |
| `d_children` | Head of the linked list (`struct hlist_head`) containing all child dentries for a particular directory. |
| | Only populated if this dentry is a directory. For a leaf device node like `/dev/kvm`, this list is empty. |


All directories are files, so they have inodes.

The concept of file (the entirety of it) inside a directory file is represented by a dentry.

The inode has a filed called `i_mode` which determines the kind of a file. For a directory, it is `S_IFDIR`.

The dentry of the inode corresponding to a directory file has a field called `d_children` which represents the head of a linked list whose nodes are the dentries of the files in that directory. 

The d_parent in the dentries of these sub-files will point to the parent dentry.

The `d_children` of a dentry is valid only when the i_mode of the inode associated with it is `S_IFDIR`, i.e. the dentry is for a directory file. For all other file types, it is `NULL`.

***Note: How the kernel builds and manages them is a detail that is not relevant to this pursuit.***


## A Character Device

**Note: No member omitted. The structure can be verified at [*/root/include/linux/cdev.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/cdev.h?h=v7.2.12#n14).**

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

**Note: No member omitted. The structure can be verified at [*/root/include/linux/miscdevice.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/miscdevice.h?h=v7.2.12#n84).**

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


## Directory Entry Cache (`dcache`)

Also called the dentry cache.

The VFS implements the open(), stat(), chmod(), and similar system calls. The pathname argument that is passed to them is used by the VFS to search through the directory entry cache. This provides a very fast look-up mechanism to translate a pathname (filename) into a specific dentry.

Dentries live in RAM and are never saved to disc. They exist only for performance. But how they are formed? Similarly inodes.

## A directory file

A directory file associates inodes to filenames. The kernel has no special data structure to represent a directory.

## What is a device?

Normally, a "device" means physical hardware that can be touched, like a mouse, or a keyboard. However, the concept of "device" is much borader in the kernel.

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

## All open files in a process

In the userspace, a file is generally opened by calling `open()` or similar functions. That happens inside a process. Therefore, opened files are managed on a per-process basis.

The two structures used to achieve this are defined in `/root/include/linux/fdtable.h`.

**Note: 4/6 and 7/11 members are relevant. The complete structs can be accessed at [*/root/include/linux/fdtable.h*](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fdtable.h?h=v7.2.12#n24).**

```c
#define BITS_PER_LONG   64   /* /root/include/asm-generic/bitsperlong.h */
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

Below is a description of fields in both the structures.

### `struct fdtable`

| Field | Description |
| :---- | :---------- |
| `max_fds` | Current capacity of the file descriptor array (starts at 64, doubles dynamically if needed). |
| `fd` | Pointer to the array of open `struct file *` pointers. The integer file descriptor serves as the direct array index into this table (`fd[index]`). |
| `open_fds` | Bitmask tracking which integer descriptor numbers are currently open. Used to locate the lowest available unused integer index in `O(1)` time. |
| `close_on_exec` | Bitmask tracking which file descriptors have the `O_CLOEXEC` flag set. The kernel inspects this during `execve()` to close descriptors automatically. |

---

### `struct files_struct`

| Field | Description |
| :---- | :---------- |
| `count` | Reference counter tracking how many threads or processes share this file table. |
| `fdt` | Pointer to the active `struct fdtable`. Initially points to the embedded `&fdtab`, but is redirected to dynamically allocated heap tables if the process exceeds 64 open files. |
| `fdtab` | Embedded starter `struct fdtable` (capacity 64) to avoid dynamic heap allocation for common processes. |
| `next_fd` | Cache hint tracking the lowest candidate integer index likely to be free, avoiding repeated linear scans from 0. |
| `close_on_exec_init` | Embedded 64-bit starter storage backing the `fdtab.close_on_exec` bitmap. |
| `open_fds_init` | Embedded 64-bit starter storage backing the `fdtab.open_fds` bitmap. |
| `fd_array` | Embedded starter array of 64 `struct file *` pointers (`NR_OPEN_DEFAULT = 64`) backing `fdtab.fd`. |

---

So, basically, 
```c
fdtable.fd = files_struct.fd_array
fdtable.open_fds = files_struct.open_fds_init
fdtable.close_on_exec = files_struct.close_on_exec_init
```

The indirection here is crazy, but it is there for a reason.

As said, `fd_array`, `open_fds_init`, `close_on_exec_init` are starter variables. A process might open more files than the starter variables could handle. In that case, a new fdtable is allocated dynamically, and `files_struct.fdt` is updated to point to the new fdtable. Consequently, new `fd_array`, `open_fds_init`, `close_on_exec_init` are also required and dynamically created. The kernel updates `files_struct.fd` to point to the new fdtable and the members of this struct are made to point to the 3 newly created variables. The older ones remain in the struct because individual struct elements can not be freed and removed. To achieve this, these "extra" pointers are required.

It is also noticeable that close_on_exec_init and open_fds_init are declared as singleton arrays, instead of `unsigned long` variables. The previous reason is applicable to them as well. When these variables are allocated on heap, we get a pointer-to-variable, not the variable itself. When we assign it to the variables, we directly get its reference. If we declared them as normal variables, we have to do `fdtable.open_fds = &open_fds_init`. But thanks to array decay, we can just point it to the array and get a pointer.

### What is a file descriptor?

A File Descriptor (FD) is a process-local, unsigned integer handle that serves as an index into the kernel-managed array of open file descriptions (struct file *). It has no meaning outside the specific process that holds it.

The man page description of `open` has some stuff about it.




# Conclusion

The text feels more about files in general, rather than `/dev/kvm`. I am not sure how the trajectory would be different if I understood files previously.

I tried searching for articles on the internet, specifically about files and devices, not `/dev/kvm`, so that I can understand the primitives that make `/dev/kvm`. However, I couldn't find anything.
