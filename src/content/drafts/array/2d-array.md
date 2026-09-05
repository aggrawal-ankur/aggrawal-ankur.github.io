# 2D Arrays

Multidimensional arrays are like matrices in mathematics. For example:
```c
// array[N_ROWS][N_COLUMNS]

// A 2D Array or 2X2 Matrix
int arr1[2][2] = {
  {1, 2};
  {3, 4}
};
```

**Note:** You can't leave both the `ROWS` and `COLUMNS` empty. Specifying the number of columns is necessary.

At assembly level, they are no different than a normal array.

This is the assembly for the above code.
```nasm
sub	rsp, 16
mov	DWORD PTR -16[rbp], 1
mov	DWORD PTR -12[rbp], 2
mov	DWORD PTR -8[rbp], 3
mov	DWORD PTR -4[rbp], 4
```

This also shows that elements are stored row-wise, i.e
```
arr[0][0], arr[0][1], arr[1][0], arr[1][1]
```

***

The size for the stack allocation is calculated using this formula: `n(rows)*n(columns)*sizeof(type)` .

  - For the above example, that would be `2*2*4 = 16` bytes.
  - We can also verify the formula by individually calculating the size. There are 4 integers, each of size 4, so 16 bytes are required.

## Accessing Elements

This one is a little tricky as there are two ways to access the elements:

1. **Row-major** is the standard, default and cache-friendly way to access elements.
2. **Column-major** is the non-standard and non-cache-friendly way to access elements.

The talk about "standard access mode" is also language dependent.

  * Row-major is visually easy and aligns with how we interpret matrices in general, while column-major has its own use cases, primarily in scientific computing and advance mathematics.
  * Many mainstream languages default to row-major for that reason, like C/C++, Java, Python. On the other hand, languages like Fortran, MATLAB and Julia prioritizes column-major.

***

This is the code for accessing elements in both ways:

```c
#include <stdio.h>

int main(void){
  // 2D Array
  int arr[2][3] = {
    {1, 2, 3},
    {4, 5, 6}
  };

  // Row-Major
  for (int i = 0; i < 2; i++){
    for (int j = 0; j < 3; j++){
      printf("%d, ", arr[i][j]);
    }
    printf("\n");
  }
  printf("\n");
  
  // Column-Major
  for (int i = 0; i < 3; i++){
    for (int j = 0; j < 2; j++){
      printf("%d, ", arr[j][i]);
    }
    printf("\n");
  }
  printf("\n");
}
```

In terms of normal mathematics, it is just matrix transformation.

**Note: Elements are stored row-major only. We can't change that.**

***

## Address Calculation

For 1D arrays, the formula to calculate the address of any position was:
```
addr_of_i = base_addr + sizeof(type)*i
```

For example, if an array has 10 integers and the base address is 10000, the address of the 7th element (0-based indexing) would be: `10000 + 4*6 = 10024`

We can verify the formula by laying down all the addresses manually.
```
10000  10004  10008  10012  10016  10020  10024  10028  10032  10036
  0      1      2      3      4      5      6      7      8      9
```

***

For 2D arrays, the formula to calculate the address of a position is different for both row-major and column-major.

Lets derive the formula for row-major order.

Take this as an example:
```c
int arr[2][2] = {
  {1, 2},
  {3, 4}
};
```
---
```
          10000  10004  10008  10012
ROW         0      0      1      1
COLUMN      0      1      0      1
```

To jump to the next row, we have to traverse the total number of elements in one row multiplied by the size of their type, i.e `n(cols)*sizeof(int)`

To jump to the next element within the same row, we have to add the column offset.

To traverse every element in 0th row, we have to do:
```
base_addr + col_off
```

To jump to the next row, we have to go past every element in the current row, which is given by the number of columns and then add the offset for elements in the next row.
```
base_addr + n(cols)*4 + col_off*4
```

To jump to the `ith` row, we have to go past `(i-1)` rows, where each row would have `n(cols)` elements, that means, we have to go past `i*cols*4` to reach the next row. Then add the column offset multiplied by the size. So, the final formula becomes:
```
base_addr + (ith_row * n(cols) * 4) + (column_offset + 4)
```

In simple terms,
```
addr_of_i = ( (i * N_COLS) + j ) * 4
```

Lets test this formula.
```c
#include <stdio.h>

#define ROWS 2
#define COLS 3

int main(void){
  int arr[ROWS][COLS] = {
    {1, 2, 3},
    {4, 5, 6}
  };

  int* base = &arr[0][0];

  for (int i = 0; i < ROWS; i++){
    for (int j = 0; j < COLS; j++){
      printf("%d, ", *(base + (i*3 + j)) );
    }
  }
}
```

We are not multiplying by 4 because the pointer is of type `int` and dereferencing scales to the size of the type automatically.