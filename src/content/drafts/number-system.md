correct my 2s complement understanding.

# Numbers In Computer Science

Primarily we have 4 number systems. They are: binary, octal, decimal and hexadecimal.

In our day-to-day life, we use the decimal number system.

| Property | Binary System | Octal System | Decimal System | Hexadecimal System |
| :------- | :------------ | :----------- | :------------- | :----------------- |
| Base     | 2 (2^1) | 8 (2^3) | 10 | 16 (2^4) |
| Digit Pool | 0, 1 (bits) | 0, 1, 2, 3, 4, 5, 6, 7 | 0, 1, 2, 3, 4, 5, 6, 7, 8 9 | 0, 1, 2, 3, 4, 5, 6, 7, 8 9, A, B, C, D, E, F |
| Prefix | 0b | 0o | 0d | 0x |
| Example (11) | 0b00001011 | 13 | 11 | 0xb |
| Group of bits required to represent (derived from base) | 1 | 3 |  | 4 |

1 Byte = 8 Bits

---

Everyone learns number lines in elementary school.
  - *A pictorial representation of numbers on a straight line.*

That number line has a zero which separates negative numbers from positive numbers.

*A whole number (-infinity to +infinity) with no fractional part (N/R) is called an integer.*

*A whole number with fractional part is called a decimal.*

---

# Binary To Decimal Conversion

To obtain the decimal equ. of a group of bits, we just have to multiply each bit with a power of 2.

Take 0101.
  - To obtain it decimal equivalent, we have to multiply each digit right to left with a power of 2.
  - The power starts from 0 and goes up to `digit - 1`.

```
0101 = 0 * 2^3 + 1 * 2^2 + 0 * 2^1 + 1 * 2^0
     = 0 + 4 + 0 + 1
     = 5
```

# Types Of Numbers

In computer science, there are 3 types of numbers, or, better is, 3 levels of difficulty with numbers.

1. Unsigned integers are positive integers.
2. Signed integers are "positive and negative Integers" _together._
3. Floating point values.

There is no name for "negative integers only" in computer science.

Fractions are known as **floating point integers**.

1-Byte has 8-bits, which can represent 256 combinations.

| Property | Unsigned Integer | Signed Integer |
| :------- | :--------------- | :------------- |
| Definition | All positive integers including 0. | Both positive and negative integers. |
| Range | 0 to (total combinations possible with the number of bits - 1) | [(-2)^(n-1), -1 + 2^(n-1)] |
| | [0, -1 + 2^n] | |
| Example | [0, 255] | [-128, +127] |

---

In unsigned integers, it is simple.

  * When all the bits are 0, `0b00000000`, it is 0.
  * When all the bits are 1, `0b11111111`, it is 255.

With signed integers comes problems.

---

Signed integers are implemented using two's complement.

To represent signed integers, we use the most significant bit as the sign bit. It is how we track positivity and negativity.
  * 0 = positive
  * 1 = negative

Thus, a group of 8-bits can represent -128 to +127. Their representation is as follows:
```
0    => 0b00000000
+127 => 0b01111111

-128 => 0b10000000
-1   => 0b11111111
```

## Representing Negative Integers

In binary number system, there is no +/- . Complements is how we represent negative numbers.

*Complements are mathematical transformations of binary numbers, specifically designed for how binary arithmetic works in computers.*

The most common ones are: 1's and 2's complement.

### Types Of Bits

There are two types of bits.

1. **Least Significant Bit (LSB)** is the rightmost bit in the binary representation of an integer. It is called **least** because setting this ON/OFF has the least impact on the magnitude of the value.
2. **Most Significant Bit (MSB)** is the leftmost bit in the binary representation of an integer. It is called **most** because setting this ON/OFF has the largest possible impact on the magnitude of the value.

Take this: 15 is represented by `1111` in 4-bits.
  * If you set LSB to 0, we get `1110` which is 14. The magnitude is lowered by 1 only.
  * If you set MSB to 0, we get `0111`, which is 7. The magnitude is lowered by 8, halved, basically.

### 1's Complement

***The value you must add to a number so the result is a string of 1s or the result is the maximum value that you can represent with the number of bits.***

To get the 1's complement of a binary number: Flip all the bits (change 0s to 1s and 1s to 0s).

Example:
  * 5 in binary is: `0b00000101`
  * 1's complement of 5: `0b11111010`

The problem with 1's complement is that it has two representation of 0.
  * +0 = `0b00000000`
  * -0 = `0b11111111`

But + and - are insignificant for zero.

2's complement solves this problem.

### 2's Complement

In 2's complement, the number of possible combinations are divided into two halves.
  * Lower half: positive integers
  * Upper half: negative integers

To obtain 2's complement of a number:
  1. Start with its binary representation.
  2. Get 1's complement.
  3. Add 1 to the result of step 2.

Take 5.
  * 5 in binary is: `0b00000101`
  * 1's complement of 5: `0b11111010`
  * Add 1: `0b11111010` + `0b00000001` = `0b11111011`
  * We get -5 in 2's complement as `0b11111011`
  * `0b00000101` - `0b11111011` = `0b00000000`, Hence proved!

### How 2's complement solves the problem of 0?

Lets take an example using 4-bits, because combinations here are neither too less, nor too more.

4-bits can represent 16 combinations, or better, **16 unsigned integers** from 0 to 15. These combinations are:
```
0000, 0001, 0010, 0011, 0100, 0101, 0110, 0111, 1000, 1001, 1010, 1011, 1100, 1101, 1110, 1111
```

2's complement divides these into two halves. Both of them gets 8 values each.
```
Lower Half :: 0000, 0001, 0010, 0011, 0100, 0101, 0110, 0111, 

Upper Half :: 1000, 1001, 1010, 1011, 1100, 1101, 1110, 1111
```

We can use the range formula mentioned above to verify this:
```
=> [(-2)^(4-1), 2^(4-1)-1] 

=> [(-2)^3, (2^3)-1]

=> [-8, +7]
```

Let's see how the upper half maps to negative integers.

If you notice, all the combinations in the upper half has the most significant bit set to 1.

To obtain the combinations in this half (8-15), 4th bit must be set to 1. But it is not required with the values in the lower half (0-7). This is the distinction.

***In 2's complement, positive integers have their MSB set to 0 and negative integers have their MSB set to 1.***

Now take the upper half and put it in the left of the lower half, we get:
```
1000, 1001, 1010, 1011, 1100, 1101, 1110, 1111, 0000, 0001, 0010, 0011, 0100, 0101, 0110, 0111
 -8    -7    -6    -5    -4    -3    -2    -1     0    +1    +2    +3    +4    +5    +6    +7
```

To obtain the negative representation of 0, we need the MSB as 1 and rest of the bits as 0, which gets us to 1000, which represents -8.

The grid above represents a pattern. ***Every negative integer is of the form `-(2^n) + (+ve integer)`.***

For example:
```
-8 => -(2^4) + (+8) = -16 + 8 = -8 (1000)
-1 => -(2^4) + (+1) = -16 + 1 = -15 (1111)
```

If we try the same for 0, we get
```
-0 => -(2^4) + (+0) = -16 + 0 = -16
```

But 16 is not possible with 4-bits.
  * This proves that 2's complement by design has no room for two representations of zero.

# Binary Arithmetic

Take out your elementary mathematics notes because we are going to need them.

## Unsigned Arithmetic

Everything is same, only the borrowing value is different. But the borrow value is calculated the same way.

### Addition

**Carry** once the sum exceeds 1. And dispose the 1 only when the result of a sum is 0.

Basically, if the digits in sum are more than 1, you have to carry.

Example:
```
   0011 (3)
   1101 (13)
= 10000 (16)
We have to add a new bit because the result exceeded the bit-limit.

  0011 (3)
  0110 (6)
= 1001 (9)
```

### Subtraction

We know that `10 - 8 = 2`. And we can do the same for any operands. But this process has become so automatic that we have internalized the theory and forget it consciously.

To understand binary subtraction, we have to revisit how subtraction works.

In decimal system, every digit in a number has a **position** attached to it. Take `49521`. Moving from right to left,
  * 1 is the ones digit,
  * 2 is the tens digit,
  * 5 is the hundreds digit,
  * 9 is the thousands digit, and
  * 4 is the ten-thousands digit.

These positions aren't NPCs, they have a purpose. And this _purpose_ is the whole **purpose of our revisit.**

---

We know that decimal system is in base-10. But what does that actually mean?

  - *Every position has a **weight** attached to it, where **weights** are indices raised to the power of the base and **indices** refers to a numerical identity, given to a position. These **indices** start from 0 and go till (number of digits - 1).*

Therefore,
  * The ones position carries a weight of 10^0 = 1.
  * The tens position carries a weight of 10^1 = 10
  * The hundreds position carries a weight of 10^2 = 100
  * The thousands position carries a weight of 10^3 = 1000
  * The ten-thousands position carries a weight of 10^4 = 10000

---

In division, we have dividend (numerator) and divisor (denominator). In subtraction, we have **minuend** and **subtrahend**.
  * *Even I can't recall if I have heard these words before.*

Basically, in `op1 - op2` operation, op1 is the **minuend** and op2 is the **subtrahend**.

---

There are multiple techniques to do subtraction.

  1. In school, we learn *column-based subtraction* which involves borrowing from the left digits.
  2. We can **add equal** numbers to both minuend and subtrahend and make the subtrahend end with zero. It helps visually, that's it.
  3. **Subtraction** by complement. A quite easy way to do subtraction. That's how computers do it.
  4. **Counting**, though simple, yet I get confused sometimes there as well.
  5. **Decomposition**. I love this one and use it quite often, when I don't have calculator. We break numbers in pairs of 10s. Like 4215 can be broken into 4200 + 15. 2307 can be broken into 2300 + 7. 4200 - 2300 is simple, 1900. So as 15 - 7, 8. Add at last, 1900 + 8, result = 1908. I use this in addition as well.
  6. And yes, calculator!

---

We have to study column-based subtraction for binary bits.

When doing column-based subtraction, we subtract digits at corresponding positions in minuend and subtrahend.
  - For example: 4215 and 2307. The digit at ones position (7) will be subtracted from the digit at ones position (5) only.

Sometimes, we get stuck when the corresponding minuend is lesser than the subtrahend. In that case, we **borrow** from the left side. This is where the problem is.

Let's take `10 - 4` as borrowing is inevitable here.

We are taught that when we borrow, we reduce the one from the lender and add 10 to the borrower. So, 0 borrowing from 1 becomes 10. Now it can subtract.
  - *You may ask, it was 10 before as well. And seriously, I also want to know the "commonsense" behind this. But anyways.*

Similarly, in `20 - 4`, we just need 10, not the entire 20. Upon looking closely, 20 is just 10+10. Problem solved. Take out one 10 and give it to 0.
  * But why 10 only? Why not any arbitrary number? The answer is **weight**.

Treat positions like containers, where every container has a limit on how much it can contain.

  * The ones position has a weight 10^0 or 1. It can't contain more than that. And 1 here represents the base value, which is 10, not the literal 1.
  * That's why we have never borrowed more than 10. Because it can't hold more. And to keep thing consistent, we borrow the max value, not any arbitrary digit.

---

That's all we need to know. *Looks easy huh?* Lets tackle binary subtraction now.

There are 4 rules, 3 of them are straightforward. And the last one is the rebel.
```
0 - 0 = 0
1 - 1 = 0
1 - 0 = 1
0 - 1 = 1    # the problem
```

Take this:
```
_ 0110 (6)
  0100 (4)
= 0010 (2)
```
- Simple.

And these?
```
_ 0100 (4)
  0001 (1)
= 0011

_ 1010 (10)
  0011 (3)
= 0111
```

Anyone who has spend time with binary knows about "8 4 2 1". Some might know it by name, others don't bother. I belong to the others category.

My search brought me to this YouTube video: [Binary Addition and Subtraction Explained (with Examples)](https://www.youtube.com/watch?v=AE-27BSbkJ4\&t=629s\&pp=ygUSYmluYXJ5IHN1YnRyYWN0aW9u).
  - This video introduced me to the term **weights**.

These 8 4 2 1 are the weights in binary number system.

To obtain weight for any given position, we use this formula:
```
Weight for position i = (base)^i
```

Lets look at the minuend, `1010`. The weights attached to each digit are: `[2^3:1, 2^2:0, 2^1:1, 2^0:0]`

To convert a binary representation into decimal, we have to multiply the digit with its weight and sum-up the result. 

Take 1010. The weights are 8421. We get `8 + 2 = 10`. Boom.

From this, can we say that,
  * 1 at 0th bit position represents `2^0`?
  * 1 at 3rd bit represents `2^3`?
  * And a 1 at position `i` represents `2^i`?

A bit at index 3 is basically inside a container which can hold a maximum value of `2^3` (in decimals). But in binary, it is still about 0 and 1.

---

I think `10 - 3` is a really complex binary subtraction primarily because of how borrowing works.

To visualize borrowing, lets take a simple example.
```
8 - 3 = 5

_ 1000 (Minuend, 8)
  0011 (Subtrahend, 3)

= ____
```

Subtraction process starts the same, from right towards left.

Here is a simple table to condense this information.

| Attribute  | Value At Bit | Value At Bit | Value At Bit | Value At Bit |
| :--------  | :----------- | :----------- | :----------- | :----------- |
| Index      | 3            | 2            | 1            | 0            |
| Weight     | 2^3 = 8      | 2^2 = 4      | 2^1 = 2      | 2^0 = 1      |
| Minuend    | 1            | 0            | 0            | 0            |
| Subtrahend | 0            | 0            | 1            | 1            |

Lets understand **borrowing**.

bit-0 subtraction needs borrowing. It goes to bit-1.

bit-1 also needs borrowing. It goes to bit-2.

bit-2 also needs borrowing. It goes to bit-3.

bit-3 is 1, so it can lend. The weight attached to bit 3 is 8.

bit-2 has come to ask for lending to bit-3. But the maximum that bit-2 can contain is 2^2. But bit-3 can lend 2^3 only. Because in binary, either you have 0 or you have 1.

  - So bit-3 breaks itself as 4+4, which is the same as 2 units of 2^2.
  - And notice, 2^2 is exactly what bit-2 can hold at max.
  - But there are two units.
  - *Lets not go any further and assume it can hold it*. Lending successful.

Status:
  * bit-3 = 0
  * bit-2 = something that we will talk about later.

Now bit-2 lends to bit-1. It has got two units of 2^2.

  * Bit-1 can hold up to 2^1 only.
  * So bit-2 breaks one of its units 2^2 as 2*(2^1). And lends it to bit-1. Lending successful.

Status:
  * bit-3: 0
  * bit-2: something.
  * bit-1: something.

Now bit-1 lends to bit-0. It has two units of 2^1.

  * Bit-0 can only hold up to 2^0.
  * So bit-1 breaks one of its units 2^1 as 2*(2^0), And lends it to bit-0. Lending successful.

Status:
  * bit-3: 0
  * bit-2: something.
  * bit-1: something.
  * bit-0: something that 2*(2^0) might refer to.

Now, no more lending or borrowing.

Let's understand this "something".

* bit-3 lent it's 1, which is 8 in decimals.
* bit-2 received two units of 2^2 from bit-3, but can use only one. So lends one unit of 2^2 to bit-1.
* bit-1 received two units of 2^1 from bit-2, but can use only one. So lends one unit of 2^1 to bit-0.
* bit-0 received two units 2^0 from bit-1, but can only use one. But there is no one to lend.

Final state:
* bit-3 is zero.
* bit-2 is 2^2, from the table above, it is exactly the weight it can contain, that means, a 1.
* bit-1 is 2^1, from the table above, it is exactly the weight it can contain, that means, a 1.
* bit-0 is 2 units of 2^0 or better, 2 units of 1.

Let's do the subtraction.
```
_ 1 0 0 0
  0 0 1 1

can be written as

_ 0 1 1 (1+1)
  0 0 1  1
= 0 1 0  1
```

I don't think its tough anymore.

Lets tackle the final boss now, which spiraled me to understand subtraction from its roots.

```
_ 1 0 1 0 (10)
  0 0 1 1 (3)

can be written as

_ 0 1 (1+1) (1+1)
  0 0  1     1

= 0 1 1 1 (7)
```

***And, we are done!***

---

Most of the people advising "*your fundamentals have to be really strong*" might not even realize the depth of their own statement. It can easily turn into a rabbit hole because of our incomplete understanding and things becoming automatic (subconscious).

***But don't assume this was the final boss. The final boss is signed integers.***

---

## Signed Arithmetic

Computers use 2's complement so it is pretty straightforward.

`A - B` becomes `A + (-B)`

We obtain `-B` using 2's complement.

Example:
```
A = 0101 (5)
B = 0011 (3)

5 - 3 = 2

A - B => A + (-B)

-B = 1's complement (B) + 0011
   = 1100 + 0001
   = 1101

A - B = A + (-B)
      = 0101 + 1101
      = 10010 (discard carry)
      = 0010
      = 2
      Hence Proved
```
