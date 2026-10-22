---
id: kmo-3
title: When is $5^n+5^m$ a sum of two squares?
source: Kevin's Mathematical Olympiad, Problem 3
topic: number theory
difficulty: 4
max: 10
reviewed: false
---

## Problem

Let $m$ and $n$ be positive integers. Prove that the sum $5^n + 5^m$ can be expressed as the sum of two perfect squares if and only if $n-m$ is even.

## Solutions

### Explicit squares, then modulo 8

By symmetry assume $n\ge m$.

If $n$ and $m$ are both even, $5^n$ and $5^m$ are themselves perfect squares.

If both are odd, write $n=2k+1$ and $m=2j+1$ with $k\ge j$, and let $a=5^{k-j}$. Then
\[5^n+5^m = 5^{2j}\cdot 5\,(a^2+1).\]
Since $(2a+1)^2+(a-2)^2 = 5a^2+5$, this equals
\[\left(5^j(2a+1)\right)^2+\left(5^j(a-2)\right)^2,\]
a sum of two squares.

Conversely, suppose $n$ and $m$ have different parities. Since $5^2\equiv 1 \pmod 8$, an even power of $5$ is $1 \pmod 8$ and an odd power is $5 \pmod 8$, so $5^n+5^m\equiv 6 \pmod 8$. Squares are $0$, $1$ or $4 \pmod 8$, so a sum of two squares is $0,1,2,4$ or $5 \pmod 8$, never $6$. Hence $5^n+5^m$ is not a sum of two squares.

## Mark scheme

- [1] Handles the case $n$, $m$ both even: each term is already a square.
- [3] Handles the case $n$, $m$ both odd with an explicit and correct representation as a sum of two squares (for example via $5(a^2+1)=(2a+1)^2+(a-2)^2$, or the identity $(p^2+q^2)(r^2+s^2)=(pr-qs)^2+(ps+qr)^2$ with $5=1^2+2^2$).
- [2] Shows that a sum of two squares is never $6 \pmod 8$, by listing squares modulo $8$.
- [2] Shows that when $n$ and $m$ have different parities, $5^n+5^m\equiv 6 \pmod 8$.
- [1] Organises the proof so that both directions of the "if and only if" are clearly proved.
- [1] The algebra in the explicit representation is shown, not just asserted, and is correct for every $j \le k$.
- Cap 6: Only one direction of the "if and only if" is proved.

## Fatal errors

- Working modulo $4$ instead of modulo $8$. Then $5^n+5^m\equiv 2 \pmod 4$, but sums of two squares can be $2 \pmod 4$ (for example $1+1$), so there is no contradiction. The 4 marks for the "only if" direction are not earned.
- Proving the both-odd case only for $n=m$ (where $2\cdot 5^n$ is easy) and claiming the general case follows.
- Quoting the two-squares theorem (a number is a sum of two squares if and only if every prime $\equiv 3 \pmod 4$ divides it to an even power) without checking the prime factorisation of $5^{n-m}+1$. Used correctly and completely, this is an acceptable alternative for the "only if" direction.

## Not enough

- Checking small cases such as $5+25=30$ or $5+125=130=9^2+7^2$ earns nothing on its own.
- Stating "$5$ is a sum of two squares, so products of $5$ are too" without dealing with the factor $a^2+1$ earns at most 1 of the 3 marks for the both-odd case.

## Marked examples

### Complete
Mark: 10
Comment: Both directions, an explicit identity that is checked, and the right modulus. Exactly what is wanted.

Assume $n\ge m$. If both are even, $5^n=(5^{n/2})^2$ and $5^m=(5^{m/2})^2$, done. If both are odd, $n=2k+1$, $m=2j+1$, and $5^n+5^m=25^j\cdot 5(25^{k-j}+1)$. Put $a=5^{k-j}$; then $5(a^2+1)=5a^2+5=(2a+1)^2+(a-2)^2$, which you can check by expanding: $4a^2+4a+1+a^2-4a+4=5a^2+5$. So $5^n+5^m=(5^j(2a+1))^2+(5^j(a-2))^2$. For the converse, if $n,m$ have different parities then one power of 5 is a square, $\equiv 1 \pmod 8$, and the other is $5$ times a square, $\equiv 5 \pmod 8$, as odd squares are $1 \pmod 8$. The sum is $6 \pmod 8$. Squares mod 8 are $0,1,4$, and no two of these add to $6$. So the sum is not a sum of two squares.

### One direction only
Mark: 5
Comment: The "if" direction is complete (both cases, with the algebra shown) and earns 5 marks, but the "only if" direction is never attempted, so the organisation mark for proving both directions is not earned either.

We need to show it is a sum of two squares when $n-m$ is even. If $n,m$ are both even, each term is a square. If both are odd, take $n=2k+1$, $m=2j+1$ with $k\ge j$ and $a=5^{k-j}$. Then $5^n+5^m=5^{2j}\cdot 5(a^2+1)$ and $5(a^2+1)=(2a+1)^2+(a-2)^2$ because both sides equal $5a^2+5$. So $5^n+5^m=(5^j(2a+1))^2+(5^j(a-2))^2$. This proves the statement.

### Convincing but the modulus is too weak
Mark: 5
Comment: The "if" direction is correct and earns 5. The "only if" argument works modulo 4 and gets $5^n+5^m\equiv 2 \pmod 4$, then claims a sum of two squares cannot be $2 \pmod 4$. That is false ($1^2+1^2=2$), so the converse is not proved.

If $n$ and $m$ are both even, both terms are squares. If both are odd, with $n=2k+1\ge m=2j+1$ and $a=5^{k-j}$, we have $5^n+5^m=5^{2j}\cdot 5(a^2+1)=(5^j(2a+1))^2+(5^j(a-2))^2$, since $(2a+1)^2+(a-2)^2=5a^2+5$. Now suppose one exponent is even and the other odd. Every power of 5 is $1 \pmod 4$, so the sum is $2 \pmod 4$. A square is $0$ or $1 \pmod 4$, and a sum of two squares is therefore $0$ or $1 \pmod 4$, never $2$. So the sum is not a sum of two squares when $n-m$ is odd.
