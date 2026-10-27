---
title: "What is /dev/kvm in KVM?"
publishDate: "2026-10-26"
# updatedDate: "2026-M-D"
description: "This text aims to understand the /dev/kvm device used in KVM."
tags: [ linux-kvm ]
draft: true
---

A text about KVM is kind of incomplete if it doesn't mention `/dev/kvm`. Almost all elementary writings about KVM has `/dev/kvm` in them. But what is `/dev/kvm` exactly, beyond "***a character device***"?

This writing attempts to understand `/dev/kvm`.

# Notes For The Reader

Everything is grounded in Linux v7.2.12.

This writing explores various components in the virtual file system (VFS) and the device management layer. However, this writing is not a guide about them. I have found these components necessary to understand `/dev/kvm`, hence I have explored them. Therefore, this text must not be considered suitable for understanding the VFS layer and device management layer in depth.

---

Many of the the data structures that are relevant to this discussion have a lot of fields in them. Many fields, however, were observed to have no relevance in this pursuit.

The contents of the structures were not formatted the way I needed, plus the uneven comments were also making it hard for me to understand them.

Therefore, to improve signal, I have removed all the comments from the structures and only the relevant fields in these structures are discussed here.

For all the struct definitions, links to the [*git.kernel.org*](https://git.kernel.org/) web interface are provided to access the complete struct definitions.

# Where to start this exploration?

All the elementary articles that I have read describes `/dev/kvm` as a "device file", or a "character device file".

The most common usage of it is opening it with the `open()` syscall:
```c
int fd = open("/dev/kvm", O_RDWR);
```

If we open the man page for the `open` syscall, we get the following description: "*open and possibly create a file*".

That means, "/dev/kvm" is a file. This matches what the articles say about it.

When I use `ls` and `file`, I get the following output.
```bash
$ ls -l /dev/kvm
crw-rw----+ 1 root kvm 10, 232 Oct 26 20:26 /dev/kvm

file /dev/kvm
/dev/kvm: character special (10/232)
```

The output of `file` supports the aforementioned definition of /dev/kvm. The `c` in the output of `ls` might denote a "character device". However, I am not familiar with this format of `ls`.

For example, when I run `ls` on a markdown file, I get
```bash
$ ls -l dev-kvm.md
-rw-rw-r-- 1 username username 8631 Oct 26 22:56 dev-kvm.md
```

Focus on the content between "username" and "Oct".
  - For the markdown file, it is 8631, the size of the file (in bytes).
  - For /dev/kvm, it is `10, 232`. The output of `file` also have it, i.e. `(10/232)`.

So, /dev/kvm is a special file, called a character device file. I have some questions.
  - What is a file? What identifies as a file in Linux?
  - What are the different types of files in Linux? How they are represented?

Since I don't have answers to these questions, I will start with them.

---

One of my principles is to clear the ground before I explore the thing I exactly came for. This is how I deal with FOMO.

Internet is filled with information, both shallow and deep. Modern systems are sophisticated and context is distributed across various components. My habit of asking questions increases the amount of FOMO I have to deal with.

"*What if I don't explore this and it was a prerequisites to understanding the thing I am here for?*" 
  - This question haunts me.
  - Instead of wasting time, energy and attention procrastinating, I rather prefer clearing the ground first. It feels like a waste of time, but it isn't, at least for me.

---

Before we ask what is a file, we need to understand how files are stored and accessed. While this sounds absurd, by my own definition, like how can I understand how files are stored before understanding what a file is in the first place. The problem is, these two things are intertwined, and this is one way to deal with it.

When we purchase a laptop, it comes with Microsoft Windows as the operating system (unless you get a Mac). But we can change that. We can download a Linux-based distribution, like Debian, flash it on a USB drive and boot from it. Similarly, we can use FreeBSD.

While the hardware components are fixed, each OS decides how to manage them differently. Similarly, a hardware storage device is fixed. To use it, we need a software layer that communicates with it. This layer is called ***file system.***

Just like there are multiple operating systems, there are multiple file systems.

Just like operating systems have different methodologies of managing resources, so as a file system. There are multiple file systems because there are multiple ways to manage the same storage hardware. Each methodology prioritizes something over other.

In programming, we have data structures to organize data. For a given situation, it is possible to use both an array and a linked list. The choice is based on the problem we are trying to solve. Eventually, the data is stored in memory. But different methodologies allow us to organize data in different ways. Similarly, different filesystems organize and store data in different ways. In the end, the data gets stored on the hardware device, but how it was done, is what that is different.

We have different file systems, like ext4, exFAT, NTFS, Btrfs, etc. Different file systems means the kernel must support them. But how? If the kernel created separate handlers, like `read_ext4_file`, `read_exfat_file`, etc, that would create a separate class of issues.
> What exactly?

Kernel deals with this by creating a unified interface, called the virtual file system (VFS). It abstracts different file systems into one layer, allowing user space applications to call one single handler. The VFS decides which filesystem specific handler needs to be called.

Let's understand the VFS layer.

# Virtual File System (VFS)

The structures relevant to this exploration are defined in four separate files.

| Structures | Files |
| ---------- | ----- |
| `inode`, `inode_operations` | [/root/include/linux/fs.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| `file`, `file_operations` | [/root/include/linux/fs.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12) |
| `dentry` | [/root/include/linux/dcache.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12) |
| `cdev` | [/root/include/linux/cdev.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/cdev.h?h=v7.2.12) |
| `miscdevice` | [/root/include/linux/miscdevice.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/miscdevice.h?h=v7.2.12) |

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
  - 16/56 members are relevant.
	- The complete struct can be accessed at [/root/include/linux/fs.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n762).

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
  - 8/19 members are relevant.
	- The complete structure can be accessed at [/root/include/linux/fs.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1255).

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
  - 11/35 members are relevant.
	- The complete structure can be accessed at [/root/include/linux/fs.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1921).


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
  - 8/26 members are relevant.
	- The complete structure can be accessed at [/root/include/linux/fs.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/fs.h?h=v7.2.12#n1998).


```c
struct dentry {
  struct dentry *d_parent;

  union {
    struct qstr __d_name;
    const struct qstr d_name;
  };

  struct inode *d_inode;
  union shortname_store d_shortname;
  struct hlist_head d_children;
};
```
  - 5/16 members are relevant to us.
	- The complete structure can be accessed at [/root/include/linux/dcache.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/dcache.h?h=v7.2.12#n93).

| Field | Description |
| :---- | :---------- |
| `d_name`   | The filename component of the entry. |
| `d_inode`  | Pointer to the associated `struct inode`. |
| `d_parent` | Pointer to the parent directory's dentry. For the root directory `/`, it points to itself. |
| `d_shortname` | An inline character buffer union. |
| | If the filename is short (like `"kvm"`), the string is stored directly inside the dentry struct to avoid a separate heap allocation. |
| `d_children` | Head of the linked list (`struct hlist_head`) containing all child dentries for a particular directory. |
| | Only populated if this dentry is a directory. For a leaf device node like `/dev/kvm`, this list is empty. |


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
  - No member omitted.
  - The structure can be verified at path := [/root/include/linux/cdev.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/cdev.h?h=v7.2.12#n14).


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
  - No member omitted.
  - The structure can be verified at [/root/include/linux/miscdevice.h](https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/include/linux/miscdevice.h?h=v7.2.12#n84).
