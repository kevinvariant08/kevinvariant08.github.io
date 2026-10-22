---
id: kmo-1
title: When is $p^q+q^p$ prime?
source: Kevin's Mathematical Olympiad, Problem 1
topic: number theory
difficulty: 3
max: 10
reviewed: false
---

## Problem

Find all pairs of primes $(p, q)$ such that $p^q + q^p$ is also prime.

## Solutions

### Parity, then modulo 3

If $p$ and $q$ are both odd, then $p^q$ and $q^p$ are both odd, so $p^q+q^p$ is even and greater than $2$, hence not prime. So one of them is $2$; by symmetry let $p=2$.

If $q=2$ then $2^2+2^2=8$, which is not prime. If $q=3$ then $2^3+3^2=17$, which is prime.

Now let $q>3$ be prime. Then $3 \nmid q$, so $q^2 \equiv 1 \pmod 3$. Since $q$ is odd, $2^q = 2\cdot 4^{(q-1)/2} \equiv 2 \pmod 3$. Hence $2^q+q^2 \equiv 0 \pmod 3$, and since $2^q+q^2>3$ it is composite.

The pairs are $(2,3)$ and $(3,2)$.

## Mark scheme

- [2] Shows that if $p$ and $q$ are both odd then $p^q+q^p$ is even and greater than $2$, so one of the primes must be $2$.
- [1] Rules out $p=q=2$ (the sum is $8$).
- [1] Finds that $q=3$ works, giving $17$.
- [2] Shows $q^2\equiv 1 \pmod 3$ for every prime $q>3$.
- [2] Shows $2^q\equiv 2 \pmod 3$ for odd $q$, with a reason (for example $2^q=2\cdot 4^{(q-1)/2}$, or $2\equiv -1$ and $q$ odd).
- [1] Concludes $3 \mid 2^q+q^2$ and that the sum exceeds $3$, so it is composite for every prime $q>3$.
- [1] States the complete answer, both $(2,3)$ and $(3,2)$.
- Cap 4: The case $q>3$ is handled only by checking examples, with no general argument.
- Cap 8: Either order of the pair is missing from the final answer and nothing else is wrong.

## Fatal errors

- Treating the case $q>3$ by listing a few values of $q$ and calling the pattern proved. This earns nothing for the three checkpoints on the case $q>3$.
- Claiming $2^q\equiv 2 \pmod 3$ for all $q$, which fails for even $q$; acceptable only if the solution has already established that $q$ is odd.
- Concluding "divisible by 3, so not prime" without noting the sum is larger than $3$ loses that checkpoint.

## Not enough

- Stating the answer $(2,3)$ and $(3,2)$ with checking only earns the two marks for the small cases.
- Saying "one of them must be 2 because otherwise the sum is even" without noting the even sum exceeds $2$ earns 1 of the 2 marks for the parity step.

## Marked examples

### Complete and rigorous
Mark: 10
Comment: Every checkpoint is met and the case analysis is complete. Concise and correct.

If both primes are odd, the sum of two odd numbers is even and at least $3^3+3^3=54>2$, so it is not prime. Hence one of the primes is 2. Say $p=2$. If $q=2$ we get $8$, not prime. If $q=3$ we get $8+9=17$, prime. If $q\ge 5$ is prime then $q\equiv \pm1 \pmod 3$, so $q^2\equiv 1$. Also $q$ is odd and $2\equiv -1 \pmod 3$, so $2^q\equiv (-1)^q=-1\equiv 2$. So $2^q+q^2\equiv 0 \pmod 3$ and $2^q+q^2>3$, so it is not prime. The answer is $(p,q)=(2,3)$ or $(3,2)$.

### Right idea, checked rather than proved
Mark: 4
Comment: The parity step and the small cases are fine, but the case $q>3$ is "proved" by examples. Checking $q=5,7,11$ shows a pattern; it does not show that every larger prime fails. Capped at 4.

The sum of two odd numbers is even, and it is bigger than 2, so one prime has to be 2. Take $p=2$. $q=2$: $4+4=8$, no. $q=3$: $8+9=17$, yes. $q=5$: $32+25=57=3\times 19$, no. $q=7$: $128+49=177=3\times 59$, no. $q=11$: $2048+121=2169=3\times 723$, no. These are always multiples of 3, so the only answers are $(2,3)$ and $(3,2)$.

### Looks complete, but the key step is wrong
Mark: 8
Comment: The structure is right and the conclusion is correct, but the claim $2^q\equiv 2\pmod 3$ is justified by "powers of 2 are always 2 mod 3", which is false ($2^2=4\equiv 1$). The fact needed is true only because $q$ is odd, and that is the point of the step. The 2 marks for $2^q\pmod 3$ are withheld.

One of $p,q$ must be 2, otherwise $p^q+q^p$ is even and larger than 2. Let $p=2$. Then $q=2$ gives 8, which fails, and $q=3$ gives 17, which works. For a prime $q>3$, $q$ is not a multiple of 3, so $q^2\equiv 1 \pmod 3$. Powers of 2 are always $2 \bmod 3$, so $2^q\equiv 2$. Then $2^q+q^2\equiv 0\pmod 3$, and it is bigger than 3, so it is composite. So the pairs are $(2,3)$ and $(3,2)$.
