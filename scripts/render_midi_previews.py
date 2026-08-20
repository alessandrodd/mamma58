"""Renderizza brevi anteprime WAV dai MIDI gratuiti del sito ufficiale dei Pooh."""
from array import array
from collections import defaultdict
from math import pi, sin
from pathlib import Path
import struct
import wave

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "music" / "pooh-midi"
OUTPUT = ROOT / "assets" / "music" / "pooh"
RATE = 22050


def vlq(data, pos):
    value = 0
    while True:
        byte = data[pos]
        pos += 1
        value = (value << 7) | (byte & 0x7f)
        if not byte & 0x80:
            return value, pos


def parse_track(data):
    pos = tick = 0
    running = None
    events = []
    while pos < len(data):
        delta, pos = vlq(data, pos)
        tick += delta
        status = data[pos]
        if status < 0x80:
            status = running
        else:
            pos += 1
            running = status
        if status == 0xff:
            kind = data[pos]
            pos += 1
            length, pos = vlq(data, pos)
            payload = data[pos:pos + length]
            pos += length
            if kind == 0x51 and length == 3:
                events.append((tick, "tempo", int.from_bytes(payload, "big")))
            continue
        if status in (0xf0, 0xf7):
            length, pos = vlq(data, pos)
            pos += length
            continue
        kind, channel = status & 0xf0, status & 0x0f
        size = 1 if kind in (0xc0, 0xd0) else 2
        values = data[pos:pos + size]
        pos += size
        if kind == 0x90:
            note, velocity = values
            events.append((tick, "on" if velocity else "off", channel, note, velocity))
        elif kind == 0x80:
            note, velocity = values
            events.append((tick, "off", channel, note, velocity))
    return events


def parse_midi(path):
    data = path.read_bytes()
    if data[:4] != b"MThd":
        raise ValueError(f"File MIDI non valido: {path}")
    header_length = struct.unpack(">I", data[4:8])[0]
    _, tracks, division = struct.unpack(">HHH", data[8:14])
    pos = 8 + header_length
    events = []
    for _ in range(tracks):
        if data[pos:pos + 4] != b"MTrk":
            raise ValueError("Traccia MIDI non valida")
        length = struct.unpack(">I", data[pos + 4:pos + 8])[0]
        events.extend(parse_track(data[pos + 8:pos + 8 + length]))
        pos += 8 + length
    return division, sorted(events, key=lambda event: event[0])


def tick_converter(events, division):
    tempos = sorted((event[0], event[2]) for event in events if event[1] == "tempo")
    if not tempos or tempos[0][0] != 0:
        tempos.insert(0, (0, 500000))
    segments = []
    elapsed = 0.0
    for index, (tick, tempo) in enumerate(tempos):
        if index:
            previous_tick, previous_tempo = tempos[index - 1]
            elapsed += (tick - previous_tick) * previous_tempo / 1_000_000 / division
        segments.append((tick, elapsed, tempo))

    def convert(tick):
        chosen = segments[0]
        for segment in segments:
            if segment[0] > tick:
                break
            chosen = segment
        base_tick, base_time, tempo = chosen
        return base_time + (tick - base_tick) * tempo / 1_000_000 / division
    return convert


def collect_notes(events, to_seconds):
    active = {}
    channels = defaultdict(list)
    for event in events:
        if event[1] not in ("on", "off"):
            continue
        tick, kind, channel, note, velocity = event
        key = (channel, note)
        if kind == "on":
            active[key] = (to_seconds(tick), velocity)
        elif key in active:
            start, start_velocity = active.pop(key)
            end = to_seconds(tick)
            if end > start:
                channels[channel].append((start, end, note, start_velocity))
    return channels


def choose_melody(channels):
    candidates = []
    for channel, notes in channels.items():
        if channel == 9 or len(notes) < 20:
            continue
        average = sum(note[2] for note in notes) / len(notes)
        melodic = sum(55 <= note[2] <= 88 for note in notes) / len(notes)
        score = melodic * 80 + min(average, 82) + min(len(notes), 250) * .08
        candidates.append((score, channel, notes))
    return max(candidates)[1:]


def select_excerpt(notes, duration=11):
    first = min(note[0] for note in notes)
    # Salta un eventuale lungo count-in ma conserva l'introduzione riconoscibile.
    start = max(0, first - .15)
    return start, [note for note in notes if note[0] < start + duration and note[1] > start]


def render(notes, start, duration=11):
    total = int(duration * RATE)
    mix = [0.0] * total
    for note_start, note_end, midi, velocity in notes:
        begin = max(0, int((note_start - start) * RATE))
        end = min(total, int((note_end - start) * RATE))
        freq = 440 * 2 ** ((midi - 69) / 12)
        note_duration = max(.01, note_end - note_start)
        for index in range(begin, end):
            age = (index - begin) / RATE
            local = age / note_duration
            envelope = min(1, age / .025) * max(0, 1 - local) ** .65
            phase = 2 * pi * freq * age
            timbre = sin(phase) * .78 + sin(phase * 2) * .16 + sin(phase * 3) * .06
            mix[index] += timbre * envelope * (velocity / 127) * .32
    peak = max(max(abs(value) for value in mix), .01)
    scale = .72 / peak
    return array("h", (int(max(-1, min(1, value * scale)) * 32767) for value in mix))


OUTPUT.mkdir(parents=True, exist_ok=True)
for midi_path in sorted(SOURCE.glob("*.mid")):
    division, events = parse_midi(midi_path)
    channels = collect_notes(events, tick_converter(events, division))
    channel, notes = choose_melody(channels)
    start, excerpt = select_excerpt(notes)
    output_path = OUTPUT / f"{midi_path.stem}.wav"
    with wave.open(str(output_path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(render(excerpt, start).tobytes())
    print(f"{midi_path.name}: canale {channel}, {len(excerpt)} note -> {output_path.name}")
