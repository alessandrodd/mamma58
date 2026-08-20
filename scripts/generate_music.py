"""Genera brevi temi WAV originali per il gioco, senza dipendenze esterne."""
from array import array
from math import pi, sin
from pathlib import Path
import wave

RATE = 22050
OUT = Path(__file__).resolve().parent.parent / "assets" / "music"

TRACKS = {
    "welcome": (92, [72, 76, 79, 76, 74, 77, 81, 79], [48, 45, 41, 43], "piano"),
    "cup": (108, [67, 71, 74, 79, 76, 74, 71, 69], [43, 50, 48, 45], "piano"),
    "sequenza": (112, [72, 76, 79, 84, 79, 76, 74, 79], [48, 45, 53, 43], "bell"),
    "coppie": (98, [69, 73, 76, 73, 71, 74, 78, 76], [45, 52, 50, 47], "piano"),
    "passaggi": (106, [67, 71, 74, 71, 76, 74, 71, 69], [43, 50, 40, 48], "guitar"),
    "ritmo": (104, [76, 79, 83, 81, 79, 76, 74, 79], [52, 48, 45, 50], "bell"),
    "logica": (110, [72, 74, 76, 79, 81, 79, 76, 74], [48, 53, 45, 43], "guitar"),
    "quiz": (96, [71, 75, 78, 83, 78, 75, 73, 78], [47, 54, 52, 49], "piano"),
    "finale": (100, [72, 76, 79, 84, 83, 79, 76, 79], [48, 53, 45, 43], "bell"),
    "regali": (88, [74, 78, 81, 86, 81, 78, 76, 81], [50, 47, 43, 45], "piano"),
}

CLUES = [
    ([72, 76, 79, 76], [72, 76, 81, 76]),
    ([69, 72, 76, 74], [69, 72, 76, 77]),
    ([67, 71, 74, 79], [67, 71, 73, 79]),
]


def frequency(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def instrument(phase, age, style):
    if style == "bell":
        sound = sin(phase) * .72 + sin(phase * 2.01) * .18 + sin(phase * 3.98) * .10
        return sound * max(0, 1 - age) ** 1.8
    if style == "guitar":
        sound = sin(phase) * .75 + sin(phase * 2) * .18 + sin(phase * 3) * .07
        return sound * max(0, 1 - age) ** 2.7
    sound = sin(phase) * .80 + sin(phase * 2) * .14 + sin(phase * 3) * .06
    return sound * max(0, 1 - age) ** 2.1


def build_track(tempo, notes, chord_roots, style):
    beat = 60 / tempo
    loops = 4
    total = int(len(notes) * beat * loops * RATE)
    data = array("h")
    for i in range(total):
        t = i / RATE
        step_float = t / beat
        step = int(step_float)
        note = notes[step % len(notes)]
        local = step_float - step
        attack = min(1.0, local / .025)
        melody = instrument(2 * pi * frequency(note) * t, local, style) * attack
        bar_float = step_float / 2
        bar = int(bar_float)
        bar_local = bar_float - bar
        root = chord_roots[bar % len(chord_roots)]
        chord = sum(sin(2 * pi * frequency(root + semitone) * t) * strength
                    for semitone, strength in ((0, .42), (4, .30), (7, .28)))
        pad_envelope = min(1, bar_local / .12) * min(1, (1 - bar_local) / .18)
        bass = sin(2 * pi * frequency(root - 12) * t) * (.7 + .3 * sin(pi * local))
        shaker = sin(2 * pi * 3200 * t) * max(0, 1 - local / .045) ** 5 if step % 2 else 0
        value = max(-1, min(1, melody * .25 + chord * pad_envelope * .10 + bass * .10 + shaker * .012))
        data.append(int(value * 32767))
    return data


def build_clue(notes):
    note_length = .48
    total = int(len(notes) * note_length * RATE)
    data = array("h")
    for i in range(total):
        t = i / RATE
        note_index = min(len(notes) - 1, int(t / note_length))
        local = (t % note_length) / note_length
        attack = min(1, local / .06)
        release = max(0, 1 - local) ** 1.8
        phase = 2 * pi * frequency(notes[note_index]) * t
        sound = sin(phase) * .78 + sin(phase * 2) * .16 + sin(phase * 3) * .06
        data.append(int(sound * attack * release * .42 * 32767))
    return data


OUT.mkdir(parents=True, exist_ok=True)
for name, settings in TRACKS.items():
    with wave.open(str(OUT / f"{name}.wav"), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(build_track(*settings).tobytes())
    print(OUT / f"{name}.wav")

CLUE_OUT = OUT / "indizi"
CLUE_OUT.mkdir(parents=True, exist_ok=True)
for index, (normal, odd) in enumerate(CLUES, 1):
    for kind, notes in (("uguale", normal), ("stonata", odd)):
        path = CLUE_OUT / f"manche-{index}-{kind}.wav"
        with wave.open(str(path), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(RATE)
            output.writeframes(build_clue(notes).tobytes())
        print(path)
