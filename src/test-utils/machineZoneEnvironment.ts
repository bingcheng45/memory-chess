import { TestEnvironment } from "jest-environment-jsdom";

// Jest hands each test file a copy of process.env, so a test that sets TZ never
// moves the clock. An environment runs outside that copy.
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
