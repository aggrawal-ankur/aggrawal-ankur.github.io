# Why arrays use 0-based indexing?

When we do counting, we start from 1, not 0. Why do computers count from 0? Why arrays in most of the programming languages index from 0?

Take this:
```c
#include <stdio.h>

int main(void){
  int array_ptr[] = {0, 4, 7, 6, -2};
  for (int i = 0; i < 5; i++){
    printf("%d, ", *(array_ptr + i));
  }
}
```

This program creates an integer array of size 5 and a for-loop iterates over it.

To display each element, it uses pointer dereferencing rather than subscripting the array variable using square brackets, like this `array_ptr[i]`.

Suppose the array is loaded at the address 1000 (in decimals). That means,
  - 1000 stores 0,
  - 1004 stores 4,
  - 1008 stores 7,
  - 1012 stores 6,
  - 1016 stores -2

`array[i]` is basically `*(array + i)`.

The variable name itself refers to the first element in the array. To access the first element, it should be `*(array + 0)`.

If we want to access the first element by normal mathematics, `i = 1`.
  - That'd be, `*(array + 1)`, which is `*(base_addr + 1*4)`

That's why, most general-purpose programming languages use 0-based indexing as it aligns perfectly with how memory is managed at low level.

---

There are programming languages which use 1-based indexing as well.