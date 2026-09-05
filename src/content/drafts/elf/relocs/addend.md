# Addend

Sometimes, the symbol we have to relocate is a specific part of a complex structure.

Symbol resolution calculates only the runtime base address of the symbol. It doesn't account for specifics.

For basic symbols (variables/functions), this is not a problem. But for complex scenarios, this is a problem.

To solve this problem, we need to add a constant value to the runtime base address of the symbol to obtain the final runtime address of the actual thing we require in that structure. This constant value is called **addend**.

For simple symbols, addend is usually 0.

When this addend is stored in the relocation entry, the dynamic linker computes the final value by combining the base address of the symbol with addend. Such relocation is called "relocation with explicit addend, or RELA".

When this addend is embedded in the instruction/data itself and the relocation entry only tells the dynamic linker where to patch, such a relocation is called "relocation without explicit addend, or REL".
