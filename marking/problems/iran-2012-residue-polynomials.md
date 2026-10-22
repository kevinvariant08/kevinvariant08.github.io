---
id: iran-2012-residue-polynomials
title: Residue polynomials and complete residue systems
source: Iran Mathematical Olympiad 2011-2012
topic: number theory
difficulty: 8
max: 10
reviewed: false
---

## Problem

Let $p$ be an odd prime. A polynomial $f(x) = \sum_{j=0}^{n} a_j x^j$ with integer coefficients is called an $i$-residue polynomial if
\[ \sum_{\substack{p-1 \mid j \\ j > 0}} a_j \equiv i \pmod{p}. \]

Prove that the set $\{f(0), f(1), \dots, f(p-1)\}$ forms a complete residue system modulo $p$ if and only if the polynomials $f(x), f^2(x), \dots, f^{p-2}(x)$ are $0$-residue polynomials and $f^{p-1}(x)$ is a $1$-residue polynomial.

Here $f^k(x)$ means the power $f(x)^k$.

## Solutions

### Power sums, then Newton's identities

Lemma. For an integer $k \ge 1$,
\[ \sum_{x=0}^{p-1} x^k \equiv \begin{cases} -1 \pmod p, & (p-1) \mid k, \\ 0 \pmod p, & (p-1) \nmid k. \end{cases} \]
If $(p-1)\mid k$, Fermat's little theorem gives $x^k\equiv 1$ for $1\le x\le p-1$, and $0^k=0$, so the sum is $p-1\equiv -1$. If $(p-1)\nmid k$, let $g$ be a primitive root modulo $p$. Then $g^k\not\equiv 1$, and $\sum_{x=1}^{p-1}x^k\equiv\sum_{t=0}^{p-2}g^{tk}=\frac{g^{k(p-1)}-1}{g^k-1}\equiv 0$, since the numerator is divisible by $p$ and the denominator is not.

Reduction. For any polynomial $h(x)=\sum_j c_j x^j$ with integer coefficients,
\[ \sum_{x=0}^{p-1} h(x)=\sum_j c_j \sum_{x=0}^{p-1} x^j \equiv -\sum_{\substack{p-1\mid j\\ j>0}} c_j \pmod p, \]
because the $j=0$ term contributes $c_0\cdot p\equiv 0$. So $h$ is an $i$-residue polynomial exactly when $\sum_{x} h(x)\equiv -i$. Writing $s_k=\sum_{x=0}^{p-1} f(x)^k$, the condition in the problem is: $s_k\equiv 0$ for $1\le k\le p-2$ and $s_{p-1}\equiv -1$.

Forward direction. If $f(0),\dots,f(p-1)$ is a complete residue system, then $s_k\equiv\sum_{y=0}^{p-1}y^k$, which by the lemma is $0$ for $1\le k\le p-2$ and $-1$ for $k=p-1$.

Converse. Let $b_x=f(x)$ and $G(t)=\prod_{x=0}^{p-1}(t-b_x)=t^p+e_1t^{p-1}+\dots+e_{p-1}t+e_p$. If no $b_x$ were divisible by $p$, Fermat would give $s_{p-1}\equiv p\equiv 0$, contradicting $s_{p-1}\equiv -1$. So some $b_x\equiv 0$, and $e_p=\pm\prod b_x\equiv 0$.
Newton's identities over the integers give $s_k+e_1s_{k-1}+\dots+e_{k-1}s_1+ke_k=0$ for $1\le k\le p-1$. For $k\le p-2$ the power sums $s_1,\dots,s_k$ vanish modulo $p$, so $ke_k\equiv 0$, and $k$ is invertible modulo $p$, giving $e_k\equiv 0$. For $k=p-1$ this leaves $s_{p-1}+(p-1)e_{p-1}\equiv 0$, so $-1-e_{p-1}\equiv 0$ and $e_{p-1}\equiv -1$.
Hence $G(t)\equiv t^p-t\pmod p$. Every residue $c$ satisfies $c^p-c\equiv 0$, so $\prod_x (c-b_x)\equiv 0$, and since $p$ is prime some $b_x\equiv c$. The $p$ values $b_x$ meet all $p$ residues, so each exactly once: they form a complete residue system.

### Power sums, then counting with an indicator

The lemma, the reduction and the forward direction are as in the first solution. For the converse, fix a residue $c$ and let $N_c$ be the number of $x\in\{0,\dots,p-1\}$ with $f(x)\equiv c$. By Fermat, $1-(y-c)^{p-1}\equiv 1$ if $y\equiv c$ and $\equiv 0$ otherwise, so
\[ N_c\equiv\sum_{x=0}^{p-1}\bigl(1-(f(x)-c)^{p-1}\bigr)\equiv -\sum_{k=0}^{p-1}\binom{p-1}{k}(-c)^{p-1-k}s_k \pmod p, \]
using $\sum_x 1=p\equiv 0$. Here $s_0=p\equiv 0$, $s_k\equiv 0$ for $1\le k\le p-2$ and $s_{p-1}\equiv -1$, so only the $k=p-1$ term survives and $N_c\equiv 1\pmod p$.
Since $0\le N_c\le p$, this forces $N_c=1$ for every $c$ (the only alternative, $N_c=p+1$, is too big). So every residue is taken exactly once.

## Mark scheme

- [2] Proves the power-sum lemma: $\sum_{x=0}^{p-1}x^k$ is $-1$ modulo $p$ when $(p-1)\mid k$ and $0$ otherwise, for $k\ge 1$ (a primitive root, or multiplying by an $a$ with $a^k\not\equiv 1$). Stating it as a well-known result without proof earns 1.
- [1] Deduces $\sum_{x}h(x)\equiv -\sum_{(p-1)\mid j,\ j>0}c_j$ for any integer polynomial $h$, and so rewrites the conditions as $s_k\equiv 0$ for $1\le k\le p-2$ and $s_{p-1}\equiv -1$, where $s_k=\sum_x f(x)^k$.
- [1] Proves the forward direction: a complete residue system has the same power sums as $0,1,\dots,p-1$, then applies the lemma.
- [1] (Route A) Shows some $f(x)$ is divisible by $p$ (otherwise $s_{p-1}\equiv p\equiv 0$), so the constant term of $\prod(t-f(x))$ is $0$ modulo $p$.
- [2] (Route A) Uses Newton's identities to get $e_1\equiv\dots\equiv e_{p-2}\equiv 0$, noting that $k$ is invertible modulo $p$ for $k\le p-2$.
- [1] (Route A) Uses the $k=p-1$ identity to find $e_{p-1}\equiv -1$, so $\prod(t-f(x))\equiv t^p-t$.
- [2] (Route A) Concludes correctly from $\prod(t-f(x))\equiv t^p-t$: each residue is a root, $p$ prime gives some $f(x)\equiv c$, and $p$ values covering $p$ residues means each appears once.
- [2] (Route B) Expresses $N_c$, the number of $x$ with $f(x)\equiv c$, modulo $p$ as $\sum_x\bigl(1-(f(x)-c)^{p-1}\bigr)$ using Fermat.
- [2] (Route B) Expands binomially and uses the power-sum conditions, including $s_0=p\equiv 0$, to get $N_c\equiv 1 \pmod p$.
- [2] (Route B) Concludes $N_c=1$ for every $c$ from $0\le N_c\le p$.
- Cap 4: Only the forward direction (a complete residue system satisfies the conditions) is proved.

## Fatal errors

- Claiming that the power sums $s_1,\dots,s_{p-1}$ determine the multiset of values modulo $p$ "by Newton's identities" without dealing with $e_p$. The identity at $k=p$ reads $pe_p\equiv\dots$, which says nothing about $e_p$ modulo $p$. A converse resting on this claim earns none of the Route A marks it skips.
- Deriving $e_p\equiv 0$ from Newton's identity at $k=p$, or dividing by $k=p$. The Route A constant-term checkpoint is not earned.
- Reading $f^k(x)$ as the composition $f(f(\cdots f(x)))$ rather than the power $f(x)^k$. This solves a different problem; only the lemma can be credited.
- Writing $\sum_x\sum_j a_jx^j=\bigl(\sum_j a_j\bigr)\bigl(\sum_x x^j\bigr)$. This is false as written; if the next line makes the intended $\sum_j a_j\sum_x x^j$ clear, treat it as a minor slip costing nothing, otherwise the reduction checkpoint is not earned.
- In Route B, forgetting that $N_c$ could be $p+1$ in principle, or concluding $N_c=1$ from $N_c\equiv 1$ without the bound, loses 1 of the 2 conclusion marks.

## Not enough

- Checking the statement for $p=3$ or $p=5$, or for particular polynomials such as $f(x)=x$, earns nothing.
- Stating Newton's identities without applying them modulo $p$ earns nothing towards Route A.
- Observing that a complete residue system means $f$ is a bijection on residues, without connecting it to the residue conditions, earns nothing.

## Marked examples

### Full marks, counting argument
Mark: 10
Comment: Complete and efficient. The lemma is proved, the reduction is clean, and the indicator argument handles the converse with the bound $N_c\le p$ stated.

First, for $k\ge1$ let $T_k=\sum_{x=0}^{p-1}x^k$. If $p-1\mid k$ then $x^k\equiv1$ for $x\ne0$ so $T_k\equiv p-1\equiv-1$. If $p-1\nmid k$, take a primitive root $g$; then $g^k\not\equiv1$ and multiplying the nonzero residues by $g$ permutes them, so $g^kT_k\equiv T_k$, giving $T_k\equiv0$.

For any integer polynomial $h(x)=\sum c_jx^j$, $\sum_{x=0}^{p-1}h(x)=\sum_j c_jT_j$ (with $T_0=p\equiv0$), which is $-\sum_{p-1\mid j,\,j>0}c_j$. So $h$ is $i$-residue iff $\sum_x h(x)\equiv -i$. Let $s_k=\sum_x f(x)^k$. The condition is $s_1\equiv\dots\equiv s_{p-2}\equiv0$ and $s_{p-1}\equiv-1$.

If the values are a complete residue system then $s_k\equiv T_k$, and the lemma gives exactly this.

Conversely, for a residue $c$ let $N_c=\#\{x: f(x)\equiv c\}$. Since $(y-c)^{p-1}$ is $0$ if $y\equiv c$ and $1$ otherwise, $N_c\equiv\sum_x(1-(f(x)-c)^{p-1})\equiv-\sum_{k=0}^{p-1}\binom{p-1}{k}(-c)^{p-1-k}s_k$. All terms vanish except $k=p-1$, so $N_c\equiv-s_{p-1}\equiv1$. But $0\le N_c\le p$, so $N_c=1$ for all $c$, and the values form a complete residue system.

### Newton's identities, last step asserted
Mark: 9
Comment: A strong Route A solution. The only gap is the end: "so the $b_x$ are $0,1,\dots,p-1$" needs a reason, namely that each residue is a root of $t^p-t$ and $p$ is prime, so some $b_x$ hits it, and then counting. One of the two conclusion marks is withheld.

Lemma: $\sum_{x=0}^{p-1}x^k\equiv-1$ if $p-1\mid k$ and $0$ otherwise. Proof: the first case is Fermat. Otherwise pick $a$ with $a^k\not\equiv1$ (a primitive root works); $x\mapsto ax$ permutes the nonzero residues, so $(a^k-1)\sum x^k\equiv0$, hence $\sum x^k\equiv0$.

So for any $h=\sum c_jx^j$, $\sum_{x}h(x)\equiv-\sum_{p-1\mid j>0}c_j$. With $s_k=\sum_x f(x)^k$ the conditions say $s_k\equiv0$ for $k\le p-2$ and $s_{p-1}\equiv-1$. If the $f(x)$ are a complete residue system, $s_k\equiv\sum y^k$ and the lemma gives the conditions.

Conversely let $b_x=f(x)$ and $\prod(t-b_x)=t^p+e_1t^{p-1}+\dots+e_p$. Not all $b_x$ are units, otherwise $s_{p-1}\equiv p\equiv0$; so some $b_x\equiv0$ and $e_p\equiv0$. Newton: $s_k+e_1s_{k-1}+\dots+ke_k=0$. For $k\le p-2$ this gives $ke_k\equiv0$ and $k$ is invertible, so $e_k\equiv0$. For $k=p-1$: $-1+(p-1)e_{p-1}\equiv0$, so $e_{p-1}\equiv-1$. Hence $\prod(t-b_x)\equiv t^p-t=t(t-1)\cdots(t-p+1)$, so the $b_x$ are $0,1,\dots,p-1$ in some order.

### Forward direction and a start on the converse
Mark: 5
Comment: The lemma, the reduction and the forward direction are all correct, and the observation that some $f(x)\equiv0$ is the right first step for Route A. The rest of the converse is "similarly, by symmetric functions", which is not an argument. 5 marks.

We use $\sum_{x=0}^{p-1}x^k\equiv0$ unless $p-1\mid k$, when it is $-1$. Proof: if $p-1\mid k$, Fermat gives $p-1$ ones. If not, with a primitive root $g$ the sum is a geometric series $\frac{g^{k(p-1)}-1}{g^k-1}\equiv0$ because $g^k\ne1$.

Then $\sum_x f(x)^k$ is minus the sum of the coefficients of $f^k$ in degrees divisible by $p-1$. So $f^k$ is $0$-residue iff $\sum_x f(x)^k\equiv0$ and $1$-residue iff it is $\equiv-1$.

If $f(0),\dots,f(p-1)$ is complete, $\sum_x f(x)^k\equiv\sum_y y^k$, which is $0$ for $k\le p-2$ and $-1$ for $k=p-1$. Done.

For the converse, if none of the $f(x)$ were $0$ mod $p$ then $\sum f(x)^{p-1}\equiv p\equiv0\ne-1$, so some $f(x)\equiv0$. Similarly, using symmetric functions, all the other residues must appear, so the set is complete.

### Convincing but the key step is false
Mark: 4
Comment: Everything up to the converse is right and earns 4. The converse claims that the power sums $s_1,\dots,s_{p-1}$ determine the polynomial $\prod(t-f(x))$ modulo $p$. Newton's identities only give $e_1,\dots,e_{p-1}$; the identity for $e_p$ has the coefficient $p\equiv0$, so the constant term is not determined, and the argument never shows it is $0$. No Route A marks are earned.

Lemma: for $k\ge1$, $\sum_{x=0}^{p-1}x^k\equiv-1$ if $p-1\mid k$, else $0$. If $p-1\mid k$ this is Fermat. If not, let $g$ be a primitive root; the nonzero residues are $g^0,\dots,g^{p-2}$ and the sum is $\frac{g^{k(p-1)}-1}{g^k-1}\equiv0$.

Hence for a polynomial $h$, $\sum_x h(x)\equiv-$(sum of coefficients of $x^j$ with $p-1\mid j$, $j>0$). So the conditions say that the numbers $b_x=f(x)$ have power sums $s_k\equiv0$ for $1\le k\le p-2$ and $s_{p-1}\equiv-1$, which are exactly the power sums of $0,1,\dots,p-1$. This proves the forward direction.

For the converse: by Newton's identities, the power sums of a set of numbers determine its elementary symmetric polynomials, and hence the polynomial with those numbers as roots. The $b_x$ and $0,1,\dots,p-1$ have the same power sums, so $\prod(t-b_x)\equiv\prod(t-c)$ and the $b_x$ are a permutation of $0,\dots,p-1$.

### Examples instead of a proof
Mark: 1
Comment: The lemma is quoted correctly but not proved, which earns 1. The rest checks $p=3$ and one polynomial, which proves nothing about general $p$ or $f$.

We know that $1^k+2^k+\dots+(p-1)^k$ is $0$ mod $p$ unless $p-1$ divides $k$, when it is $-1$.

Take $p=3$ and $f(x)=x$. Then $f(0),f(1),f(2)=0,1,2$ is complete. $f$ is $x$, and the only $j$ with $2\mid j$, $j>0$ and $a_j\ne0$ would be even powers, so $f$ is $0$-residue. $f^2=x^2$ has $a_2=1$, so it is $1$-residue. This matches the statement. Also for $f(x)=x^2$ the values are $0,1,1$, not complete, and $f^1=x^2$ has $a_2=1\ne0$, so it is not $0$-residue, which also matches. So the statement is true.
