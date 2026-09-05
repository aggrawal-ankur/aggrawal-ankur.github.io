# Why the main function shouldn't be of type void?

Process hierarchy the reason why the **ISO C Standard** defines `main` function of type `int`.

The two valid signatures for main function includes:
```c
int main(void);
int main(int argc, char *argv[]);
```

Both returns 0 by default, which denotes successful execution.

It can be verified with this [document](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n2310.pdf) on page 24, section "5.1.2.2.1" under "Program Startup" heading.

I too studied the `void main(){}` signature ~5 years back when I started my programming journey.
  - Even in my colleges, professors still use the `void main(){}` signature.
  - My own college professors used it.
