# Procedure Linkage Table

Now our program (main) is executing. It's time to call puts.
  - Since it is lazy binded, it's runtime address is not known yet.
  - But to use it, it's address need to be known. To resolve it's address, the interpreter needs to be given the control.

GOT is primarily designed to contain resolved addresses and it's a bad idea to pollute it.

To solve this issue, we introduce procedure linkage table.

***Procedure linkage table (or the .plt section) exists to support lazy resolution of references.***

It acts as an indirect jump table, allowing a program to call a function whose runtime address is not known until the first call.

The .got section stores pointers to global data/function symbols, but procedure linkage table is strictly used for external functions only.

## Structure of Procedure Linkage Table

A stub piece of instructions, that is consistent across all entries.

```bash
          +---------------------------+
PLT[0] -> | push *(.got.plt + 8)      | ; push the entry in GOT which points to the link map
          | jmp _dl_runtime_resolve() |
          +---------------------------+

          +---------------------------+
PLT[1] -> | jmp *(.got.plt[sym])      | ; jump to resolved address of sym(1)
          | push symIdx               | ; index of sym(1) in .dynsym
          | jmp plt[0]                | ; fallback to resolver stub
          +---------------------------+

          +---------------------------+
PLT[2] -> | jmp *(.got.plt[sym])      | ; jump to resolved address of sym(2)
          | push symIdx               | ; index of sym(2) in .dynsym
          | jmp plt[0]                | ; fallback to resolver stub
          +---------------------------+

      ...

          +---------------------------+
PLT[N] -> | jmp *(.got.plt[sym])      | ; jump to resolved address of sym(N)
          | push symIdx               | ; index of sym(N) in .dynsym
          | jmp plt[0]                | ; fallback to resolver stub
          +---------------------------+
```

The `PLT[0]` stub is reserved for providing the address of the resolver function. `PLT[1 to n]` stubs are the actual relocation entries.

## Understanding puts Relocation

```
Disassembly of section .text:

0000000000001139 <main>:
    1139:	55                   	push   rbp
    113a:	48 89 e5             	mov    rbp,rsp
    113d:	48 8d 05 c0 0e 00 00 	lea    rax,[rip+0xec0]        # 2004 <_IO_stdin_used+0x4>
    1144:	48 89 c7             	mov    rdi,rax
    1147:	e8 e4 fe ff ff       	call   1030 <puts@plt>
    114c:	b8 00 00 00 00       	mov    eax,0x0
    1151:	5d                   	pop    rbp
    1152:	c3                   	ret

Disassembly of section .plt:

0000000000001020 <puts@plt-0x10>:
    1020:	ff 35 ca 2f 00 00    	push   QWORD PTR [rip+0x2fca]        # 3ff0 <_GLOBAL_OFFSET_TABLE_+0x8>
    1026:	ff 25 cc 2f 00 00    	jmp    QWORD PTR [rip+0x2fcc]        # 3ff8 <_GLOBAL_OFFSET_TABLE_+0x10>
    102c:	0f 1f 40 00          	nop    DWORD PTR [rax+0x0]

0000000000001030 <puts@plt>:
    1030:	ff 25 ca 2f 00 00    	jmp    QWORD PTR [rip+0x2fca]        # 4000 <puts@GLIBC_2.2.5>
    1036:	68 00 00 00 00       	push   0x0
    103b:	e9 e0 ff ff ff       	jmp    1020 <_init+0x20>

Disassembly of section .got.plt:

0000000000003fe8 <_GLOBAL_OFFSET_TABLE_>:
    3fe8:	e0 3d                	loopne 4027 <_end+0x7>
	...
    3ffe:	00 00                	add    BYTE PTR [rax],al
    4000:	36 10 00             	ss adc BYTE PTR [rax],al
    4003:	00 00                	add    BYTE PTR [rax],al
    4005:	00 00                	add    BYTE PTR [rax],al
	...
```

This is the relocation entry for `puts`:
```bash
Relocation section '.rela.plt' at offset 0x610 contains 1 entry:
  Offset          Info           Type           Sym. Value       Sym. Name + Addend
000000004000  000300000007  R_X86_64_JUMP_SLO  0000000000000000  puts@GLIBC_2.2.5 + 0
```

PLT stub for puts would be like:
```asm
jmp   *GOT[puts]
push  puts_symIdx
jmp   plt[0]
```

Since `main` has the control, it needs to be passed to the interpreter program so that the runtime resolver function (`_dl_runtime_resolve`) can be called which would eventually resolve `puts`.

`main` calls `puts` as:
```asm
call   1030 <puts@plt>
```

0x1030 resolves to the plt stub for `puts`. The instruction at this offset jumps to an entry in the .got.plt section, which is at 0x4000. There is nothing to see in the disassembly as it is all garbage.
  - One thing we can verify is that .got.plt starts at 0x3fe8 and 0x4000 comes exactly after 0x3fe8, 0x3ff0 and 0x3ff8, which are 3 reserved entries in the .got.plt section as discussed previously.

Let's explore the PLT stub for puts.
  
The first instruction points to the .got.plt entry, so that if the address is resolved, no relocation is repeated.

Initially, the address is not known. So, the .got.plt entry points to the next instruction in the symbols PLT stub.
  - This instruction pushes the symbol index for `puts` from `.rela.plt` entry.
  - It is 0x0, which is a placeholder value.

After the symbol index is pushed on stack, the third instruction in the plt stub executes, which jumps to the `PLT[0]` stub at offset 0x1020.
  - The instruction at 0x1020 pushes something on the stack.
  - It is an entry in the .got.plt section, which corresponds to `link_map`.

The next instruction, `0x1026`, points to _dl_runtime_ resolver entry in .got.plt section. The interpreter jumps on this, finds puts, resolve its address, patch the .got.plt entry for `puts`.

After this, the control is given to main again and a call to puts is successfully made.

## Final Structure Of GOT

```
----------------------------------------------------------
| .got (Eager Binded Syms) at offset 0x0000 (.rela.dyn)  |
| ----------    --------------------------    ---------- |
| | GOT[0] | -> | -(func/symb 1)         | -> | 0x0000 | |
| ----------    --------------------------    ---------- |
| | GOT[1] | -> | -(func/symb 2)         | -> | 0x0008 | |
| ----------    --------------------------    ---------- |
| | GOT[2] | -> | -(func/symb 3)         | -> | 0x0010 | |
| ----------    --------------------------    ---------- |
| | GOT[3] | -> | -(func/symb 4)         | -> | 0x0018 | |
| ----------    --------------------------    ---------- |
| | GOT[4] | -> | -(func/symb 5)         | -> | 0x0020 | |
| ----------    --------------------------    ---------- |
| ....                                                   |
| ....                                                   |
| ----------    --------------------------    ---------- |
| | GOT[N] | -> | -(func/symb N)         | -> | 0x.... | |
| ----------    --------------------------    ---------- |
|               Suppose it ended at 0x0020               |
|--------------------------------------------------------|
|--------------------------------------------------------|
| .got.plt (Lazy Binded Sym) at offset 0x0028 (.rela.plt)|
| ----------    --------------------------    ---------- |
| | GOT[0] | -> | -(.dynamic)            | -> | 0x0028 | |
| ----------    --------------------------    ---------- |
| | GOT[1] | -> | -(link_map)            | -> | 0x0030 | |
| ----------    --------------------------    ---------- |
| | GOT[2] | -> | -(_dl_runtime_resolve) | -> | 0x0038 | |
| ----------    --------------------------    ---------- |
| | GOT[3] | -> | *(PLT stub for func1)  | -> | 0x0040 | |
| ----------    --------------------------    ---------- |
| | GOT[4] | -> | *(PLT stub for func2)  | -> | 0x0048 | |
| ----------    --------------------------    ---------- |
| ....                                                   |
| ....                                                   |
| ----------    --------------------------    ---------- |
| | GOT[M] | -> | *(PLT stub for funcM)  | -> | 0x.... | |
| ----------    --------------------------    ---------- |
*--------------------------------------------------------*
```