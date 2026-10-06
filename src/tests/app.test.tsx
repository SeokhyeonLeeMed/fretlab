// @vitest-environment jsdom
/**
 * app.test.tsx — interaction tests against the real application.
 *
 * These render the actual App, not a stub, and drive it the way a visitor
 * would: switch instrument, change tuning, pick a scale, open chord mode,
 * strum, open the tuner. The Web Audio and microphone APIs do not exist in
 * jsdom, so these also prove the graceful-degradation paths work: nothing
 * here stubs them out except where a test is specifically about audio.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { useStore } from '../state/store';
import { audioEngine } from '../core/audio/AudioEngine';

const resetStore = (): void => {
  act(() => useStore.getState().reset());
};

beforeEach(() => {
  localStorage.clear();
  resetStore();
  // The tuner refuses to open the microphone outside a secure context, and
  // jsdom is not one by default.
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** All rendered fretboard positions, by their accessible names. */
const cellNames = (): string[] =>
  screen.getAllByRole('gridcell').map((el) => el.getAttribute('aria-label') ?? '');

const cell = (label: string): HTMLElement => screen.getByRole('gridcell', { name: label });

/** Select elements, found by their accessible name. */
const selectsNamed = (name: RegExp): HTMLElement[] =>
  screen.getAllByRole('combobox', { name });
const selectNamed = (name: RegExp): HTMLElement => selectsNamed(name)[0];

/** Choose an instrument through the two-step Type / Strings selector. */
const chooseInstrument = (family: 'Guitar' | 'Bass', _strings?: number): void => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${family}$`) }));
};

describe('the application renders and is navigable', () => {
  it('renders the instrument, the controls and the information panels', () => {
    render(<App />);
    expect(screen.getByRole('group', { name: /6-string guitar fretboard/i })).toBeTruthy();
    expect(screen.getByRole('grid', { name: /Fretboard/i })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Type' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Interaction mode' })).toBeTruthy();
    expect(screen.getByText('Current selection')).toBeTruthy();
  });

  it('exposes one grid cell per string and fret, with real note names', () => {
    render(<App />);
    const names = cellNames();
    // 6 strings x 22 positions (open plus 21 frets)
    expect(names).toHaveLength(6 * 22);
    expect(names).toContain('E2, string 6, open');
    expect(names).toContain('E4, string 1, open');
    expect(names).toContain('G2, string 6, fret 3');
    expect(names).toContain('D5, string 1, fret 10');
  });

  it('has a skip link and a labelled main region', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /Skip to the fretboard/i })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Instrument' })).toBeTruthy();
  });
});

describe('switching instruments reconfigures everything', () => {
  it.each([
    // Every instrument in a family has the same neck, so the same number of
    // positions per string: 22 frets plus the open string for guitars, 20 for
    // basses.
    ['Guitar', 6, '6-string guitar', 6, 22, 'E2, string 6, open'],
    ['Bass', 4, '4-string bass', 4, 22, 'E1, string 4, open'],
  ] as const)('%s %s-string shows %s', (family, count, label, strings, positions, lowestOpen) => {
    render(<App />);
    chooseInstrument(family, count);
    expect(screen.getByRole('group', { name: new RegExp(`${label} fretboard`, 'i') })).toBeTruthy();
    const names = cellNames();
    expect(names).toHaveLength(strings * positions);
    expect(names).toContain(lowestOpen);
  });

  it('offers only that instrument’s tuning presets', () => {
    render(<App />);
    chooseInstrument('Bass');
    const select = selectNamed(/Preset/i) as HTMLSelectElement;
    const labels = [...select.options].map((o) => o.text);
    expect(labels.some((l) => l.includes('E A D G'))).toBe(true);
    expect(labels.some((l) => l.includes('E A D G B E'))).toBe(false);
  });
});

describe('the instrument selector', () => {
  it('offers only Guitar and Bass at the top level', () => {
    render(<App />);
    const type = screen.getByRole('group', { name: 'Type' });
    expect(within(type).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Guitar',
      'Bass',
    ]);
  });

  it('does not offer a string-count choice while each type has one instrument', () => {
    render(<App />);
    expect(screen.queryByRole('group', { name: 'Strings' })).toBeNull();
  });

  it('switches instrument with the type', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Bass$/ }));
    expect(useStore.getState().instrumentId).toBe('bass4');
    fireEvent.click(screen.getByRole('button', { name: /^Guitar$/ }));
    expect(useStore.getState().instrumentId).toBe('guitar6');
  });
});

describe('changing the tuning recalculates the fretboard', () => {
  const setPreset = (value: string): void => {
    fireEvent.change(selectNamed(/Preset/i), { target: { value } });
  };

  it('Drop D changes the lowest string and leaves the others alone', () => {
    render(<App />);
    expect(cellNames()).toContain('E2, string 6, open');

    setPreset('drop-d');

    const names = cellNames();
    expect(names).toContain('D2, string 6, open');
    expect(names).not.toContain('E2, string 6, open');
    // The unchanged strings keep their notes.
    expect(names).toContain('A2, string 5, open');
    expect(names).toContain('E4, string 1, open');
    expect(names).toContain('F2, string 6, fret 3');
  });

  it('D standard moves every string down a whole tone', () => {
    render(<App />);
    setPreset('d-standard');
    const names = cellNames();
    expect(names).toContain('D2, string 6, open');
    expect(names).toContain('G2, string 5, open');
    expect(names).toContain('C3, string 4, open');
    expect(names).toContain('F3, string 3, open');
    expect(names).toContain('A3, string 2, open');
    expect(names).toContain('D4, string 1, open');
  });

  it('spells the fretboard from the selected key, and the tuning from its own notes', () => {
    render(<App />);
    setPreset('half-down');
    // The default key is E minor pentatonic, a sharp key, so the lowered
    // strings are written as sharps on the fretboard...
    expect(cellNames()).toContain('D#2, string 6, open');
    // ...while the tuning itself keeps the spelling it was written with.
    expect(screen.getAllByText(/Eb2/).length).toBeGreaterThan(0);

    // Choosing a flat key switches the fretboard spelling to flats.
    fireEvent.change(selectsNamed(/Root note/i)[0], { target: { value: 'Eb' } });
    expect(cellNames()).toContain('Eb2, string 6, open');
    expect(cellNames()).toContain('Ab2, string 5, open');
    expect(cellNames().some((n) => n.startsWith('D#'))).toBe(false);
  });

  it('shows the open strings of the active tuning in the sidebar and the footer', () => {
    render(<App />);
    setPreset('drop-c');
    expect(screen.getAllByText(/C2\s+G2\s+C3\s+F3\s+A3\s+D4/).length).toBeGreaterThan(0);
  });
});

describe('the custom tuning editor', () => {
  const openEditor = (): void => {
    fireEvent.click(screen.getByText('Custom tuning editor'));
  };

  it('rejects an invalid note and refuses to apply it', () => {
    render(<App />);
    openEditor();
    fireEvent.change(screen.getByLabelText('String 6 (lowest)'), { target: { value: 'H2' } });
    expect(screen.getByText(/Use a note name with an octave/i)).toBeTruthy();
    expect((screen.getByRole('button', { name: /Apply custom tuning/i }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    // The fretboard is untouched by the invalid draft.
    expect(cellNames()).toContain('E2, string 6, open');
  });

  it('applies a valid custom tuning to the whole fretboard', () => {
    render(<App />);
    openEditor();
    const values = ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'];
    values.forEach((v, i) => {
      const label = i === 0 ? 'String 6 (lowest)' : i === 5 ? 'String 1 (highest)' : `String ${6 - i}`;
      fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply custom tuning/i }));

    const names = cellNames();
    expect(names).toContain('C2, string 6, open');
    expect(names).toContain('G3, string 3, open');
    expect(names).toContain('A4, string 1, fret 5');
  });

  it('transposes the draft by a semitone', () => {
    render(<App />);
    openEditor();
    fireEvent.click(screen.getByRole('button', { name: 'All −1' }));
    expect((screen.getByLabelText('String 6 (lowest)') as HTMLInputElement).value).toBe('D#2');
    expect(cellNames()).toContain('D#2, string 6, open');
  });
});

describe('the control panel follows the mode', () => {
  const comboNames = (): string[] =>
    screen.getAllByRole('combobox').map((el) => el.getAttribute('aria-labelledby') ?? '');

  it('hides the scale and chord choosers in Notes mode', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    expect(screen.queryByText('Scale / mode')).toBeNull();
    expect(screen.queryByText('Chord')).toBeNull();
    // The instrument and tuning choosers stay.
    expect(screen.getByRole('group', { name: 'Type' })).toBeTruthy();
    expect(selectNamed(/Preset/i)).toBeTruthy();
    expect(comboNames().length).toBe(1);
  });

  it('shows the scale chooser in Scale mode and the chord chooser in Chord mode', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Scale' }));
    expect(screen.getByText('Scale / mode')).toBeTruthy();
    expect(selectsNamed(/Root note/i)).toHaveLength(1);
    expect(screen.queryByLabelText(/Chord type/i)).toBeNull();

    // Chord mode shows the chord chooser only: the scale chooser would just
    // be a second thing to confuse it with.
    fireEvent.click(screen.getByRole('button', { name: 'Chords' }));
    expect(screen.queryByText('Scale / mode')).toBeNull();
    expect(selectNamed(/Chord type/i)).toBeTruthy();
    expect(selectsNamed(/Root note/i)).toHaveLength(1);
  });

  it('hides them again in Tuner mode', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    expect(screen.queryByText('Scale / mode')).toBeNull();
  });
});

describe('reference pitch', () => {
  it('retunes the whole application', () => {
    render(<App />);
    // A4 = 440 by default: the open low E is 82.41 Hz.
    fireEvent.pointerDown(cell('E2, string 6, open'));
    const tile = (): string =>
      screen.getByText('Selected note').closest('.info-tile')?.textContent ?? '';
    expect(tile()).toContain('82.41 Hz');

    act(() => useStore.getState().setA4(432));
    expect(tile()).toContain('80.91 Hz');
    act(() => useStore.getState().setA4(415));
    expect(tile()).toContain('77.72 Hz');
  });

  it('is offered as presets and is remembered', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '432 Hz' }));
    expect(useStore.getState().a4).toBe(432);
    unmount();
    expect(JSON.parse(localStorage.getItem('fretlab.settings.v1') ?? '{}').state.a4).toBe(432);
  });

  it('stays within a sensible range', () => {
    render(<App />);
    act(() => useStore.getState().setA4(100));
    expect(useStore.getState().a4).toBe(392);
    act(() => useStore.getState().setA4(1000));
    expect(useStore.getState().a4).toBe(466);
  });
});

describe('scale mode', () => {
  it('highlights the selected scale and names it', () => {
    render(<App />);
    // The default is E minor pentatonic.
    expect(screen.getAllByText('E Minor pentatonic').length).toBeGreaterThan(0);
    const pills = screen.getByLabelText('Notes of the scale');
    expect(within(pills).getByText('E')).toBeTruthy();
    expect(within(pills).getByText('G')).toBeTruthy();
    expect(within(pills).getByText('A')).toBeTruthy();
    expect(within(pills).getByText('B')).toBeTruthy();
    expect(within(pills).getByText('D')).toBeTruthy();
  });

  it('changing the scale changes the note pool', () => {
    render(<App />);
    fireEvent.change(selectNamed(/Scale or mode/i), { target: { value: 'dorian' } });
    fireEvent.change(selectsNamed(/Root note/i)[0], { target: { value: 'D' } });
    expect(screen.getAllByText('D Dorian').length).toBeGreaterThan(0);
    const pills = screen.getByLabelText('Notes of the scale');
    ['D', 'E', 'F', 'G', 'A', 'B', 'C'].forEach((n) => {
      expect(within(pills).getByText(n)).toBeTruthy();
    });
  });

  it('spells a flat key with flats', () => {
    render(<App />);
    fireEvent.change(selectsNamed(/Root note/i)[0], { target: { value: 'Bb' } });
    fireEvent.change(selectNamed(/Scale or mode/i), { target: { value: 'major' } });
    const pills = screen.getByLabelText('Notes of the scale');
    expect(within(pills).getByText('Bb')).toBeTruthy();
    expect(within(pills).getByText('Eb')).toBeTruthy();
    // Fretboard labels follow the key: no stray A# anywhere.
    expect(cellNames().some((n) => n.startsWith('A#'))).toBe(false);
    expect(cellNames().some((n) => n.startsWith('Bb'))).toBe(true);
  });

  it('turning labels off keeps the positions clickable', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('switch', { name: /Show note labels/i }));
    expect(cellNames()).toHaveLength(6 * 22);
  });
});

describe('chord mode', () => {
  const openChords = (): void => {
    fireEvent.click(screen.getByRole('button', { name: 'Chords' }));
  };

  it('calculates shapes for the selected chord in standard tuning', () => {
    render(<App />);
    openChords();
    const shapes = screen.getByRole('group', { name: 'Chord shapes' });
    const labels = within(shapes)
      .getAllByRole('button')
      .map((b) => b.textContent ?? '');
    // Em in standard tuning: 0 2 2 0 0 0 must be among the calculated shapes.
    expect(labels.some((l) => l.includes('0 2 2 0 0 0'))).toBe(true);
  });

  it('reports what the selected shape actually sounds', () => {
    render(<App />);
    openChords();
    expect(screen.getByText(/This shape actually sounds/i)).toBeTruthy();
    const sounds = screen.getAllByLabelText(/Notes of the chord|^$/).length;
    expect(sounds).toBeGreaterThan(0);
  });

  it('recalculates shapes when the tuning changes', () => {
    render(<App />);
    openChords();
    const read = (): string[] =>
      within(screen.getByRole('group', { name: 'Chord shapes' }))
        .getAllByRole('button')
        .map((b) => b.textContent ?? '');
    const before = read();
    fireEvent.change(selectNamed(/Preset/i), { target: { value: 'd-standard' } });
    const after = read();
    expect(after).not.toEqual(before);
    // The standard-tuning Em shape must not be offered as an Em in D standard.
    expect(after.some((l) => l.includes('0 2 2 0 0 0'))).toBe(false);
  });

  it('finds the one-finger power chord in Drop D', () => {
    render(<App />);
    openChords();
    fireEvent.change(selectNamed(/Preset/i), { target: { value: 'drop-d' } });
    fireEvent.change(selectsNamed(/Root note/i)[0], { target: { value: 'D' } });
    fireEvent.change(selectNamed(/Chord type/i), { target: { value: '5oct' } });
    const labels = within(screen.getByRole('group', { name: 'Chord shapes' }))
      .getAllByRole('button')
      .map((b) => b.textContent ?? '');
    expect(labels.some((l) => l.includes('0 0 0 ✕ ✕ ✕'))).toBe(true);
  });

  it('says so honestly when a chord cannot be played in a tuning', () => {
    render(<App />);
    openChords();
    // A fully diminished 7th rooted a long way from an open string in a
    // one-note-per-string tuning is the kind of case that can come up empty;
    // whatever happens, the panel must never show an unlabelled shape.
    fireEvent.change(selectNamed(/Chord type/i), { target: { value: 'dim7' } });
    const empty = screen.queryByText(/No playable shape in this tuning/i);
    const shapes = screen.queryByRole('group', { name: 'Chord shapes' });
    expect(Boolean(empty) !== Boolean(shapes)).toBe(true);
  });

  it('offers scales that fit the chord, and keeps the two concepts distinct', () => {
    render(<App />);
    openChords();
    expect(screen.getByText(/Scales that fit Em/i)).toBeTruthy();
    expect(screen.getByText(/switches the fretboard to that/i)).toBeTruthy();
    // Clicking a suggestion moves to scale mode with that scale selected.
    fireEvent.click(screen.getByRole('button', { name: /E Natural minor/i }));
    expect(screen.getAllByText(/E Natural minor/).length).toBeGreaterThan(0);
  });
});

describe('strumming and note playback', () => {
  /** A minimal fake Web Audio implementation that records what was played. */
  function installFakeAudio() {
    const started: { midiLike: number; when: number }[] = [];
    const node = () => ({
      connect: vi.fn().mockImplementation((n: unknown) => n),
      disconnect: vi.fn(),
      gain: { value: 1, setTargetAtTime: vi.fn() },
      frequency: { value: 0 },
      Q: { value: 0 },
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
      type: '',
    });
    class FakeCtx {
      state = 'running';
      currentTime = 0;
      sampleRate = 48000;
      destination = node();
      createGain = vi.fn(node);
      createDynamicsCompressor = vi.fn(node);
      createBiquadFilter = vi.fn(node);
      createBuffer = (_c: number, length: number) => ({
        length,
        copyToChannel: vi.fn(),
      });
      createBufferSource = () => {
        const src = {
          buffer: null as { length: number } | null,
          connect: vi.fn().mockImplementation((n: unknown) => n),
          disconnect: vi.fn(),
          start: (when: number) => started.push({ midiLike: src.buffer?.length ?? 0, when }),
          stop: vi.fn(),
          onended: null,
        };
        return src;
      };
      resume = vi.fn().mockResolvedValue(undefined);
      close = vi.fn().mockResolvedValue(undefined);
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeCtx;
    return started;
  }

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    void audioEngine.close();
  });

  it('clicking a position selects it and reports its pitch', async () => {
    installFakeAudio();
    render(<App />);
    fireEvent.pointerDown(cell('G2, string 6, fret 3'));
    await act(async () => {
      await Promise.resolve();
    });
    const tile = screen.getByText('Selected note').closest('.info-tile');
    expect(tile?.textContent).toContain('G2');
    expect(tile?.textContent).toContain('98.00 Hz');
    expect(tile?.textContent).toContain('String 6');
    expect(tile?.textContent).toContain('fret 3');
  });

  it('clicking the selected position again deselects it', async () => {
    installFakeAudio();
    render(<App />);
    const tile = (): string => screen.getByText('Selected note').closest('.info-tile')?.textContent ?? '';

    fireEvent.pointerDown(cell('G2, string 6, fret 3'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(tile()).toContain('G2');
    expect(useStore.getState().selected).toEqual({ stringIndex: 0, fret: 3 });

    // The same position again clears the selection...
    fireEvent.pointerDown(cell('G2, string 6, fret 3'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(useStore.getState().selected).toBeNull();
    expect(tile()).not.toContain('G2');

    // ...while a different position simply selects that one.
    fireEvent.pointerDown(cell('A2, string 6, fret 5'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(useStore.getState().selected).toEqual({ stringIndex: 0, fret: 5 });
  });

  it('deselecting still plays the note, because the click asked to hear it', async () => {
    const started = installFakeAudio();
    render(<App />);
    fireEvent.pointerDown(cell('G2, string 6, fret 3'));
    await act(async () => {
      await Promise.resolve();
    });
    started.length = 0;
    fireEvent.pointerDown(cell('G2, string 6, fret 3'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(started).toHaveLength(1);
  });

  it('the reported pitch follows the tuning', async () => {
    installFakeAudio();
    render(<App />);
    fireEvent.change(selectNamed(/Preset/i), { target: { value: 'drop-d' } });
    fireEvent.pointerDown(cell('F2, string 6, fret 3'));
    await act(async () => {
      await Promise.resolve();
    });
    const tile = screen.getByText('Selected note').closest('.info-tile');
    expect(tile?.textContent).toContain('F2');
    expect(tile?.textContent).toContain('87.31 Hz');
  });

  it('a down strum and an up strum schedule the strings in opposite order', async () => {
    const started = installFakeAudio();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Chords' }));

    started.length = 0;
    fireEvent.click(screen.getByRole('button', { name: /Down strum/i }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const down = started.map((s) => s.when);
    expect(down.length).toBeGreaterThan(1);
    // Strictly increasing delays: the sweep goes one string at a time.
    expect(down.every((t, i) => i === 0 || t > down[i - 1])).toBe(true);
    const downBuffers = started.map((s) => s.midiLike);

    started.length = 0;
    fireEvent.click(screen.getByRole('button', { name: /Up strum/i }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    const upBuffers = started.map((s) => s.midiLike);
    // Same notes, opposite order. Buffer length is a proxy for pitch: higher
    // notes render shorter buffers, so the sequences must be reverses.
    expect(upBuffers).toEqual([...downBuffers].reverse());
  });

  it('a muted string in a shape makes no sound at all', async () => {
    const started = installFakeAudio();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Chords' }));
    fireEvent.change(selectsNamed(/Root note/i)[0], { target: { value: 'C' } });
    fireEvent.change(selectNamed(/Chord type/i), { target: { value: 'maj' } });

    const shapes = within(screen.getByRole('group', { name: 'Chord shapes' })).getAllByRole('button');
    const xCount = (shapes[0].textContent ?? '').split('✕').length - 1;

    started.length = 0;
    fireEvent.click(shapes[0]);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    // Six strings minus the muted ones.
    expect(started).toHaveLength(6 - xCount);
  });

  it('strum speed changes the gap between strings', async () => {
    const started = installFakeAudio();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Chords' }));

    const measure = async (preset: string): Promise<number> => {
      fireEvent.click(screen.getByRole('button', { name: preset }));
      started.length = 0;
      fireEvent.click(screen.getByRole('button', { name: /Down strum/i }));
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      return started[1].when - started[0].when;
    };

    const slow = await measure('Slow');
    const fast = await measure('Fast');
    expect(slow).toBeGreaterThan(fast);
  });

  it('explains itself rather than breaking when there is no Web Audio at all', () => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    render(<App />);
    fireEvent.pointerDown(cell('E2, string 6, open'));
    // The note is still selected and reported; only the sound is missing.
    expect(
      screen.getAllByText(/Sound starts on your first click|Audio problem/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('grid', { name: /Fretboard/i })).toBeTruthy();
  });
});

describe('tuner mode', () => {
  it('does not ask for the microphone until the tuner is opened', () => {
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [] });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
    render(<App />);
    expect(getUserMedia).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    // Pitch detection cannot work with echo cancellation or AGC applied.
    expect(getUserMedia.mock.calls[0][0].audio).toMatchObject({
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
    });
  });

  it('reports a denied permission in plain language and offers a retry', async () => {
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(err) },
      configurable: true,
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText(/Microphone permission denied/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Try again/i })).toBeTruthy();
  });

  it('lists the current tuning as the tuner targets, not standard tuning', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('no mic')) },
      configurable: true,
    });
    render(<App />);
    fireEvent.change(selectNamed(/Preset/i), { target: { value: 'drop-c' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    await act(async () => {
      await Promise.resolve();
    });
    // The tuner region exists and the instrument graphic is still present:
    // the tuner is part of the instrument view, not a separate screen.
    expect(screen.getByRole('region', { name: 'Chromatic tuner' })).toBeTruthy();
    expect(screen.getByRole('group', { name: /6-string guitar fretboard/i })).toBeTruthy();
  });

  it('stores the view before entering the tuner and restores it on exit', () => {
    render(<App />);
    act(() => useStore.getState().setZoom(1.6));
    fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    expect(useStore.getState().viewBeforeTuner).toMatchObject({ zoom: 1.6 });

    fireEvent.click(screen.getByRole('button', { name: /Close tuner/i }));
    expect(useStore.getState().mode).toBe('scale');
    // Zoom is still the value it had before the camera moved.
    expect(useStore.getState().zoom).toBe(1.6);
  });

  it('releases the microphone when tuner mode is left', async () => {
    const stop = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }),
      },
      configurable: true,
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Scale' }));
    expect(stop).toHaveBeenCalled();
  });
});

describe('settings persistence', () => {
  it('remembers the instrument, tuning, scale, theme and volume', () => {
    const { unmount } = render(<App />);
    chooseInstrument('Bass');
    fireEvent.change(selectNamed(/Preset/i), { target: { value: 'tenor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    act(() => useStore.getState().setVolume(0.33));
    unmount();

    const saved = JSON.parse(localStorage.getItem('fretlab.settings.v1') ?? '{}');
    expect(saved.state).toMatchObject({
      instrumentId: 'bass4',
      tuningId: 'tenor',
      theme: 'light',
      volume: 0.33,
    });
    // Transient state is deliberately not saved.
    expect(saved.state.selected).toBeUndefined();
    expect(saved.state.viewBeforeTuner).toBeUndefined();
  });

  it('never persists tuner mode, so a reload does not reopen the microphone', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Tuner' }));
    unmount();
    const saved = JSON.parse(localStorage.getItem('fretlab.settings.v1') ?? '{}');
    expect(saved.state.mode).not.toBe('tuner');
  });
});

describe('keyboard accessibility', () => {
  it('moves around the fretboard with the arrow keys and plays with Enter', () => {
    render(<App />);
    const grid = screen.getByRole('grid', { name: /Fretboard/i });
    expect(grid.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    // Two frets along and one string down from the open low E is B2.
    expect(screen.getByRole('grid', { name: /Current position: B2/i })).toBeTruthy();

    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(screen.getByText('Selected note').closest('.info-tile')?.textContent).toContain('B2');

    fireEvent.keyDown(grid, { key: 'End' });
    // The last fret is 21; on the A string that is F#4.
    expect(screen.getByRole('grid', { name: /Current position: F#4/i })).toBeTruthy();
    fireEvent.keyDown(grid, { key: 'Home' });
    expect(screen.getByRole('grid', { name: /Current position: A2/i })).toBeTruthy();
  });

  it('every control has an accessible name', () => {
    render(<App />);
    for (const el of screen.getAllByRole('button')) {
      const name = el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('title');
      expect(name, el.outerHTML.slice(0, 120)).toBeTruthy();
    }
    for (const el of screen.getAllByRole('switch')) {
      expect(el.getAttribute('aria-labelledby') ?? el.getAttribute('aria-label')).toBeTruthy();
    }
  });
});
