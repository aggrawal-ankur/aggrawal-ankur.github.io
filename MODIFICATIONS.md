| # | Description |
| - | ----------- |
| 2 | Made the code blocks more visually coherent with the rest of the site. |
| 5 | Don't italicize `>` blocks automatically. And probably the font size a little small would be best. |
| 6 | Not all pages require the share link in the end. |
| 7 | I prefer "Sep 1, 2026" |
| 10 | CSS rendering issue in site-credits |

# #1 Support For Draft Pages

Every post has a front matter that accepts certain fields that allow astro to do tweak stuff.

I need a field called `draft` that accepts "true" and "false" as valid values.

When `draft: true`, astro must not build this markdown for production. If it was already in production before, the existing link must not be able to access this page.

The goal is that I can write as many posts as I want but release them slowly.

The absence of this field is equivalent to `draft: false`, in which case astro must build this page for production.

# #2 A place to put a photograph of the author in the About section

Allow to put a small photo of the author at the top of the About page, between the "ABOUT" and the first paragraph.

The layout must be circular, but other shapes are welcomed if you think that is better. You can try various layouts and choose the best one. I presume that a circle would be great.

This should not be mandatory.

# #3 Disable the first letter being very big

In posts, the first letter in the first paragraph is very big. Make its size normal as everything else.

# #4 A way to add timeline in showcase

I need to place the timeline in which that particular project was done, from the starting date to the ending date, with days calculated in parenthesis. For example:
```
August 10, 2026 - September 05, 2026 (27 days)
```

# #5 Hide the RSS field in the home page and the footers in all the pages.

# #6 The space between two words

The theme uses `letter-spacing`. Please modify it such that the space between the words is adequate.
