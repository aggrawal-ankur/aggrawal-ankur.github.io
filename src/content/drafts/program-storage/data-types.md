# The Illusion Of Data Types

C has the following general-purpose data types:

| Class | Types |
| :---- | :---- |
| Primitive | char, int, float, double, void |
| Derived   | array, pointer, function |
| User-defined (Complex) | struct, union, enum, typedef |

Is **complex** an actual term here?

Note: `void` is only meaningful with functions and pointers.

## Width

| Data Type | Width (LP64 GNU/Linux) |
| :-------- | :--------------------- |
| char      | 1-byte |
| int       | 4-byte |
| float     | 4-byte |
| double    | 8-byte |
| void      | N/A    |
| Array     | sizeof(type) * n_blocks |
| Pointer   | 8-byte |

`char` is generally 1-byte across all architectures and implementations while `int` is implementation depended. Although the common size of `int` is 4-bytes (on both 32-bit and 64-bit) but other definitions exist for fine-grained control in `inttypes.h`.

## How Data Types Are Translated?

A `char` is 1-byte so it aligns perfectly with the idea of **byte-addressable memory**. The problem comes with int, float, and double.

A single byte can represent 256 combination of numbers.
  - Signed: `-128 to +127`
  - Unsigned: `0 to 255`

A group of 4 bytes means 32-bits together, which can represent a large sum of values.

To store 6 as a 32-bit integer, we have to pad the upper bits with zero. So, `00000110` becomes `00000000000000000000000000000110`.

---

A variable of type int takes 4 bytes of space, but memory is byte addressable, which means, a continuous block of 4-bytes is required to store an integer and you have to group those 4-bytes together in order to interpret them right.

Same with float and double.

---

An array is a contiguous buffer of memory. You have a group of bytes that are distinct enough that they exist as individual units but they are a part of one single entity.

Take an array of 10 elements.

  - In simple words, it's a group of 10 logical units where each logical unit is a sequence of bytes interpreted as one single entity.
  - An array of 10 integers is a contiguous block of memory split into 10 logical units, where each unit is spread across 4 bytes and represents a single number when interpreted together.

Therefore, the size of an array is the size of the type of data it contains multiplied by the number of elements.

---

So, what are data types?

***A data type is a contract between the programmer and the compiler that defines how a sequence of bits in memory should be interpreted and what operations are valid on it.***

This is why **interpretation** is so important. A group of bytes can be represented in a variety of ways and each way changes the meaning. For example:

  - 16 bytes can be interpreted as 16 distinct characters, 4 integers (of 4-bytes each) or 2 doubles (of 8 bytes each).
  - These 16 bytes can also be wrapped in an array.
