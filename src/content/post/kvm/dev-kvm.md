---
title: "What is /dev/kvm in KVM?"
publishDate: "2026-10-26"
# updatedDate: "2026-M-D"
description: "This text aims to understand the /dev/kvm device used in KVM."
tags: [ linux-kvm ]
draft: true
---

A text about KVM is kind of incomplete if it doesn't mention `/dev/kvm`.

Almost all elementary writings about KVM has `/dev/kvm` in them. But what is `/dev/kvm` exactly, beyond "***a character device***"?

This writing attempts to understand `/dev/kvm`.

# Notes For The Reader

Everything is grounded in Linux v7.2.12.

This writing explores various components in the virtual file system (VFS) and the device management layer in the Linux kernel.

However, this writing is not a guide about them. I have found these components important to understand `/dev/kvm`, hence I have explored them. Therefore, this text must not be considered suitable for understanding the VFS layer and device management layer in depth.

---

A lot of the data structures that are relevant to this discussion are quite lengthy. They come with a lot of fields and many are observed to have no relevance in this pursuit. Therefore, only the relevant fields in these structs are discussed here.

Let's start.

---

The first question we need to answer is "*where this exploration should start from?*"

My elementary articles describe `/dev/kvm` as a "device file", or a "character device file". The most common usage found in them is:
```c
int fd = open("/dev/kvm", O_RDWR);
```

If we open the man page for the `open` syscall, we get the following description: "*open and possibly create a file*".

That means, "/dev/kvm" is a file.

`ls` and `file` aren't helpful either.
```bash
$ ls -l /dev/kvm
crw-rw----+ 1 root kvm 10, 232 Oct 26 20:26 /dev/kvm

file /dev/kvm
/dev/kvm: character special (10/232)
```

So, /dev/kvm is a file. What is a file? What are the different types of files in Linux? Since I don't have answers to these questions, I will start from here.
