export {};

class FakeSource {
  buffer: { url: string } | null = null;
  started = false;
  stopped = false;
  connect() {}
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
  }
}

class FakeAudioContext {
  static created: FakeAudioContext[] = [];
  readonly gain = { gain: { value: 1 }, connect() {} };
  readonly sources: FakeSource[] = [];
  resumes = 0;
  state = "suspended";
  constructor() {
    FakeAudioContext.created.push(this);
  }
  createGain() {
    return this.gain;
  }
  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
  decodeAudioData(data: { url: string }) {
    return Promise.resolve(data);
  }
  resume() {
    this.resumes += 1;
    this.state = "running";
    return Promise.resolve();
  }
  get destination() {
    return {};
  }
}

const loadModule = () => import("@/lib/utils/soundEffects");
const context = () => FakeAudioContext.created[0];
const played = () => context().sources.filter((source) => source.started).map((source) => source.buffer?.url);
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("sound effects", () => {
  let fetchSpy: jest.Mock;
  let release: (() => void) | null;

  beforeEach(() => {
    jest.resetModules();
    FakeAudioContext.created = [];
    release = null;
    fetchSpy = jest.fn((url: string) => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve({ url }) }));
    Object.assign(globalThis, { AudioContext: FakeAudioContext, fetch: fetchSpy });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "AudioContext");
  });

  const holdDownloads = () => {
    fetchSpy.mockImplementation(
      (url: string) =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, arrayBuffer: () => Promise.resolve({ url }) });
        }),
    );
  };

  it("downloads nothing and opens no audio on import or on a click", async () => {
    await loadModule();
    window.dispatchEvent(new MouseEvent("click"));

    expect([FakeAudioContext.created.length, fetchSpy.mock.calls.length]).toEqual([0, 0]);
  });

  it("plays through one gain node at the quiet 5% default", async () => {
    const { playSound } = await loadModule();

    playSound("click");
    await settle();

    expect(FakeAudioContext.created.length).toBe(1);
    expect(context().gain.gain.value).toBe(0.05);
    expect(played()).toEqual(["/sounds/click.mp3"]);
  });

  it("downloads a file once and reuses it, also across names for the same file", async () => {
    const { playSound } = await loadModule();

    playSound("success");
    await settle();
    playSound("match");
    playSound("success");
    await settle();

    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual(["/sounds/success.mp3"]);
    expect(played()).toEqual(["/sounds/success.mp3", "/sounds/success.mp3", "/sounds/success.mp3"]);
  });

  it("overlaps a sound with its own play still in progress", async () => {
    const { playSound } = await loadModule();

    playSound("click");
    playSound("click");
    await settle();

    expect(played()).toEqual(["/sounds/click.mp3", "/sounds/click.mp3"]);
  });

  it("warms exactly the round's sounds, once, without playing them", async () => {
    const { warmRoundSounds } = await loadModule();

    warmRoundSounds();
    warmRoundSounds();
    await settle();

    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([
      "/sounds/success.mp3",
      "/sounds/timer.mp3",
      "/sounds/timer-end.mp3",
      "/sounds/failure.mp3",
    ]);
    expect(played()).toEqual([]);
  });

  it("downloads nothing while sound is off", async () => {
    const { playSound, setSoundEnabled, warmRoundSounds } = await loadModule();

    setSoundEnabled(false);
    warmRoundSounds();
    playSound("click");
    await settle();
    expect(fetchSpy.mock.calls.length).toBe(0);

    setSoundEnabled(true);
    playSound("click");
    await settle();
    expect(played()).toEqual(["/sounds/click.mp3"]);
  });

  it("stops the timer, and a new timer replaces the one playing", async () => {
    const { playSound, stopTimerSound } = await loadModule();

    playSound("timer");
    await settle();
    const first = context().sources[0];
    playSound("timer");
    await settle();
    const second = context().sources[1];
    stopTimerSound();

    expect([first.stopped, second.started, second.stopped]).toEqual([true, true, true]);
  });

  it("never starts a timer that was stopped while it was still downloading", async () => {
    const { playSound, stopTimerSound } = await loadModule();
    holdDownloads();

    playSound("timer");
    stopTimerSound();
    release?.();
    await settle();

    expect(played()).toEqual([]);
  });

  it("applies a volume change to the gain already playing", async () => {
    const { playSound, setVolume, getVolume } = await loadModule();

    playSound("place");
    setVolume(0.6);

    expect([getVolume(), context().gain.gain.value]).toEqual([0.6, 0.6]);
  });

  it("keeps the full 0 to 100% range", async () => {
    const { getVolume, setVolume } = await loadModule();

    expect(getVolume()).toBe(0.05);
    setVolume(-1);
    expect(getVolume()).toBe(0);
    setVolume(2);
    expect(getVolume()).toBe(1);
  });

  it("stays silent, without errors, where the browser has no Web Audio", async () => {
    Reflect.deleteProperty(globalThis, "AudioContext");
    const { playSound, warmRoundSounds } = await loadModule();

    playSound("click");
    warmRoundSounds();
    await settle();

    expect(fetchSpy.mock.calls.length).toBe(0);
  });

  describe("preparing the audio output while the page is idle", () => {
    let idleJobs: Array<() => void>;

    beforeEach(() => {
      idleJobs = [];
      Object.assign(window, { requestIdleCallback: (job: () => void) => idleJobs.push(job) });
    });

    afterEach(() => {
      Reflect.deleteProperty(window, "requestIdleCallback");
    });

    const runIdle = () => idleJobs.splice(0).forEach((job) => job());

    it("creates the context only when the browser goes idle, suspended and at the default volume", async () => {
      const { prepareSound } = await loadModule();

      prepareSound();
      expect(FakeAudioContext.created.length).toBe(0);
      runIdle();

      expect([FakeAudioContext.created.length, context().state, context().gain.gain.value]).toEqual([1, "suspended", 0.05]);
      expect(fetchSpy.mock.calls.length).toBe(0);
    });

    it("schedules once however often it is called", async () => {
      const { prepareSound } = await loadModule();

      prepareSound();
      prepareSound();
      runIdle();
      prepareSound();

      expect([idleJobs.length, FakeAudioContext.created.length]).toEqual([0, 1]);
    });

    it("falls back to a timer where requestIdleCallback is missing", async () => {
      jest.useFakeTimers();
      Reflect.deleteProperty(window, "requestIdleCallback");
      const { prepareSound } = await loadModule();

      prepareSound();
      expect(FakeAudioContext.created.length).toBe(0);
      jest.runAllTimers();
      jest.useRealTimers();

      expect(FakeAudioContext.created.length).toBe(1);
    });

    it("creates nothing when sound is off, now or by the time the page is idle", async () => {
      const { prepareSound, setSoundEnabled } = await loadModule();

      setSoundEnabled(false);
      prepareSound();
      expect(idleJobs.length).toBe(0);

      setSoundEnabled(true);
      prepareSound();
      setSoundEnabled(false);
      runIdle();

      expect(FakeAudioContext.created.length).toBe(0);
    });

    it("plays on the tap with the prepared context, resuming it and creating no second one", async () => {
      const { prepareSound, playSound } = await loadModule();
      prepareSound();
      runIdle();

      playSound("click");
      await settle();

      expect([FakeAudioContext.created.length, context().resumes, played()]).toEqual([1, 1, ["/sounds/click.mp3"]]);
    });

    it("still plays through the lazy path when idle never ran", async () => {
      const { prepareSound, playSound } = await loadModule();
      prepareSound();

      playSound("click");
      await settle();
      runIdle();

      expect([FakeAudioContext.created.length, played()]).toEqual([1, ["/sounds/click.mp3"]]);
    });

    it("resumes the prepared context on the first tap, even before a sound plays", async () => {
      const { prepareSound } = await loadModule();
      prepareSound();
      runIdle();

      window.dispatchEvent(new MouseEvent("click"));
      window.dispatchEvent(new MouseEvent("click"));

      expect([context().resumes, context().state]).toEqual([1, "running"]);
    });

    it("warming the round resumes the prepared context", async () => {
      const { prepareSound, warmRoundSounds } = await loadModule();
      prepareSound();
      runIdle();

      warmRoundSounds();

      expect(context().resumes).toBe(1);
    });
  });
});
