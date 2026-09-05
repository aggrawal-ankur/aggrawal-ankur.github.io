# Functions Of Type Struct

A struct definition like this:
```c
struct Point{
  int x;
  int y;
};
```

... can be used to create a function of its type, like this:
```c
struct Point takePoint(struct Point P){}
```

If you want to avoid writing `struct` every time, use a type definition instead.

```c
typedef struct{
  int x;
  int y;
} Point;

Point takePoint(Point P);
```
