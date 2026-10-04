---
title: "Virtual 8086 Attribute in Protected Mode"
publishDate: "2026-10-04"
# updatedDate: "2026-M-D"
description: "Virtual 8086 Attribute in Protected Mode"
tags: [ intel-sdm ]
draft: true
---

IA-32 processors (beginning with the Intel386 processor) provide two ways to execute new or legacy programs that are assembled and/or compiled to run on an Intel 8086 processor:
  - Real-address mode.
  - Virtual-8086 mode.

When the processor is powered up or reset, it is placed in the real-address mode. This operating mode almost exactly duplicates the execution environment of the Intel 8086 processor, with some extensions. Virtually any program assembled and/or compiled to run on an Intel 8086 processor will run on an IA-32 processor in this mode.

When running in protected mode, the processor can be switched to virtual-8086 mode to run 8086 programs. This mode also duplicates the execution environment of the Intel 8086 processor, with extensions.

In virtual-8086 mode, an 8086 program runs as a separate protected-mode task. Legacy 8086 programs are thus able to run under an operating system that takes advantage of protected mode and to use protected-mode facilities, such as the interrupt and exception handling facilities.

Protected-mode multitasking permits multiple virtual-8086 mode tasks (with each task running a separate 8086 program) to be run on the processor along with other non-virtual-8086 mode tasks.

***Note: This writing discusses only the virtual 8086 mode environment. Real-address mode is discussed separately [here]. Please go through it before diving here.***
