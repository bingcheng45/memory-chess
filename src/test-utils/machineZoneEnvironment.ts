import { TestEnvironment } from "jest-environment-jsdom";

// Jest hands each test file a copy of process.env, so a test that sets TZ never
// moves the clock. An environment runs outside that copy. This one gives the
// test file a setMachineTimeZone that sets TZ on the real process, and puts the
// machine's own zone back when the file is done.
export default class MachineZoneEnvironment extends TestEnvironment {
  private readonly machineZone = process.env.TZ;

  async setup(): Promise<void> {
    await super.setup();
    this.global.setMachineTimeZone = (zone: string) => {
      process.env.TZ = zone;
    };
  }

  async teardown(): Promise<void> {
    if (this.machineZone === undefined) delete process.env.TZ;
    else process.env.TZ = this.machineZone;
    await super.teardown();
  }
}
