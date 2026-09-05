# Bitwise Operations

Bitwise operations are logical operations performed on the individual bits in a binary representation.

We have logic gates like `AND`, `OR`, `NOT` and others which are made up of these logic gates, like `NOR` and `XOR`.

From boolean algebra, we know this.
```
1 and 1 = 1
1 or 1 = 1

1 and 0 = 0
1 or 0 = 1

0 and 0 = 0
0 or 0 = 0
```

The same idea is applied be it normal logical operations or bitwise operations.

In C, we use:

| Operation   | Symbol |
| :---------- | :----- |
| AND         | &&     |
| OR          | \|\|   |
| NOT         | !      |
| Bitwise AND | &      |
| Bitwise OR  | \|     |
| Bitwise NOT | \~     |
| Left shift  | <<     |
| Right shift | >>     |

Let's take some examples to understand how bitwise operations work

## Examples

In bitwise AND, compare the bits in both the operands and put 1 in the output for that bit if both the operands have 1, else 0.

Example1:
```
5 & 5 = 5

  0101
& 0101
------
= 0101
------
```

Example2:
```
5 & 6 = 4

  0101
& 0110
------
= 0100
------
```

---

In bitwise OR, compare the bits in both operands and put 1 in the output bit if at least one operand bit is 1, else 0.

Example1:
```
5 | 5 = 5

  0101
| 0101
------
= 0101
------
```

Example2:
```
5 | 6 = 7

  0101
& 0110
------
= 0111
------
```

---

In bitwise NOT, flip all the bits in the output.

```
 6 = 0110
~6 = 1001 (-7)
```

---

Be cautious and remember the rule of **interpretation** as the output might not what you expect if you don't factor it. Take this: `int a = ~6;`

  - If you use `%d` format specifier, you get `-7` as int is "signed".
  - If you use `%u` format specifier, you get `4294967289` as it interprets the value as an unsigned int.
  - And it is applicable to any pattern that can produce both signed and unsigned interpretations.

The bitwise XOR operation is made up of AND, OR and NOT.
```
XOR(A, B) = (A AND NOT B) OR (B AND NOT A) .
```

In simple words, set the bit to 1 where the bits are different. Take this:
```
5 ^ 6 = 3

  0101
^ 0110
------
= 0011
------
```

---

Let's talk about shifts now.

In left shift, we move from right to left and shift all the bits by n positions and the new bits in the right will be 0. For example:
```
5 << 2
=> 00000101 << 2
=> 00010100
```
  - So `5 << 2` = `20`.

In right shift, we move all bits to the **right** by `n` positions. We have two options here.

1. Arithmetic right shift is where the sign is preserved. The new bits on the left are copies of the **sign bit**. For example:
   ```
   11010000 >> 2
   => 11110100

   00001100 >> 2
   => 00000011
   ```

2. Logical right shift is normal shifting. For example:
   ```
   11010000 >> 2
   => 00110100
   ```

If the value get past the limit, it is discarded. For example:
```
11001100 << 2
=> 00110000

00001100 >> 4
=> 00000000
```

## Rotation

Rotation is shifting with wrapping. The values which get past the container limit are wrapped on the other side.

Example for left rotate:
```
10110001 rol 2
=> 11000110
```

Example for right rotate:
```
10110001 ror 2
=> 01101100
```

## Use

### Performance

Bitwise operation are single instructions and multiplication/division is more costlier. So, if the system can achieve the same thing with bitwise ops, it optimizes for that.

Example1: `(x << n) ~= (x* 2^n)` .
```
5 << 2 = 20

5*(2^2) = 5*4 = 20
```

Example2: `(x >> n) ~= (x/ 2^n)`.
```
5 >> 2 = 1

5/(2^2) = 1
```

### Data Compression

We can use one a single int to compress multiple information and use bit shifts to obtain the correct values. This is very important for memory critical systems like embedded systems.

## Conclusion

| Bitwise Opn | C Equ. | x64 Assembly | Description |
| :---------- | :----- | :----------- | :---------- |
| Bitwise AND | `&`  | `and reg, reg/mem/imm` | Keeps only common `1` bits |
| Bitwise OR  | `\|` | `or reg, reg/mem/imm`  | |
| Bitwise XOR | `^`  | `xor reg, reg/mem/imm` | Sets bit if different |
| Bitwise NOT | `~`  | `not reg/mem` | Flips all bits |
| Logical AND (boolean) | `&&`   | `test reg, reg/mem` + `jcc` | In C, it's shortcut; in asm use `test`/`cmp` + jump |
| Logical OR  (boolean) | `\|\|` | | |
| Logical NOT (boolean) | `!`    | `test`/`cmp` + `setz` | Inverts truth value |
| Left Shift   | `<<` | `shl reg, imm/cl` or `sal reg, imm/cl` | Fill right with `0` |
| Right Shift (logical) | `>>` (unsigned) | `shr reg, imm/cl`  | Fill left with `0`  |
| Right Shift (arith.)  | `>>` (signed)   | `sar reg, imm/cl`  | Fill left with sign bit |
| Rotate Left  | – | `rol reg, imm/cl` | Bits wrap left-to-right |
| Rotate Right | – | `ror reg, imm/cl` | Bits wrap right-to-left |
| Rotate Left w/ Carry  | – | `rcl reg, imm/cl` | Includes CF as extra bit |
| Rotate Right w/ Carry | – | `rcr reg, imm/cl` | Includes CF as extra bit |
