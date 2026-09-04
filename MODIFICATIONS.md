# #1 CSS rendering issue in site-credits page

The original creator has kept the .astro file for the about page (about.astro) minimal. I have copied that same file for site-credits.md (site-credits.astro).

I need you to copy relevant styles (markdown blockquote and table) from BlogPost.astro into site-credits.astro and tell astro to apply them to site-credits.md.

To understand the difference, open [table link](https://aggrawal-ankur.github.io/posts/writing-with-markdown/#tables) and [blockquote link](https://aggrawal-ankur.github.io/posts/the-quick-brown-fox/#a-short-paragraph-in-the-middle). It shows the correct rendering.

This problem is contained in site-credits.md only. So don't touch anything else.

# #2 Support For Draft Pages

Every post has a front matter that accepts certain fields that allow astro to do tweak stuff.

I need a field called `draft` that accepts "true" and "false" as valid values.

When `draft: true`, astro must not build this markdown for production. If it was already in production before, the existing link must not be able to access this page.

The goal is that I can write as many posts as I want but release them slowly.

The absence of this field is equivalent to `draft: false`, in which case astro must build this page for production.

# #3 The space between two words

The theme uses `letter-spacing`. Please modify it such that the space between the words is adequate. It is not very much readable right now.

# #4 Disable the first letter being very big

In posts, the first letter in the first paragraph is very big. Make its size normal as everything else.

# #5 A way to add timeline in showcase

I need to place the timeline in which that particular project was done, from the starting date to the ending date, with days calculated in parenthesis. For example:
```
August 10, 2026 - September 05, 2026 (27 days)
```

# #6 Blockquote Italics

Right now, the content in blockquote appears in italics by default. I don't want this. If I need italics, I will convey with markdown. Remove this mandatory thing.

# #7 A place to put a photograph of the author in the About section

Allow to put a small photo of the author at the top of the About page, between the "ABOUT" and the first paragraph.

The layout must be circular, but other shapes are welcomed if you think that is better. You can try various layouts and choose the best one. I presume that a circle would be great.

This should not be mandatory.

# #8 Hide the RSS field in the home page and the footers in all the pages.
