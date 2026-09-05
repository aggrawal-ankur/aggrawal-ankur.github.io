# Global Offset Table

Relocation requires updating a placeholder value with the actual runtime address of the symbol.
  - The act of "update" requires **write** permission to write but the `.text` section is read-only.

Where is relocation happening then? Where we are patching the **actual runtime address**?

Take this entry:
```bash
000000003fc0  000100000006  R_X86_64_GLOB_DAT  0000000000000000  __libc_start_main@GLIBC_2.34 + 0
```

The offset is `0x3fc0`. The section it belongs to is `.got`, not `.text`. Why?

The `.got` section belongs to the 4th `LOAD` segment, which has read-write permissions.
```bash
LOAD    0x0000000000002dd0  0x0000000000003dd0  0x0000000000003dd0  0x0000000000000248  0x0000000000000250  RW  0x1000
```

This is the section header for `.got`.
```bash
[23] .got    PROGBITS    0000000000003fc0    00002fc0    0000000000000028    0000000000000008    WA    0    0    8
```

It's time to open the **full disassembly** to get our answers.

Come to line 341, at `.text` section.
```asm
106b:	ff 15 4f 2f 00 00    	call   QWORD PTR [rip+0x2f4f]        # 3fc0 <__libc_start_main@GLIBC_2.34>
```
  - This instruction is calling `__libc_start_main`, whose address is calculated as `QWORD PTR [rip+0x2f4f]`, which resolves to 0x3fc0 as per the comment.

The offset 0x3fc0 is found at line 764 and it points to the start of `.got` section.
```asm
Disassembly of section .got:

0000000000003fc0 <.got>:
	...
```
  - Wait, 0x3fc0 is in the section headers as well.

The rest of the functions in `.rela.dyn` have the same story.
  - If you notice, offsets `0x3fc0 0x3fc8 0x3fd0 3fd8 3fe0` are increments of 8.
  - This proves that they belong to `.got` only.
  - The section header entry for .got shows it is sized 0x28 bytes which is 40 in decimals and requires an alignment of 8 bytes.
  - This proves that there are 5 entries in GOT, each sized 8 bytes, which is probably for an address/pointer, exactly what we need for relocations.

Although space is reserved for this section, but it is empty in the disassembly as it is populated at runtime.

---

From the disassembly, we can notice that the `.text` section is not writable, so it points to entries in a section which is writable (.got).
  - The section which is writable (.got) is responsible to provide the runtime address of the symbol.

This implies that the .got section exists as an intermediary.

That's how relocations basically work in x64 architecture.

Lets understand global offset table now.

## Global Offset Table

The .got section is for the **global offset table** which is used at runtime to hold the addresses of global data/functions.

Each entry in this table is an address, which is references by a "read-only" section.

The thing that makes GOT/PLT intimidating is the inability to visualize it.
  - *It is very easy to say that "it is just a pointer table". If it is that easy, why there is no visual interpretation for it?*
  - But we are going to change that.

Global offset table is divided into .got and .got.plt sections, where .got is for eager binded relocations and .got.plt is for lazy binded relocations.

We will utilize disassembly along with theory to create an ASCII structure of these sections. Later we will verify it with dynamic analysis.

## The structure of .got

We'll explore how __libc_start_main is relocated and that will be enough to understand the structure of .got section.

```bash
Relocation section '.rela.dyn' at offset 0x550 contains 8 entries:
  Offset          Info            Type            Sym. Value     Sym. Name + Addend
000000003fc0  000100000006  R_X86_64_GLOB_DAT  0000000000000000  __libc_start_main@GLIBC_2.34 + 0
```

This the disassembly of the `_start` and `.got` sections.

```bash
Disassembly of section .text:

0000000000001050 <_start>:
    1050:	31 ed                	xor    ebp,ebp
    1052:	49 89 d1             	mov    r9,rdx
    1055:	5e                   	pop    rsi
    1056:	48 89 e2             	mov    rdx,rsp
    1059:	48 83 e4 f0          	and    rsp,0xfffffffffffffff0
    105d:	50                   	push   rax
    105e:	54                   	push   rsp
    105f:	45 31 c0             	xor    r8d,r8d
    1062:	31 c9                	xor    ecx,ecx
    1064:	48 8d 3d ce 00 00 00 	lea    rdi,[rip+0xce]        # 1139 <main>
    106b:	ff 15 4f 2f 00 00    	call   QWORD PTR [rip+0x2f4f]        # 3fc0 <__libc_start_main@GLIBC_2.34>
    1071:	f4                   	hlt
    1072:	66 2e 0f 1f 84 00 00 	cs nop WORD PTR [rax+rax*1+0x0]
    1079:	00 00 00 
    107c:	0f 1f 40 00          	nop    DWORD PTR [rax+0x0]

Disassembly of section .got:

0000000000003fc0 <.got>:
	...
```

Let's start the exploration.

The offset in relocation entry is `0x3fc0`. In disassembly, it points to the start of the .got section, which implies that it is the first entry in the .got section.

The `call` instruction in `_start` is calling a procedure which is located starting from `rip+0x2f4f` memory location interpreted as an 8-byte value.
  - Since it is an 8-byte value, it is most probably an address, maybe the runtime address of __libc_start_main symbol.

If we locate the other symbols, i.e
```bash
_ITM_deregisterTM
__gmon_start__
_ITM_registerTMCl
__cxa_finalize
```
... in the disassembly, we can find:

```asm
0000000000001080 <deregister_tm_clones>:
  mov    rax,QWORD PTR [rip+0x2f2e]        # 3fc8 <_ITM_deregisterTMCloneTable@Base>

0000000000001000 <_init>:
  mov    rax,QWORD PTR [rip+0x2fc5]        # 3fd0 <__gmon_start__@Base>

00000000000010b0 <register_tm_clones>:
  rax,QWORD PTR [rip+0x2efd]        # 3fd8 <_ITM_registerTMCloneTable@Base>

0000000000001040 <__cxa_finalize@plt>:
  jmp    QWORD PTR [rip+0x2f9a]        # 3fe0 <__cxa_finalize@GLIBC_2.2.5>
```
  - Don't worry about __cxa_finalize going through plt for the time being.

With this information, the .got section should look like this at runtime.
```bash
GOT[0]  <-> 0x3fc0  <->  *(__libc_start_main)
GOT[1]  <-> 0x3fc8  <->  *(_ITM_deregisterTM)
GOT[2]  <-> 0x3fd0  <->  *(__gmon_start__)
GOT[3]  <-> 0x3fd8  <->  *(_ITM_registerTMCl)
GOT[4]  <-> 0x3fe0  <->  *(__cxa_finalize)
```

## The Structure Of .got.plt

This section is for symbols that undergo lazy binding.

Lazy binding is a little complicated as it happens while the control is in the hands of the main program, not the interpreter.

To do lazy binding, we have 3 entries within the .got.plt section. These are offsets to:
  - .dynamic segment,
  - link_map, and
  - the runtime resolver function.

Link map is a data structure that tracks all the loaded shared objects and runtime resolver function find symbols in these objects and resolve their runtime address.

The .got.plt section starts at 0x3fe8 and the contents are garbage as it is runtime operated.

Based on the information above, the first three entries would be reserved and the fourth one would be for `puts`.
```bash
GOT[1] <-> 0x3fe8 <-> *(.dynamic)
GOT[2] <-> 0x3ff0 <-> *(link_map)
GOT[3] <-> 0x3ff8 <-> *(runtime_resolver)
GOT[8] <-> 0x4000 <-> *(puts)
```

If you look at the section header entry for the .got.plt section, you'd find its size as 32 bytes, each entry sized 8 bytes. That's exactly how it is structured.

Combining both of them, the final structure would look like this:
```bash
----------     ----------     ------------------------
| GOT[0] | <-> | 0x3fc0 | <-> | *(__libc_start_main) |
----------     ----------     ------------------------
| GOT[1] | <-> | 0x3fc8 | <-> | *(_ITM_deregisterTM) |
----------     ----------     ------------------------
| GOT[2] | <-> | 0x3fd0 | <-> | *(__gmon_start__)    |
----------     ----------     ------------------------
| GOT[3] | <-> | 0x3fd8 | <-> | *(_ITM_registerTMCl) |
----------     ----------     ------------------------
| GOT[4] | <-> | 0x3fe0 | <-> | *(__cxa_finalize)    |
----------     ----------     ------------------------
| GOT[5] | <-> | 0x3fe8 | <-> | *(.dynamic)          |
----------     ----------     ------------------------
| GOT[6] | <-> | 0x3ff0 | <-> | *(link_map)          |
----------     ----------     ------------------------
| GOT[7] | <-> | 0x3ff8 | <-> | *(runtime)           |
----------     ----------     ------------------------
| GOT[8] | <-> | 0x4000 | <-> | *(puts)              |
----------     ----------     ------------------------
```

# A Generalized GOT Structure

```bash
----------------------------------------------------------
| .got (Eager Binded Symb) at offset 0x0000 (.rela.dyn)  |
| ----------    --------------------------    ---------- |
| | GOT[0] | -> | *(symbol 1)            | -> | 0x0000 | |
| ----------    --------------------------    ---------- |
| | GOT[1] | -> | *(symbol 2)            | -> | 0x0008 | |
| ----------    --------------------------    ---------- |
| | GOT[2] | -> | *(symbol 3)            | -> | 0x0010 | |
| ----------    --------------------------    ---------- |
| | GOT[3] | -> | *(symbol 4)            | -> | 0x0018 | |
| ----------    --------------------------    ---------- |
| | GOT[4] | -> | *(symbol 5)            | -> | 0x0020 | |
| ----------    --------------------------    ---------- |
| ....                                                   |
| ....                                                   |
| ----------    --------------------------    ---------- |
| | GOT[N] | -> | *(func/symb N)         | -> | 0x.... | |
| ----------    --------------------------    ---------- |
|               Suppose it ended at 0x0020               |
|--------------------------------------------------------|
|--------------------------------------------------------|
| .got.plt (Lazy Binded Sym) at offset 0x0028 (.rela.plt)|
| ----------    --------------------------    ---------- |
| | GOT[0] | -> | *(.dynamic)            | -> | 0x0028 | |
| ----------    --------------------------    ---------- |
| | GOT[1] | -> | *(link_map)            | -> | 0x0030 | |
| ----------    --------------------------    ---------- |
| | GOT[2] | -> | *(_dl_runtime_resolve) | -> | 0x0038 | |
| ----------    --------------------------    ---------- |
| | GOT[3] | -> | *(func 1)              | -> | 0x0040 | |
| ----------    --------------------------    ---------- |
| | GOT[4] | -> | *(func 2)              | -> | 0x0048 | |
| ----------    --------------------------    ---------- |
| ....                                                   |
| ....                                                   |
| ----------    --------------------------    ---------- |
| | GOT[M] | -> | *(func M)              | -> | 0x.... | |
| ----------    --------------------------    ---------- |
*--------------------------------------------------------*
```

It is a little incomplete. We'll explore that in the next section.