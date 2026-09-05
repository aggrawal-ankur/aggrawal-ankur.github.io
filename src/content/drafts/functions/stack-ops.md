# Stack Operations

The `call` instruction calls a procedure, which is shorthand for pushing the address of the next instruction (stored in `rip`) on the stack and jumping to the procedure's label. This is how it looks like conceptually:
```nasm
; call label

push rip
jmp label
```
... the CPU does it slightly differently.

The `push` instruction is a shorthand for:
```nasm
; push reg/imm

sub rsp, 8
mov [rsp], reg/imm
```

The `pop` instruction is a shorthand for:
```nasm
; pop reg

mov reg, [rsp]
add rsp, 8
```

The `leave` instruction restores the previous stack frame, which is a shorthand for:
```nasm
; leave

mov rsp, rbp
pop rbp
```

The `ret` instruction is a shorthand that restores the next instruction from the previous frame into `rip`:
```nasm
; ret => pop rip

mov TEMP, [rsp]
add rsp, 8
mov rip, TEMP
```
