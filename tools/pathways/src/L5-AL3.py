# Source for unit L5-AL3. Run tools/pathways/make_unit.py L5-AL3 to write units/L5-AL3.json.
UNIT = dict(
id='L5-AL3', level=5, strand='AL',
title='Hölder, majorisation and smoothing',
blurb='The tools that decide BMO2 and IMO inequalities once AM-GM and Cauchy-Schwarz run out, namely weighted AM-GM and Hölder, Jensen, Karamata and Muirhead, mixing variables, and choosing a method from the equality case.',
minutes=180,
prereqs=['L4-AL2'],
outcomes=[
 'Use weighted AM-GM and Hölder, including the form for sums of fractions with roots in the denominator, with the exponents read off from the equality case',
 'Check a majorisation and apply Jensen, Karamata and Muirhead, in particular to find the maximum of a convex expression on a box',
 'Prove a symmetric inequality by mixing variables, justifying the mixing step and the reduced one-variable inequality, and choose a method from where equality holds',
],
contests=['BMO Round 2', 'EGMO and IMO selection', 'USAMO', 'IMO'],

lesson=r'''
<p>Let $a,b,c\in[0,2]$ with $a+b+c=3$. Find the largest value of $a^4+b^4+c^4$.</p>
<p>Every tool of L4-AL2 proves lower bounds for sums of powers, and every one of them is sharp at $a=b=c$. Here we want an upper bound, and the answer $17$ is attained at $(2,1,0)$, a corner of the region. No chain of AM-GM steps reaches that point. The question is about convexity, and the right tool is majorisation, which we meet in the second section.</p>
<p>This unit collects the methods that strong solvers reach for once AM-GM and Cauchy-Schwarz stop working. Weighted AM-GM and Hölder handle products and fractions with roots. Jensen, Karamata and Muirhead turn convexity into inequalities between whole vectors. Mixing variables reduces a symmetric inequality to a one-variable check, and works when equality holds away from the centre. In the last section we use the equality case to decide which of these to try. We assume L4-AL2 throughout. For three variables we write $p=a+b+c$, $q=ab+bc+ca$, $r=abc$, and $\sum$ for a sum over the three cyclic shifts of $(a,b,c)$.</p>

<h3>Weighted AM-GM and Hölder</h3>
<div class="key"><p><strong>Theorem 1 (weighted AM-GM and Jensen).</strong> Let $w_1,\dots,w_n\ge0$ with $w_1+\dots+w_n=1$. For positive reals $x_i$,
\[w_1x_1+\dots+w_nx_n\ge x_1^{w_1}x_2^{w_2}\cdots x_n^{w_n},\]
with equality when all $x_i$ with $w_i>0$ are equal. More generally, if $f$ is convex on an interval $I$ and $x_i\in I$, then $\sum w_if(x_i)\ge f\left(\sum w_ix_i\right)$.</p>
<p><em>Proof.</em> The second statement is Jensen's inequality. The first follows from Jensen applied to the concave function $\ln$, after taking logarithms.</p></div>
<div class="key"><p><strong>Theorem 2 (Hölder).</strong> Let $\alpha,\beta,\gamma>0$ with $\alpha+\beta+\gamma=1$, and let $x_i,y_i,z_i$ be positive reals for $i=1,\dots,n$. Then
\[\Big(\sum x_i\Big)^{\alpha}\Big(\sum y_i\Big)^{\beta}\Big(\sum z_i\Big)^{\gamma}\ge\sum x_i^{\alpha}y_i^{\beta}z_i^{\gamma},\]
with equality when the three sequences are proportional. The same holds with any number of sequences.</p>
<p><em>Proof.</em> Let $X=\sum x_i$, $Y=\sum y_i$, $Z=\sum z_i$. By Theorem 1, for each $i$,
\[\Big(\frac{x_i}{X}\Big)^{\alpha}\Big(\frac{y_i}{Y}\Big)^{\beta}\Big(\frac{z_i}{Z}\Big)^{\gamma}\le\alpha\frac{x_i}{X}+\beta\frac{y_i}{Y}+\gamma\frac{z_i}{Z}.\]
Summing over $i$, the right side adds up to $\alpha+\beta+\gamma=1$, and we multiply through by $X^\alpha Y^\beta Z^\gamma$.</p></div>
<p>With $\alpha=\beta=\gamma=\frac13$ and the sequences $a_i^3,b_i^3,c_i^3$ we get the form most often quoted, $(\sum a_i^3)(\sum b_i^3)(\sum c_i^3)\ge(\sum a_ib_ic_i)^3$. In practice we use Hölder through one consequence, which deals with roots in a denominator.</p>
<div class="key"><p><strong>Corollary 3.</strong> For positive reals $x_i,y_i$ and an integer $k\ge1$,
\[\Big(\sum\frac{x_i}{\sqrt[k]{y_i}}\Big)^{k}\Big(\sum x_iy_i\Big)\ge\Big(\sum x_i\Big)^{k+1}.\]</p>
<p><em>Proof.</em> We apply Hölder to $k$ copies of the sequence $x_i/\sqrt[k]{y_i}$ and one copy of $x_iy_i$, each with exponent $\frac1{k+1}$. The product of the $k+1$ terms with index $i$ is $x_i^{k+1}$, so the right side of Theorem 2 is $\sum x_i$.</p></div>
<p>For $k=1$ this is the Engel form of Cauchy-Schwarz. The point of the corollary is that the second factor $\sum x_iy_i$ contains no roots, so we are left with a polynomial inequality.</p>
<div class="eg"><p class="egq"><strong>Example 1.</strong> Prove that for all positive reals $a,b,c$, \[\frac{a}{\sqrt{b+c}}+\frac{b}{\sqrt{c+a}}+\frac{c}{\sqrt{a+b}}\ge\sqrt{\frac{3(a+b+c)}{2}}.\]</p>
<div class="egs">
<p>We apply Corollary 3 with $k=2$, $x=a$ and $y=b+c$. Since $\sum a(b+c)=2q$, we get
\[\Big(\sum\frac{a}{\sqrt{b+c}}\Big)^2\ge\frac{p^3}{2q}.\]
As $p^2\ge3q$, the right side is at least $\frac{p^3}{2p^2/3}=\frac{3p}{2}$, and taking square roots finishes. For equality we need $p^2=3q$, so $a=b=c$, and at $a=b=c$ both sides are equal.</p>
<p>Two applications of Cauchy-Schwarz also work here. With Hölder we need only one step, and from the shape $x/\sqrt[k]{y}$ we can read off the exponent in advance.</p>
</div></div>

<h3>Convexity and majorisation</h3>
<p>Jensen compares a sum of values of a convex function with the value at the mean. Often we need more, namely a comparison between two vectors neither of which is constant. For a vector we write $x_{(1)}\ge x_{(2)}\ge\dots\ge x_{(n)}$ for its entries in decreasing order.</p>
<div class="key"><p><strong>Definition.</strong> A vector $x$ <em>majorises</em> $y$, written $x\succ y$, if both have $n$ entries, the totals are equal, and for each $k$ the sum of the $k$ largest entries of $x$ is at least the sum of the $k$ largest entries of $y$.</p>
<p><strong>Theorem 4 (Karamata).</strong> If $f$ is convex on an interval $I$, all entries lie in $I$ and $x\succ y$, then $\sum f(x_i)\ge\sum f(y_i)$.</p>
<p><em>Proof.</em> Sort both vectors in decreasing order. Let $c_i$ be the slope of the chord of $f$ between $x_i$ and $y_i$ (any slope of a supporting line if $x_i=y_i$). For a convex function this slope increases with each endpoint, and both $x_i$ and $y_i$ decrease with $i$, so $c_1\ge c_2\ge\dots\ge c_n$. Let $X_k$ and $Y_k$ be the partial sums. By Abel summation,
\[\sum\big(f(x_i)-f(y_i)\big)=\sum c_i(x_i-y_i)=\sum_{k=1}^{n-1}(c_k-c_{k+1})(X_k-Y_k)+c_n(X_n-Y_n)\ge0,\]
since $c_k\ge c_{k+1}$, $X_k\ge Y_k$ and $X_n=Y_n$.</p></div>
<p>The constant vector $(m,\dots,m)$ with the same total is majorised by every vector, so Karamata contains Jensen. The new use is for maxima. On a box with fixed total, one vector with as many entries as possible at the ends of the box majorises all the others, and a convex function is largest there.</p>
<div class="eg"><p class="egq"><strong>Example 2.</strong> Let $a,b,c\in[0,2]$ with $a+b+c=3$. Find the largest value of $a^4+b^4+c^4$.</p>
<div class="egs">
<p>Order the variables as $a\ge b\ge c$. We claim $(2,1,0)\succ(a,b,c)$. The totals are both $3$. Also $a\le2$, and $a+b=3-c\le3$. So both partial sums of $(2,1,0)$ are at least those of $(a,b,c)$. The function $x^4$ is convex, so by Karamata
\[a^4+b^4+c^4\le2^4+1^4+0^4=17.\]
The value $17$ is attained at $(2,1,0)$, so $17$ is the answer.</p>
</div></div>
<p>For symmetric polynomials there is a version of Karamata for exponents. We write $\sum_{\mathrm{sym}}a^{\alpha_1}b^{\alpha_2}c^{\alpha_3}$ for the sum over all six orderings of the exponents.</p>
<div class="key"><p><strong>Theorem 5 (Muirhead).</strong> If $(\alpha_1,\alpha_2,\alpha_3)\succ(\beta_1,\beta_2,\beta_3)$ and $a,b,c\ge0$, then $\sum_{\mathrm{sym}}a^{\alpha_1}b^{\alpha_2}c^{\alpha_3}\ge\sum_{\mathrm{sym}}a^{\beta_1}b^{\beta_2}c^{\beta_3}$.</p></div>
<p>For example, from $(3,1,0)\succ(2,1,1)$ we get $\sum_{\mathrm{sym}}a^3b\ge\sum_{\mathrm{sym}}a^2bc=2abc(a+b+c)$. Muirhead is accepted at most olympiads, but each instance is a short weighted AM-GM. Here, by AM-GM, $\frac14(a^3b+a^3c+ab^3+ac^3)\ge a^2bc$, and adding the three cyclic shifts we obtain the same inequality. Writing the AM-GM out costs one line and removes any doubt.</p>

<h3>Mixing variables</h3>
<p>When equality holds at $(1,1,1)$ and also at a point such as $(\frac32,\frac32,0)$, every term-by-term method fails. Mixing variables handles this. We replace two variables by their mean and show the expression does not increase. The inequality then reduces to a one-variable check.</p>
<div class="key"><p><strong>Principle 6.</strong> To prove $F(a,b,c)\ge0$ for a symmetric $F$ on a symmetric region, let $t=\frac{a+b}{2}$ and prove two things. First, $F(a,b,c)\ge F(t,t,c)$ whenever $c$ is the smallest variable. Second, $F(t,t,c)\ge0$. Then $F(a,b,c)\ge F(t,t,c)\ge0$ for every point, after relabelling so that $c$ is the smallest.</p></div>
<p>The first step is a two-variable identity. We expand $F(a,b,c)-F(t,t,c)$, take out the factor $(a-b)^2$, and use $c=\min$ to fix the sign of the rest. The choice of $c$ as the smallest (or the largest) is the whole art, because the bracket usually has a sign only under one of these assumptions. One step is enough, so no limiting argument is needed.</p>
<div class="eg"><p class="egq"><strong>Example 3.</strong> Let $a,b,c\ge0$ with $a+b+c=3$. Prove that $a^2+b^2+c^2+abc\ge4$.</p>
<div class="egs">
<p>Let $F(a,b,c)=a^2+b^2+c^2+abc-4$, assume $c$ is the smallest, and let $t=\frac{a+b}{2}$. Since $a^2+b^2-2t^2=\frac{(a-b)^2}{2}$ and $ab-t^2=-\frac{(a-b)^2}{4}$,
\[F(a,b,c)-F(t,t,c)=\frac{(a-b)^2}{2}-\frac{c(a-b)^2}{4}=\frac{(a-b)^2(2-c)}{4}\ge0,\]
because $c\le1$. Now $c=3-2t$ with $1\le t\le\frac32$, and
\[F(t,t,3-2t)=2t^2+(3-2t)^2+t^2(3-2t)-4=-2t^3+9t^2-12t+5=(t-1)^2(5-2t)\ge0.\]
For equality we need $a=b$ and $t=1$, so $a=b=c=1$.</p>
</div></div>
<p>With four or more variables we mix a whole group at once, replacing three variables by their mean while the smallest one stays fixed. Practice Problem 5 is an example.</p>

<h3>Reading the equality case</h3>
<p>Before choosing a method, we find every case of equality, including those on the boundary. Testing $(1,1,1)$, $(t,t,0)$, $(1,0,0)$ and the corners of any box usually finds all of them.</p>
<ol>
<li>Equality only at the centre, with fractions or roots. Try the tangent line trick, Cauchy-Schwarz, or Hölder with the exponent set by the root.</li>
<li>Equality at the centre and on the boundary, such as $(t,t,0)$. Term-by-term bounds cannot work. Try mixing variables, Schur or SOS.</li>
<li>A maximum of a convex expression, or equality at a corner. Use Karamata on the box.</li>
<li>Products such as $x^y$ or $\prod(1+a_k)^k$. Use weighted AM-GM with the weights read off from the exponents.</li>
</ol>
<p>Normalising also helps. A homogeneous inequality lets us fix $a+b+c=3$ or $abc=1$. The condition $abc=1$ often becomes cleaner with $a=\frac xy$, $b=\frac yz$, $c=\frac zx$, and the sides of a triangle become $a=y+z$, $b=z+x$, $c=x+y$ with $x,y,z>0$.</p>

<h3>What a marker needs to see</h3>
<ol>
<li>For Hölder, name the sequences and the exponents, or the form of Corollary 3 used. State when equality holds and check that the equality case of the problem is reachable.</li>
<li>For Jensen and Karamata, prove convexity on the interval where the variables lie, usually from the second derivative. For Karamata, write out the partial sums of the majorisation.</li>
<li>For mixing variables, show the identity for $F(a,b,c)-F(t,t,c)$, say why the sign condition holds (for example "$c$ is the smallest, so $c\le1$"), and prove the reduced inequality with a factorisation.</li>
<li>For a "find the largest" question, give the bound and a point that attains the bound.</li>
</ol>
<div class="warn"><p><strong>Common traps.</strong></p>
<ul>
<li>Using Hölder with exponents that do not add up to $1$, or with an equality case that the problem does not allow.</li>
<li>Applying Jensen to a function that is convex only on part of the range of the variables.</li>
<li>Getting the direction of a majorisation wrong. The vector with entries pushed to the ends is the larger one.</li>
<li>Mixing two variables without saying which two, so that the sign condition in the first step is not justified.</li>
</ul></div>

<h3>How to spot this in a contest</h3>
<ul>
<li>A root or a power in a denominator, as in $\sum\frac{a}{\sqrt{b+c}}$, suggests Corollary 3.</li>
<li>A product of three factors compared with a cube, such as $(a^3+2)(b^3+2)(c^3+2)$, suggests Hölder with three sequences.</li>
<li>A maximum on a box with fixed total suggests Karamata.</li>
<li>Equality at $(t,t,0)$ as well as at the centre suggests mixing variables.</li>
<li>Exponents such as $a^b$ or $x^x$ suggest weighted AM-GM or Jensen for $x\ln x$.</li>
</ul>
''',

practice=[
dict(stars=2,
q=r'''<p>Positive reals $a,b,c$ satisfy $a^2+b^2+c^2=3$. Prove that \[\frac{a}{\sqrt{b+c}}+\frac{b}{\sqrt{c+a}}+\frac{c}{\sqrt{a+b}}\ge\frac{3}{\sqrt2}.\]</p>''',
hint=r'''Apply Corollary 3 as in Example 1. From the condition we can write $q$ in terms of $p$, and then we finish with an inequality in $p$ alone.''',
sol=r'''<p>By Corollary 3 with $k=2$, $x=a$ and $y=b+c$,
\[\Big(\sum\frac{a}{\sqrt{b+c}}\Big)^2\ge\frac{p^3}{\sum a(b+c)}=\frac{p^3}{2q}.\]
From the condition, $p^2=3+2q$, so $2q=p^2-3$, which is positive. It remains to show $\frac{p^3}{p^2-3}\ge\frac92$, that is,
\[2p^3-9p^2+27\ge0.\]
The left side factorises as $(p-3)^2(2p+3)$, which is non-negative. Taking square roots, we obtain the inequality.</p>
<p>For equality we need $p=3$. Since $p^2\le3(a^2+b^2+c^2)=9$ with equality only when $a=b=c$, we then have $a=b=c=1$. At $a=b=c=1$ both sides equal $\frac3{\sqrt2}$.</p>'''),

dict(stars=2,
q=r'''<p>Positive reals $a,b,c$ satisfy $a+b+c=3$. Prove that \[a^b\,b^c\,c^a\le1\le a^a\,b^b\,c^c.\]</p>''',
hint=r'''For the left inequality, use weighted AM-GM with weights $\frac b3,\frac c3,\frac a3$. For the right inequality, take logarithms.''',
sol=r'''<p>For the left inequality we apply weighted AM-GM to the numbers $a,b,c$ with weights $\frac b3,\frac c3,\frac a3$, which are positive and add up to $1$. We get
\[\big(a^bb^cc^a\big)^{1/3}\le\frac{b\cdot a+c\cdot b+a\cdot c}{3}=\frac q3\le\frac{p^2}{9}=1.\]
</p><p>For the right inequality, let $f(x)=x\ln x$ on $(0,\infty)$. Then $f''(x)=\frac1x>0$, so $f$ is convex, and by Jensen
\[a\ln a+b\ln b+c\ln c\ge3f\Big(\frac{a+b+c}{3}\Big)=3f(1)=0.\]
Exponentiating, we get $a^ab^bc^c\ge1$.</p>
<p>In both steps we have equality only when $a=b=c$, so both inequalities are equalities only at $a=b=c=1$.</p>'''),

dict(stars=3,
q=r'''<p>Let $n\ge2$. Real numbers $x_1,\dots,x_n\in[-1,1]$ satisfy $x_1+x_2+\dots+x_n=0$. Find the largest possible value of $x_1^4+x_2^4+\dots+x_n^4$.</p>''',
hint=r'''Guess the extreme vector by pushing as many entries as possible to $\pm1$. Then check that this vector majorises every allowed vector, using the lower bound $-1$ for the partial sums near the end.''',
ans=r'''$n$ if $n$ is even, and $n-1$ if $n$ is odd''',
sol=r'''<p>The answer is $n$ if $n$ is even and $n-1$ if $n$ is odd. Let $m=\lfloor n/2\rfloor$ and let $e$ be the vector with $m$ entries $1$, $m$ entries $-1$, and one entry $0$ if $n$ is odd. Then $e$ is allowed and $\sum e_i^4=2m$, which is the claimed value.</p>
<p>Now take any allowed vector and sort the entries as $x_1\ge\dots\ge x_n$. We check that $e\succ x$. Both totals are $0$. Let $E_k$ and $X_k$ be the sums of the $k$ largest entries. For $k\le m$ we have $E_k=k$ and $X_k\le k$, as each entry is at most $1$. For $k>m$ the entries of $e$ after the first $m$ are $0$ (if $n$ is odd) and then $-1$, and in both cases $E_k=n-k$. On the other hand
\[X_k=-(x_{k+1}+\dots+x_n)\le n-k,\]
since each of these $n-k$ entries is at least $-1$. So $X_k\le E_k$ for every $k$.</p>
<p>The function $x^4$ is convex, so by Karamata $\sum x_i^4\le\sum e_i^4=2m$. This is $n$ for even $n$ and $n-1$ for odd $n$.</p>'''),

dict(stars=3,
q=r'''<p>Positive reals $a,b,c$ satisfy $a+b+c=3$. Prove that \[\frac{a}{\sqrt{a+2bc}}+\frac{b}{\sqrt{b+2ca}}+\frac{c}{\sqrt{c+2ab}}\ge\sqrt3.\]</p>''',
hint=r'''Corollary 3 with $y=a+2bc$ turns the problem into a bound on $\sum a(a+2bc)$. Write that sum in terms of $q$ and $r$.''',
sol=r'''<p>By Corollary 3 with $k=2$, $x=a$ and $y=a+2bc$,
\[\Big(\sum\frac{a}{\sqrt{a+2bc}}\Big)^2\ge\frac{(a+b+c)^3}{\sum a(a+2bc)}=\frac{27}{a^2+b^2+c^2+6abc}.\]
Since $a^2+b^2+c^2=9-2q$, it suffices to show $9-2q+6r\le9$, that is, $q\ge3r$.</p>
<p>By AM-GM, $q\ge3r^{2/3}$, and also $r\le\big(\frac p3\big)^3=1$. Hence $r^{2/3}\ge r$ and $q\ge3r$. Taking square roots, we obtain the inequality.</p>
<p>For equality we need $q=3r^{2/3}$ and $r=1$, so $a=b=c=1$, where both sides equal $\sqrt3$. As $(a,b,c)$ approaches $(3,0,0)$ the left side also tends to $\sqrt3$, so the constant cannot be improved even though equality there is not attained.</p>'''),

dict(stars=4,
q=r'''<p>Non-negative reals $a,b,c,d$ satisfy $a+b+c+d=4$. Prove that \[3(a^2+b^2+c^2+d^2)+4abcd\ge16,\] and find all cases of equality.</p>''',
hint=r'''Equality holds at $(1,1,1,1)$ and at $(\frac43,\frac43,\frac43,0)$. Fix the smallest variable $d$, and compare the left side with its value when $a,b,c$ are replaced by their mean. Schur's inequality for $a,b,c$ controls $abc$.''',
sol=r'''<p>Assume $d$ is the smallest variable. Write $a+b+c=3s$, $q=ab+bc+ca$ and $r=abc$. Then $d=4-3s$, and from $0\le d\le s$ we get $1\le s\le\frac43$. Let $L$ be the left side and $E=9s^2+3d^2+4ds^3$ its value at $a=b=c=s$. Since $a^2+b^2+c^2=9s^2-2q$,
\[L-E=6(3s^2-q)-4d(s^3-r).\]
Schur's inequality $\sum a(a-b)(a-c)\ge0$ reads $(3s)^3-4(3s)q+9r\ge0$ in terms of $s,q,r$. (For $a\ge b\ge c$ the first two terms add up to $(a-b)\big(a(a-c)-b(b-c)\big)\ge0$ and the third is $c(c-a)(c-b)\ge0$.) Rearranging, we get $s^3-r\le\frac43s(3s^2-q)$. Hence
\[L-E\ge(3s^2-q)\Big(6-\frac{16}{3}ds\Big).\]
Here $3s^2-q\ge0$ since $(a+b+c)^2\ge3q$, and $ds=s(4-3s)\le1$ because $1-s(4-3s)=(3s-1)(s-1)\ge0$. So the bracket is at least $6-\frac{16}{3}>0$, and $L\ge E$.</p>
<p>It remains to show $E\ge16$ for $1\le s\le\frac43$. Substituting $d=4-3s$ and expanding, we get
\[E-16=-12s^4+16s^3+36s^2-72s+32=4(s-1)^2(4-3s)(s+2)\ge0.\]
</p><p>For equality we need $3s^2=q$, so $a=b=c=s$, and also $E=16$, so $s=1$ or $s=\frac43$. The cases of equality are $(1,1,1,1)$ and the four permutations of $(\frac43,\frac43,\frac43,0)$.</p>'''),

dict(stars=4,
q=r'''<p>Let $n\ge3$. Real numbers $x_1,\dots,x_n$ satisfy \[\sum x_i=0\quad\text{and}\quad\sum x_i^2=n(n-1).\] Find the largest possible value of $\sum x_i^3$.</p>''',
hint=r'''Guess the extreme case with one large variable and the rest equal. Then look for a cubic bound $x^3\le\alpha x^2+\beta x+\gamma$ that is sharp at both values in that case, and check on which range of $x$ the bound holds.''',
ans=r'''$n(n-1)(n-2)$''',
sol=r'''<p>The answer is $n(n-1)(n-2)$, attained at $x_1=n-1$ and $x_2=\dots=x_n=-1$, which satisfy both conditions.</p>
<p>First we bound each variable. By Cauchy-Schwarz on the other $n-1$ variables,
\[x_1^2=\Big(\sum_{i\ge2}x_i\Big)^2\le(n-1)\sum_{i\ge2}x_i^2=(n-1)\big(n(n-1)-x_1^2\big),\]
so $nx_1^2\le n(n-1)^2$ and $x_1\le n-1$. The same holds for every variable.</p>
<p>The extreme case uses only the values $-1$ and $n-1$, so we look for a cubic bound that is tangent at $-1$ and sharp at $n-1$. Expanding $(x+1)^2\big(x-(n-1)\big)\le0$, which holds for $x\le n-1$, we get
\[x^3\le(n-3)x^2+(2n-3)x+(n-1).\]
Applying this to each $x_i$ and summing,
\[\sum x_i^3\le(n-3)\cdot n(n-1)+(2n-3)\cdot0+n(n-1)=n(n-1)(n-2).\]
For equality, every $x_i$ must be $-1$ or $n-1$. With total $0$, exactly one variable equals $n-1$.</p>'''),
],

ladder=[
 dict(src='IMO 1995 Problem 2', url='https://artofproblemsolving.com/wiki/index.php/1995_IMO_Problems/Problem_2', stars=2,
      note='Substitute the reciprocals of $a,b,c$. The condition keeps its form and the terms become Engel fractions.'),
 dict(src='IMO 2012 Problem 2', url='https://artofproblemsolving.com/wiki/index.php/2012_IMO_Problems/Problem_2', stars=2,
      note='Split $1+a_k$ into $k$ summands so that AM-GM produces $a_k$ with a power you can use. Then explain why equality is impossible.'),
 dict(src='USAMO 2004 Problem 5', url='https://artofproblemsolving.com/wiki/index.php/2004_USAMO_Problems/Problem_5', stars=3,
      note='Bound each factor below by a simpler polynomial with the same value at $1$, then look for Hölder with three sequences.'),
 dict(src='IMO 2008 Problem 2', url='https://artofproblemsolving.com/wiki/index.php/2008_IMO_Problems/Problem_2', stars=3,
      note='Name the three fractions. The condition $xyz=1$ becomes a polynomial relation between the new variables.'),
 dict(src='IMO 2004 Problem 4', url='https://artofproblemsolving.com/wiki/index.php/2004_IMO_Problems/Problem_4', stars=3,
      note='Suppose three of the numbers fail the triangle inequality and show the product is then at least $n^2+1$. Cauchy-Schwarz handles the other variables.'),
 dict(src='IMO 1999 Problem 2', url='https://artofproblemsolving.com/wiki/index.php/1999_IMO_Problems/Problem_2', stars=3,
      note='Normalise the sum to $1$. Show that merging two of the smallest variables never decreases the left side.'),
 dict(src='IMO 2005 Problem 3', url='https://artofproblemsolving.com/wiki/index.php/2005_IMO_Problems/Problem_3', stars=3,
      note='Use $xyz\\ge1$ to compare each denominator with a homogeneous one, then Cauchy-Schwarz.'),
 dict(src='IMO 2020 Problem 2', url='https://artofproblemsolving.com/wiki/index.php/2020_IMO_Problems/Problem_2', stars=4,
      note='Weighted AM-GM with weights $a,b,c,d$ bounds the product of powers by a sum of squares. Then use the ordering.'),
 dict(src='IMO 2006 Problem 3', url='https://artofproblemsolving.com/wiki/index.php/2006_IMO_Problems/Problem_3', stars=4,
      note='Factorise the left side first. Equality is not at a symmetric point, so find the equality case before choosing a method.'),
],
)
