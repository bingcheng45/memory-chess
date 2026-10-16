class FakeAudio {
  static created: FakeAudio[] = [];
  volume = 1;
  paused = true;
  currentTime = 0;
  preload = "";
  error = null;
  loads = 0;
  plays = 0;
  constructor(readonly src: string) {
    FakeAudio.created.push(this);
  }
  play() {
    this.plays += 1;
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {
    this.loads += 1;
  }
  addEventListener() {}
  cloneNode() {
    return new FakeAudio(this.src);
  }
}

const loadModule = () => import("@/lib/utils/soundEffects");
const createdSrcs = () => FakeAudio.created.map((audio) => audio.src);

describe("sound effects", () => {
  let fetchSpy: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    FakeAudio.created = [];
    fetchSpy = jest.fn();
    Object.assign(globalThis, { Audio: FakeAudio, fetch: fetchSpy });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("downloads nothing on import, after the old preload delay, or on a click", async () => {
    await loadModule();
    jest.advanceTimersByTime(5000);
    window.dispatchEvent(new MouseEvent("click"));

    expect(FakeAudio.created.length).toBe(0);
    expect(fetchSpy.mock.calls.length).toBe(0);
  });

  it("creates one element for a sound on its first play and reuses it on the next", async () => {
    const { playSound } = await loadModule();

    playSound("click");
    expect(createdSrcs()).toEqual(["/sounds/click.mp3"]);
    expect(FakeAudio.created[0].volume).toBe(0.1);

    FakeAudio.created[0].paused = true;
    playSound("click");
    expect(createdSrcs()).toEqual(["/sounds/click.mp3"]);
    expect(FakeAudio.created[0].plays).toBe(2);
  });

  it("shares one element between names for the same file", async () => {
    const { playSound } = await loadModule();

    playSound("success");
    FakeAudio.created[0].paused = true;
    playSound("match");

    expect(createdSrcs()).toEqual(["/sounds/success.mp3"]);
  });

  it("overlaps a sound with its own play still in progress", async () => {
    const { playSound } = await loadModule();

    playSound("click");
    playSound("click");

    expect(createdSrcs()).toEqual(["/sounds/click.mp3", "/sounds/click.mp3"]);
    expect(FakeAudio.created.map((audio) => audio.plays)).toEqual([1, 1]);
  });

  it("warms exactly the round's sounds, once", async () => {
    const { warmRoundSounds, playSound } = await loadModule();

    warmRoundSounds();
    warmRoundSounds();

    expect(createdSrcs()).toEqual([
      "/sounds/success.mp3",
      "/sounds/timer.mp3",
      "/sounds/timer-end.mp3",
      "/sounds/failure.mp3",
    ]);
    expect(FakeAudio.created.map((audio) => [audio.preload, audio.loads])).toEqual([
      ["auto", 2],
      ["auto", 2],
      ["auto", 2],
      ["auto", 2],
    ]);

    playSound("timer");
    expect(FakeAudio.created.length).toBe(4);
    expect(FakeAudio.created[1].plays).toBe(1);
  });

  it("downloads nothing while sound is off", async () => {
    const { playSound, setSoundEnabled, warmRoundSounds } = await loadModule();

    setSoundEnabled(false);
    warmRoundSounds();
    playSound("click");
    expect(FakeAudio.created.length).toBe(0);

    setSoundEnabled(true);
    playSound("click");
    expect(createdSrcs()).toEqual(["/sounds/click.mp3"]);
  });

  it("stops and rewinds the timer, and restarts it from the start", async () => {
    const { playSound, stopTimerSound } = await loadModule();

    playSound("timer");
    const timer = FakeAudio.created[0];
    timer.currentTime = 3.5;
    stopTimerSound();
    expect([timer.paused, timer.currentTime]).toEqual([true, 0]);

    playSound("timer");
    timer.currentTime = 2;
    playSound("timer");
    expect([FakeAudio.created.length, timer.plays, timer.currentTime]).toEqual([1, 3, 0]);
  });

  it("applies volume changes to elements already created", async () => {
    const { playSound, setVolume, getVolume } = await loadModule();

    playSound("place");
    setVolume(0.6);

    expect([getVolume(), FakeAudio.created[0].volume]).toEqual([0.6, 0.6]);
  });

  it("starts at the quieter 10% default and keeps the full 0–100% range", async () => {
    const { getVolume, setVolume } = await loadModule();

    expect(getVolume()).toBe(0.1);
    setVolume(-1);
    expect(getVolume()).toBe(0);
    setVolume(2);
    expect(getVolume()).toBe(1);
  });
});
