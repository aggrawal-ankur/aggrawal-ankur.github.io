---
title: "What is /dev/kvm in KVM?"
publishDate: "2026-10-26"
# updatedDate: "2026-M-D"
description: "This text aims to understand the /dev/kvm device used in KVM."
tags: [ linux-kvm ]
draft: true
---

# Premise

A text about KVM is kind of incomplete if it doesn't mention `/dev/kvm`. Almost all elementary writings about KVM has `/dev/kvm` in them. But what is `/dev/kvm` exactly, beyond "***a character device***"?

This writing attempts to understand `/dev/kvm`.

# Notes For The Reader

Everything is grounded in Linux v7.2.12.

This writing explores various components in the virtual file system (VFS) and the device management layer. However, this writing is not a guide about them. I have found these components necessary to understand `/dev/kvm`, hence I have explored them. Therefore, this text must not be considered suitable for understanding the VFS layer and device management layer in depth.

---

Many of the the data structures that are relevant to this discussion have a lot of fields in them. Many fields, however, were observed to have no relevance in this pursuit. Therefore, only the relevant fields in these structures are discussed here.

Let's start.

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
  - Focus at the content after "username" and before "Oct".
  - For the markdown file, it is 8631, which denotes the size of the file in bytes.
  - For /dev/kvm, it is `10, 232`. The output of `file` also have it, i.e. `(10/232)`.

So, /dev/kvm is a special file, called a character device file. I have some questions.
  - What is a file? What identifies as a file in Linux?
  - What are the different types of files in Linux? How they are represented?

Since I don't have answers to these questions, I will start with them.

---

One of my principles is to clear the ground before I explore the thing I exactly came for. This is how I deal with FOMO.

Internet is filled with information, both shallow and deep. Modern systems are sophisticated and context is distributed across various components. My habit of asking questions increases the amount of FOMO I have to deal with.

"What if I didn't explored this and it was a prerequisites to understanding the thing I am here for?" This question haunts me. Instead of wasting time, energy and attention procrastinating, I rather prefer clearing the ground first. It feels like waste of time, but it isn't, at least for me.

Let's start.

---

Before we ask what is a file, we need to understand how files are stored and accessed. While this sounds absurd, by my own definition, like how can I understand how files are stored before understanding what a file is in the first place. The problem is, these two things are intertwined, and this is one way to deal with it.

When we purchase a laptop, it comes with Microsoft Windows as the operating system (unless you get a Mac). But we can change that. We can download a Linux-based distribution, like Debian, flash it on a USB drive and boot from it. Similarly, we can use FreeBSD.

While the hardware components are fixed, each OS decides how to manage them differently.

Similarly, a hardware storage device is fixed. To use it, we need a software layer that communicates with it. This layer is called a file system.

Just like there are multiple operating systems, there are multiple file systems.

Just like operating systems have different methodologies of managing resources, so as a file system. There are multiple file systems because there are multiple ways to manage the same storage hardware. Each methodology prioritizes something over other.

In programming, we have data structures to organize data. For a given situation, it is possible to use both an array and a linked list. The choice is based on the problem we are trying to solve. Eventually, the data is stored in memory. But different methodologies allow us to organize data in different ways. Similarly, different filesystems organize and store data in different ways. In the end, the data gets stored on the hardware device, but how it was done, is what that is different.

We have different file systems, like ext4, exFAT, NTFS, Btrfs, etc.

Different file systems means the kernel must support them. But how? If the kernel created separate handlers, like `read_ext4_file`, `read_exfat_file`, etc, that would create a separate class of issues.
> What exactly?

Kernel deals with this by creating a unified interface, called the virtual file system (VFS). It abstracts different file systems into one layer, allowing user space applications to call one single handler. The VFS decides which filesystem specific handler needs to be called.

We will start our exploration from VFS.

# Virtual File System (VFS)
