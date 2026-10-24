"""IRT model used by Smart Practice: 2PL with a fixed guessing floor, fitted by Bayes-modal EM.

    P(correct | theta) = c + (1 - c) / (1 + exp(-a (theta - b))),   c = 1 / number of options (fixed)

Fitting (Bock-Aitkin marginal maximum likelihood with priors on the item parameters):
  * each person's ability is integrated over a fixed grid instead of being estimated point-wise, which is what
    keeps sparse data (a handful of answers per person) from producing wild estimates;
  * the ability distribution of site users is Normal(mu, sigma), with mu and sigma estimated from the data;
  * item priors: b ~ Normal(b0, b_sd) from the question's rating, log a ~ Normal(log a0, a_log_sd).
The scale is anchored by the b priors (theta = 0 is the median TMUA candidate), not by forcing mu = 0.
"""
import numpy as np
from scipy import sparse

GRID = np.linspace(-4.5, 4.5, 41)


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -35, 35)))


def prob(theta, a, b, c):
    """P(correct). theta, a, b, c broadcast together."""
    return c + (1 - c) * sigmoid(a * (theta - b))


class Data:
    """Responses as parallel arrays: item index, person index, correct (0/1)."""

    def __init__(self, item, person, y, n_items, n_people):
        self.item = np.asarray(item, dtype=np.int64)
        self.person = np.asarray(person, dtype=np.int64)
        self.y = np.asarray(y, dtype=bool)
        self.n_items, self.n_people = n_items, n_people
        r = len(self.y)
        self.by_item = sparse.csr_matrix((np.ones(r), (self.item, np.arange(r))), shape=(n_items, r))
        self.by_person = sparse.csr_matrix((np.ones(r), (self.person, np.arange(r))), shape=(n_people, r))
        self.n_per_item = np.bincount(self.item, minlength=n_items)


def log_lik_grid(data, a, b, c):
    """Per-person log-likelihood at each grid point (people x grid)."""
    p = prob(GRID[None, :], a[:, None], b[:, None], c[:, None])           # items x grid
    lp, lq = np.log(p), np.log1p(-p)
    out = np.zeros((data.n_people, len(GRID)))
    step = 50000
    for s in range(0, len(data.y), step):
        sl = slice(s, s + step)
        rows = np.where(data.y[sl, None], lp[data.item[sl]], lq[data.item[sl]])
        out += data.by_person[:, sl] @ rows
    return out, p


def posterior(data, a, b, c, mu, sigma):
    ll, p = log_lik_grid(data, a, b, c)
    logw = -0.5 * ((GRID - mu) / sigma) ** 2
    lpost = ll + logw[None, :]
    lpost -= lpost.max(axis=1, keepdims=True)
    post = np.exp(lpost)
    post /= post.sum(axis=1, keepdims=True)
    return post, p, ll


def _derivs(n_g, r_g, la, b, c, b0, b_sd, la0, la_sd):
    """Gradient and expected information of one item's expected complete-data log posterior in (b, log a)."""
    a = np.exp(la)
    z = a[:, None] * (GRID[None, :] - b[:, None])
    s = sigmoid(z)
    p = c[:, None] + (1 - c[:, None]) * s
    ds = (1 - c[:, None]) * s * (1 - s)                         # dP/dz
    q = p * (1 - p)
    dl = (r_g - n_g * p) * ds / q                               # d loglik / dz
    info_z = n_g * ds * ds / q                                  # expected information in z
    g_b = (dl * -a[:, None]).sum(1) - (b - b0) / b_sd ** 2
    g_l = (dl * z).sum(1) - (la - la0) / la_sd ** 2
    i_bb = (info_z * a[:, None] ** 2).sum(1) + 1 / b_sd ** 2
    i_ll = (info_z * z * z).sum(1) + 1 / la_sd ** 2
    i_bl = (info_z * -a[:, None] * z).sum(1)
    return g_b, g_l, i_bb, i_bl, i_ll


def item_step(n_g, r_g, a, b, c, b0, b_sd, la0, la_sd, fix_a, iters=4):
    """A few Fisher-scoring steps on each item's expected complete-data log posterior (vectorised over items).
    Returns new (a, b) and the 2x2 information matrices at the new values (for standard errors)."""
    la = np.log(a)
    for _ in range(iters):
        g_b, g_l, i_bb, i_bl, i_ll = _derivs(n_g, r_g, la, b, c, b0, b_sd, la0, la_sd)
        if fix_a:
            b = b + np.clip(g_b / i_bb, -1, 1)
        else:
            det = i_bb * i_ll - i_bl ** 2
            b = b + np.clip((i_ll * g_b - i_bl * g_l) / det, -1, 1)
            la = la + np.clip((i_bb * g_l - i_bl * g_b) / det, -0.5, 0.5)
    _, _, i_bb, i_bl, i_ll = _derivs(n_g, r_g, la, b, c, b0, b_sd, la0, la_sd)
    if fix_a:
        i_bl, i_ll = np.zeros_like(b), np.full_like(b, np.inf)
    return np.exp(la), b, (i_bb, i_bl, i_ll)


def fit(data, c, b0, b_sd, la0, la_sd, fix_a=False, max_iter=300, tol=1e-5):
    """Bayes-modal EM. Returns a dict of item estimates, standard deviations, population and person posteriors."""
    n_items = data.n_items
    a = np.exp(np.broadcast_to(la0, (n_items,)).astype(float)).copy()
    b = np.broadcast_to(b0, (n_items,)).astype(float).copy()
    b0 = np.broadcast_to(b0, (n_items,)).astype(float)
    b_sd = np.broadcast_to(b_sd, (n_items,)).astype(float)
    la0 = np.broadcast_to(la0, (n_items,)).astype(float)
    la_sd = np.broadcast_to(la_sd, (n_items,)).astype(float)
    mu, sigma = 0.0, 1.0
    for it in range(max_iter):
        post, _, _ = posterior(data, a, b, c, mu, sigma)
        pr = post[data.person]                                  # responses x grid
        n_g = data.by_item @ pr
        r_g = data.by_item @ (pr * data.y[:, None])
        a_new, b_new, info = item_step(n_g, r_g, a, b, c, b0, b_sd, la0, la_sd, fix_a)
        m = post @ GRID
        mu_new = float(m.mean())
        sigma_new = float(np.sqrt(max((post @ GRID ** 2).mean() - mu_new ** 2, 0.05)))
        change = max(np.abs(b_new - b).max(), np.abs(np.log(a_new) - np.log(a)).max(), abs(mu_new - mu), abs(sigma_new - sigma))
        a, b, mu, sigma = a_new, b_new, mu_new, sigma_new
        if change < tol:
            break
    post, _, _ = posterior(data, a, b, c, mu, sigma)
    pr = post[data.person]
    n_g = data.by_item @ pr
    r_g = data.by_item @ (pr * data.y[:, None])
    _, _, (i_bb, i_bl, i_ll) = item_step(n_g, r_g, a, b, c, b0, b_sd, la0, la_sd, fix_a, iters=0)
    if fix_a:
        b_se, la_se = 1 / np.sqrt(i_bb), np.zeros_like(b)
    else:
        det = i_bb * i_ll - i_bl ** 2
        b_se, la_se = np.sqrt(i_ll / det), np.sqrt(i_bb / det)
    theta_mean = post @ GRID
    theta_sd = np.sqrt(np.maximum(post @ GRID ** 2 - theta_mean ** 2, 0))
    return {'a': a, 'b': b, 'a_sd': a * la_se, 'b_sd': b_se, 'mu': mu, 'sigma': sigma, 'iterations': it + 1,
            'post': post, 'theta_mean': theta_mean, 'theta_sd': theta_sd}


def eap(responses, a, b, c, mu=0.0, sigma=1.0, grid=GRID):
    """Expected a posteriori ability from a list of (item index, correct) pairs. Returns (mean, sd).
    The browser does the same computation in smart.js."""
    lp = -0.5 * ((grid - mu) / sigma) ** 2
    for i, y in responses:
        p = prob(grid, a[i], b[i], c[i])
        lp = lp + (np.log(p) if y else np.log1p(-p))
    w = np.exp(lp - lp.max()); w /= w.sum()
    m = float(w @ grid)
    return m, float(np.sqrt(max(w @ grid ** 2 - m * m, 0)))


def info(theta, a, b, c):
    """Fisher information of each item at theta (3PL form with fixed c)."""
    p = prob(theta, a, b, c)
    s = sigmoid(a * (theta - b))
    dp = a * (1 - c) * s * (1 - s)
    return dp * dp / (p * (1 - p))
