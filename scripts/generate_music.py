"""Genera brevi temi WAV originali per il gioco, senza dipendenze esterne."""
from array import array
from math import pi, sin
from pathlib import Path
import wave

RATE = 22050
OUT = Path(__file__).resolve().parent.parent / "assets" / "music"

TRACKS = {
    "welcome": (108, [60, 64, 67, 64, 62, 65, 69, 65], "soft"),
    "cup": (132, [55, 59, 62, 67, 62, 59, 57, 61], "bright"),
    "sequenza": (142, [60, 64, 67, 72, 67, 64, 62, 66], "chip"),
    "coppie": (116, [57, 61, 64, 61, 59, 62, 66, 62], "soft"),
    "passaggi": (126, [55, 55, 62, 59, 64, 62, 59, 57], "bright"),
    "ritmo": (150, [64, 71, 69, 67, 64, 67, 69, 74], "soft"),
    "logica": (156, [60, 62, 64, 65, 67, 69, 67, 65], "chip"),
    "quiz": (112, [59, 63, 66, 70, 66, 63, 61, 65], "bright"),
    "finale": (120, [60, 64, 67, 72, 76, 72, 67, 64], "bright"),
    "regali": (104, [62, 66, 69, 74, 69, 66, 64, 68], "soft"),
}


def frequency(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def sample_wave(phase, style):
    fundamental = sin(phase)
    if style == "soft":
        return fundamental * 0.78 + sin(phase * 2) * 0.16 + sin(phase * 3) * 0.06
    if style == "chip":
        return (1 if fundamental >= 0 else -1) * 0.62 + sin(phase * 2) * 0.18
    return fundamental * 0.66 + sin(phase * 2) * 0.24 + sin(phase * 3) * 0.10


def build_track(tempo, notes, style):
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
        envelope = min(1.0, local / 0.035) * max(0.0, 1 - local) ** 1.7
        melody = sample_wave(2 * pi * frequency(note) * t, style) * envelope
        bass_note = notes[(step // 2 * 2) % len(notes)] - 12
        bass = sin(2 * pi * frequency(bass_note) * t) * (0.28 if step % 2 == 0 else 0.17)
        pulse = sin(2 * pi * 82 * t) * max(0.0, 1 - (local / 0.16)) ** 3 * 0.18
        value = max(-1, min(1, melody * 0.34 + bass * 0.28 + pulse))
        data.append(int(value * 32767))
    return data


OUT.mkdir(parents=True, exist_ok=True)
for name, settings in TRACKS.items():
    with wave.open(str(OUT / f"{name}.wav"), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(build_track(*settings).tobytes())
    print(OUT / f"{name}.wav")
