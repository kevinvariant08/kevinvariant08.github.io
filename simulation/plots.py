"""Figures for the simulation note.   python simulation/plots.py   -> simulation/figures/*.pdf
Palette: the first three slots of the validated categorical palette (blue, orange, aqua), checked with the dataviz
validator for all pairs in light mode; aqua is under 3:1 contrast, so every line is also direct-labelled and drawn in
its own line style. Reference lines are neutral grey."""
import collections, json, os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'figures'); os.makedirs(OUT, exist_ok=True)
BLUE, ORANGE, AQUA = '#2a78d6', '#eb6834', '#1baf7a'
INK, INK2, MUTED, GRID = '#0b0b0b', '#52514e', '#8a8984', '#e4e3df'
plt.rcParams.update({'font.size': 8.5, 'axes.edgecolor': MUTED, 'axes.labelcolor': INK2, 'xtick.color': INK2,
                     'ytick.color': INK2, 'axes.spines.top': False, 'axes.spines.right': False, 'axes.linewidth': 0.8,
                     'xtick.major.width': 0.8, 'ytick.major.width': 0.8, 'pdf.fonttype': 42})


def style(ax):
    ax.grid(True, color=GRID, linewidth=0.6); ax.set_axisbelow(True)


def label(ax, x, y, text, color, dy=0):
    ax.annotate(text, (x, y), xytext=(6, dy), textcoords='offset points', va='center', fontsize=8, color=INK, fontweight='bold' if color else None)


def recovery():
    d = json.load(open(os.path.join(HERE, 'results', 'recovery.json')))
    g = collections.OrderedDict()
    for r in d['rows']:
        g.setdefault(r['people'], []).append(r)
    x = [sum(r['per_item'] for r in rs) / len(rs) for rs in g.values()]
    mean = lambda f: [sum(f(r) for r in rs) / len(rs) for rs in g.values()]
    lo = lambda f: [min(f(r) for r in rs) for rs in g.values()]
    hi = lambda f: [max(f(r) for r in rs) for rs in g.values()]

    fig, ax = plt.subplots(figsize=(5.6, 2.7)); style(ax)
    prior = mean(lambda r: r['prior']['b_rmse'])
    ax.plot(x, prior, color=MUTED, linewidth=1.2, linestyle=(0, (4, 3)))
    # the 1PL curve sits within 0.01 of the 2PL curve everywhere, so only 2PL is drawn (stated in the note)
    f = lambda r: r['2PL']['b_rmse']
    ax.fill_between(x, lo(f), hi(f), color=BLUE, alpha=0.15, linewidth=0)
    ax.plot(x, mean(f), color=BLUE, linewidth=2, marker='o', markersize=4.5, markeredgecolor='white', markeredgewidth=0.8)
    label(ax, x[-1], mean(f)[-1], 'Calibrated', BLUE)
    label(ax, x[-1], prior[-1], 'Ratings alone', None)
    ax.set_xscale('log'); ax.set_xticks([1, 3, 10, 30, 100]); ax.set_xticklabels(['1', '3', '10', '30', '100'])
    ax.set_xlim(0.9, 330); ax.set_ylim(0, 0.45)
    ax.set_xlabel('Answers per question (mean)'); ax.set_ylabel('RMSE of difficulty $b$')
    fig.tight_layout(); fig.savefig(os.path.join(OUT, 'recovery_b.pdf')); plt.close(fig)

    fig, ax = plt.subplots(figsize=(5.6, 2.4)); style(ax)
    pa = mean(lambda r: r['prior']['a_rmse']); f = lambda r: r['2PL']['a_rmse']
    ax.plot(x, pa, color=MUTED, linewidth=1.2, linestyle=(0, (4, 3)))
    ax.fill_between(x, lo(f), hi(f), color=BLUE, alpha=0.12, linewidth=0)
    ax.plot(x, mean(f), color=BLUE, linewidth=2, marker='o', markersize=4.5, markeredgecolor='white', markeredgewidth=0.8)
    label(ax, x[-1], mean(f)[-1], '2PL fit', BLUE); label(ax, x[-1], pa[-1], 'Prior value', None)
    ax.set_xscale('log'); ax.set_xticks([1, 3, 10, 30, 100]); ax.set_xticklabels(['1', '3', '10', '30', '100'])
    ax.set_xlim(0.9, 330); ax.set_ylim(0, 0.5)
    ax.set_xlabel('Answers per question (mean)'); ax.set_ylabel('RMSE of discrimination $a$')
    fig.tight_layout(); fig.savefig(os.path.join(OUT, 'recovery_a.pdf')); plt.close(fig)


def cat():
    d = json.load(open(os.path.join(HERE, 'results', 'cat.json')))['results']
    steps = list(range(1, 31))
    fig, axes = plt.subplots(1, 2, figsize=(6.0, 2.9), sharey=True)
    lines = []
    for ax, key, title in ((axes[0], 'all/calibrated', 'Calibrated parameters'), (axes[1], 'all/ratings', 'Ratings only (launch day)')):
        style(ax)
        ax.hlines(0.4, 1, 30, color=MUTED, linewidth=1, linestyle=(0, (4, 3)))
        for strat, name, col, ls, dy in (('random', 'Random', AQUA, (0, (1.5, 1.5)), 0), ('smart', 'Smart Practice', BLUE, '-', 4),
                                         ('maxinfo', 'Max. information', ORANGE, (0, (5, 2)), -5)):
            y = d[key][strat]['se']
            ln, = ax.plot(steps, y, color=col, linewidth=2, linestyle=ls, label=name)
            if ax is axes[0]:
                lines.append(ln); label(ax, steps[-1], y[-1], name, col, dy)
        ax.set_title(title, fontsize=8.5, color=INK, loc='left')
        ax.set_xlim(1, 30 if ax is axes[1] else 44); ax.set_ylim(0, 1.0); ax.set_xticks([1, 10, 20, 30])
        ax.set_xlabel('Questions answered')
    axes[0].set_ylabel('Mean standard error of ability')
    fig.legend(handles=[lines[1], lines[2], lines[0]], loc='upper center', ncol=3, frameon=False, fontsize=8, bbox_to_anchor=(0.5, 1.04))
    for sp in ('bottom',): axes[0].spines[sp].set_bounds(1, 30)
    fig.tight_layout(w_pad=2); fig.savefig(os.path.join(OUT, 'cat_se.pdf'), bbox_inches='tight'); plt.close(fig)


recovery(); cat()
print('figures:', sorted(os.listdir(OUT)))
