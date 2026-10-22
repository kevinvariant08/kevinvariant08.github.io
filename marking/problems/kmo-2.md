---
id: kmo-2
title: Eleven red points and a rectangle
source: Kevin's Mathematical Olympiad, Problem 2
topic: combinatorics
difficulty: 4
max: 10
reviewed: false
---

## Problem

Let $M$ be the set of points $(x, y)$ in the Cartesian plane such that $x \in \{1,2,3,4,5\}$ and $y \in \{1,2,3,4\}$. Suppose that $11$ of these points are coloured red. Prove that there must exist four red points which form the vertices of a rectangle with sides parallel to the coordinate axes.

## Solutions

### Counting pairs within columns

The grid has $5$ columns ($x$ fixed), each containing $4$ points. Four red points form an axis-parallel rectangle exactly when two different columns each contain red points in the same two rows.

Let column $i$ contain $n_i$ red points, so $\sum n_i = 11$. Column $i$ contains $\binom{n_i}{2}$ pairs of red points, and each pair occupies a pair of rows. Let $S=\sum_{i=1}^{5}\binom{n_i}{2}$.

Now $S=\tfrac12\left(\sum n_i^2-\sum n_i\right)$. By the QM-AM inequality (or Cauchy-Schwarz), $\sum n_i^2 \ge \tfrac{11^2}{5}=24.2$, so $\sum n_i^2\ge 25$ and $S\ge \tfrac12(25-11)=7$.

There are only $\binom42=6$ pairs of rows. Since $S\ge 7>6$, two of the red pairs occupy the same pair of rows. They cannot lie in the same column, because the pairs within one column occupy different pairs of rows. So two different columns have red points in the same two rows, and these four points form the rectangle.

## Mark scheme

- [2] Reformulates the goal: a rectangle exists if and only if two different columns contain red points in the same pair of rows.
- [2] Counts red pairs within columns, $S=\sum \binom{n_i}{2}$, and notes there are $\binom42=6$ pairs of rows.
- [3] Proves $S\ge 7$ with a valid justification (QM-AM, Cauchy-Schwarz, convexity with the extremal distribution $3,2,2,2,2$ justified, or a smoothing argument).
- [2] Applies pigeonhole to $7$ pairs and $6$ row-pairs, and explains why the two matching pairs lie in different columns.
- [1] Concludes that these four red points form an axis-parallel rectangle.
- Cap 5: The bound $S\ge 7$ is asserted, or "the minimum is when the points are spread evenly" is stated without justification.

## Fatal errors

- Counting pairs within rows instead of columns. With $4$ rows of $5$ points the bound is $\sum\binom{m_j}{2}\ge 10$ against $\binom52=10$ pairs of columns, which gives no contradiction. A solution that claims a contradiction here has a false step and earns at most the reformulation marks.
- A chain of "without loss of generality, row 4 has at least 2 red points, so the rest has 9 red points in 15 places..." where the counting does not follow from the previous step. Each unjustified reduction is a gap; if the chain does not establish the result, the pigeonhole and conclusion checkpoints are not met.
- Using pigeonhole on columns only ("some column has 3 red points") without connecting it to a second column sharing two rows.

## Not enough

- Exhibiting a colouring of $10$ points with no rectangle shows the result is sharp but earns no marks on its own.
- Saying "by pigeonhole there is a rectangle" without identifying the pigeons and the holes earns nothing for the pigeonhole checkpoint.

## Marked examples

### Complete
Mark: 10
Comment: Clear reformulation, the bound is proved with Cauchy-Schwarz, and the solution checks that the two matching pairs come from different columns.

Call the vertical lines $x=1,\dots,5$ columns. A rectangle with sides parallel to the axes is the same thing as two columns that both have red points in rows $a$ and $b$. Let column $i$ have $n_i$ red points; then $n_1+\dots+n_5=11$. A column with $n_i$ red points gives $\binom{n_i}{2}$ pairs, each with its own pair of rows. The total number of pairs is $\sum \binom{n_i}{2} = \frac12(\sum n_i^2 - 11)$. By Cauchy-Schwarz, $5\sum n_i^2 \ge (\sum n_i)^2=121$, so $\sum n_i^2\ge 25$ as it is an integer, and the number of pairs is at least $7$. There are only $\binom{4}{2}=6$ choices of two rows, so two pairs use the same two rows. Two pairs in one column cannot use the same two rows, so they are in different columns, and the four points make a rectangle.

### Right method, unproved bound
Mark: 5
Comment: The method is the intended one, but "the pairs are minimised when the points are spread out as evenly as possible" is exactly the step that needs proof. Capped at 5. Also, the solution never says why the two matching pairs are in different columns.

Let column $i$ have $n_i$ red points. The number of red pairs in columns is $\sum\binom{n_i}{2}$. This is smallest when the points are spread out as evenly as possible, i.e. $3,2,2,2,2$, giving $3+1+1+1+1=7$. There are $\binom42=6$ pairs of rows, so by pigeonhole two pairs use the same rows, and that gives a rectangle.

### Convincing but counts the wrong way
Mark: 2
Comment: The reformulation is correct and earns 2. But the solution counts pairs in rows, where the bound is $10$ against $10$ pairs of columns, and then says pigeonhole forces two pairs to coincide. Ten pairs fit into ten places with no repeat, so pigeonhole gives nothing. The argument proves nothing beyond the reformulation.

A rectangle means two rows which have red points in the same two columns. Row $j$ has $m_j$ red points with $\sum m_j=11$ over 4 rows. The number of pairs in rows is $\sum\binom{m_j}{2}$, which is at least $3+3+3+1=10$ when the distribution is $3,3,3,2$. There are $\binom52=10$ pairs of columns. So we have at least 10 pairs and only 10 places, so by pigeonhole two pairs coincide and we get a rectangle.
