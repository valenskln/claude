# Bande-son synthétisée (aucun échantillon externe, donc aucun droit à céder) :
# nappe d'ambiance en la mineur, arpège discret pendant la démo, impacts sur le logo,
# souffles aux transitions, clics sur les actions du curseur.
# Usage : python3 music.py soundtrack.wav [alerte_s]
import sys, wave
import numpy as np

SR = 44100
X = 0.6                                     # durée des fondus enchaînés
DUR = [19, 24, 24, 13, 15, 10, 7, 9]        # intro, world, zone, sat, layers, map2d, ais, outro
OFF = [sum(DUR[:k]) - k * X for k in range(len(DUR))]
TOTAL = sum(DUR) - (len(DUR) - 1) * X
N = int(TOTAL * SR)
t = np.arange(N) / SR
L = np.zeros(N); Rr = np.zeros(N)
rng = np.random.default_rng(7)

def note(m): return 440.0 * 2 ** ((m - 69) / 12)
def env_ad(n, a, d):                         # attaque / décroissance exponentielle
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)
def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N or j <= 0: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414; Rr[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414
def lowpass(x, fc):                          # filtre passe-bas à un pôle, vectorisé par blocs
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    for k in range(0, len(x), 4096):
        blk = x[k:k + 4096]; out = np.empty_like(blk)
        for i, v in enumerate(blk): acc = (1 - a) * v + a * acc; out[i] = acc
        y[k:k + 4096] = out
    return y

# — nappe : accords tenus, 8 s chacun, attaque et relâche lentes —
CHORDS = [[45, 57, 60, 64, 71], [41, 53, 57, 64, 67], [38, 50, 57, 60, 65], [40, 52, 59, 62, 67]]  # Am9, Fmaj7, Dm9, Em7
pad = np.zeros(N)
for k, c0 in enumerate(np.arange(0, TOTAL, 8.0)):
    chord = CHORDS[k % 4]; n = int(min(10.5, TOTAL - c0) * SR); x = np.arange(n) / SR
    e = np.minimum(1, x / 2.5) * np.minimum(1, np.maximum(0, (10.5 - x) / 2.5))
    s = np.zeros(n)
    for i, m in enumerate(chord):
        f = note(m)
        for det in (-0.12, 0.12):
            ph = rng.uniform(0, 6.28)
            s += (np.sin(2 * np.pi * f * (1 + det / 100) * x + ph) + .25 * np.sin(4 * np.pi * f * x + ph) + .08 * np.sin(6 * np.pi * f * x)) * (0.55 if i == 0 else 0.32)
    i0 = int(c0 * SR); pad[i0:i0 + n] += (s * e)[: N - i0]
pad *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)          # respiration lente
add(lowpass(pad, 1400) * 0.05, 0)

# — arpège discret pendant la démonstration (100 BPM, croches) —
beat = 60 / 100 / 2; a0, a1 = OFF[1] + 1.0, OFF[7] + 0.3
for k, tt in enumerate(np.arange(a0, a1, beat)):
    chord = CHORDS[int(tt // 8) % 4]; m = chord[1:][k % 4] + 12
    n = int(0.5 * SR); x = np.arange(n) / SR; f = note(m)
    s = (np.sin(2 * np.pi * f * x) + .3 * np.sin(4 * np.pi * f * x)) * env_ad(n, .004, .16)
    ramp = min(1, (tt - a0) / 4) * min(1, (a1 - tt) / 3)
    add(s, tt, 0.035 * ramp * (1.0 if k % 2 == 0 else 0.7), pan=0.35 if k % 2 else -0.35)

# — pulsation grave sur les temps, de la plongée à la conclusion —
p0, p1 = OFF[2], OFF[7] + 0.5
for k, tt in enumerate(np.arange(p0, p1, 60 / 100)):
    n = int(0.45 * SR); x = np.arange(n) / SR
    f = 46 + 70 * np.exp(-x * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, .002, .12)
    ramp = min(1, (tt - p0) / 3) * min(1, (p1 - tt) / 2)
    add(s, tt, (0.16 if k % 4 == 0 else 0.09) * ramp)

# — impacts : apparition du logo (intro et conclusion) —
def boom(at, g):
    n = int(4.0 * SR); x = np.arange(n) / SR
    f = 34 + 60 * np.exp(-x * 6); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 1.1)
    nz = lowpass(lowpass(rng.standard_normal(n), 400), 400) * np.minimum(1, x / .03) * np.exp(-x / .35) * 0.9
    add(s + nz, at, g)
boom(OFF[0] + 13.7, 0.5); boom(OFF[7] + 3.7, 0.42)

# — souffles aux transitions —
def whoosh(at, g, length=1.4):
    n = int(length * SR); x = np.arange(n) / SR
    e = np.sin(np.pi * x / length) ** 2
    nz = rng.standard_normal(n); lo = lowpass(lowpass(nz, 900), 1200) * 1.6; hi = lowpass(nz, 4000) - lowpass(nz, 2000)
    s = (lo * 0.8 + lowpass(hi, 6000) * 0.03) * e
    add(s, at - length * 0.6, g, pan=-0.3); add(s[::-1].copy(), at - length * 0.6, g * 0.5, pan=0.3)
for k in range(1, len(OFF)): whoosh(OFF[k] + X / 2, 0.07)
whoosh(OFF[0] + 13.5, 0.08, 2.0)

# — clics d'interface sur les actions du curseur —
def click(at, g=0.12):
    n = int(0.06 * SR); x = np.arange(n) / SR
    add(np.sin(2 * np.pi * 2300 * x) * np.exp(-x / .012) + 0.5 * np.sin(2 * np.pi * 1200 * x) * np.exp(-x / .02), at, g)
for tt in (OFF[1] + 17.9, OFF[2] + 13.7, OFF[2] + 15.2): click(tt)

# — signal d'alerte (contact sans AIS), si l'instant est fourni —
if len(sys.argv) > 2:
    at = float(sys.argv[2])
    for i, (f, d) in enumerate(((988, 0), (740, 0.16))):
        n = int(0.22 * SR); x = np.arange(n) / SR
        add(np.sin(2 * np.pi * f * x) * env_ad(n, .005, .09), at + d, 0.07)

# — réverbération par convolution avec une queue de bruit décroissante —
def reverb(x, secs=2.6, mix=0.28):
    n = int(secs * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 6))
    ir = lowpass(ir, 3500); ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n - 1; size = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - mix) + y * mix * 1.6
L = reverb(L); Rr = reverb(Rr)

# — master : fondus, limiteur doux, normalisation —
fade = np.minimum(1, t / 1.5) * np.minimum(1, (TOTAL - t) / 3.0)
L *= fade; Rr *= fade
pk = max(np.max(np.abs(L)), np.max(np.abs(Rr))); L /= pk; Rr /= pk
L = np.tanh(L * 1.4) / np.tanh(1.4) * 0.8; Rr = np.tanh(Rr * 1.4) / np.tanh(1.4) * 0.8
out = np.stack([L, Rr], axis=1); out = (out * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('bande-son :', round(TOTAL, 2), 's · transitions', [round(o, 1) for o in OFF])
