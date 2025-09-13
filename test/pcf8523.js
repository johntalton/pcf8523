import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { OFFSET_MODE, PCF8523, REGISTER, TIMER_A_CONTROL, TIMER_AB_SOURCE_CLOCK, TIMER_B_PULSE_WIDTH  } from '@johntalton/pcf8523'

/** @import { I2CAddressedBus } from '@johntalton/and-other-delights' */

/** @returns {I2CAddressedBus} */
function mockABus(readBuffer) {
  return {
    readList: [],
    writeList: [],

    async readI2cBlock(command, length) {
      this.readList.push({ command, length })

      return readBuffer ?? new ArrayBuffer(length)
    },

    async writeI2cBlock(command, buffer) {
      this.writeList.push({ command, length: buffer.byteLength, buffer })

      return {
        bytesWritten: buffer.byteLength,
        buffer
      }
    }
  }
}

const DEFAULT_CONTROL_1 = {
  capacitorSelection: '7pF',
  ampm: false,
  stop: false,
  alarmInterruptEnabled: false,
  correctionInterruptEnabled: false,
  secondInterruptEnabled: false,
}

const DEFAULT_CONTROL_2 = {
  alarmFlag: false,
  countdownAFlag: false,
  countdownAInterruptEnabled: false,
  countdownBFlag: false,
  secondFlag: false,
  countdownBInterruptEnabled: false,
  watchdogAFlag: false,
  watchdogAInterruptEnabled: false
}

const DEFAULT_CONTROL_3 = {
  batteryLowFlag: false,
  batteryLowInterruptEnabled: false,
  batterySwitchoverFlag: false,
  batterySwitchoverInterruptEnabled: false,
  pmBatteryLowDetectionEnabled: true,
  pmDirectSwitchingEnabled: false,
  pmSwitchoverEnabled: true
}



describe('PCF8523', () => {

  it('should init', () => {
    const bus = mockABus()
    const device = new PCF8523(bus)
  })

  it('should send reset magic', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)
    await device.softReset()

    assert.equal(bus.writeList.length, 1)
    assert.equal(bus.writeList[0].command, REGISTER.CONTROL_1)
    assert.equal(bus.writeList[0].length, 1)
  })

  it('should get control 1', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const profile = await device.getControl1()
    assert.deepEqual(profile, DEFAULT_CONTROL_1)
  })

  it('should get control 2', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const profile = await device.getControl2()
    assert.deepEqual(profile, DEFAULT_CONTROL_2)
  })

  it('should get control 13', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const profile = await device.getControl3()
    assert.deepEqual(profile, DEFAULT_CONTROL_3)
  })

  it('should get profile', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const profile = await device.getProfile()
    assert.deepEqual(profile, {
      ...DEFAULT_CONTROL_1,
      ...DEFAULT_CONTROL_2,
      ...DEFAULT_CONTROL_3
    })
  })

  it('should get time', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const time = await device.getTime()

    assert.ok(time !== undefined)
    assert.equal(bus.readList.length, 1)
    assert.equal(bus.readList[0].command, REGISTER.SECONDS)
    assert.equal(bus.readList[0].length, 7)

    assert.deepEqual(time, {
      integrity: true,

      second: 0,
      minute: 0,
      hour: 0,
      pm: undefined,
      day: 0,
      weekdayValue: 0,
      weekday: 'Sunday',
      monthsValue: 0,
      month: undefined,
      year: 2000
    })
  })

  it('should get alarm', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const alarm = await device.getAlarm()

    assert.deepEqual(alarm, {
      minute: 0, minuteEnabled: true,
      hour: 0, pm: undefined, hourEnabled: true,
      day: 0, dayEnabled: true,
      weekdayValue: 0, weekday: 'Sunday', weekdayEnabled: true
    })
  })

  it('should get offset', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const offset = await device.getOffset()
    assert.deepEqual(offset, {
      mode: OFFSET_MODE.ONCE_EVERY_TWO_HOURS,
      offsetValue: 0,
      offsetPPM: 0
    })
  })

  it('should get timer', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const timer = await device.getTimer()

    assert.deepEqual(timer, {
      clockFrequencyValue: 0,
      countdownTimerBEnabled: false,
      interruptAPulsedMode: false,
      interruptBPulsedMode: false,
      pulseWidth: TIMER_B_PULSE_WIDTH.WIDTH_46_875_MS,
      sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ,
      timerAControl: TIMER_A_CONTROL.DISABLED,
      timerAValue: 0,
      timerBValue: 0
    })
  })

  it('should get timer control', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const result = await device.getTimerControl()
    assert.deepEqual(result, {
      interruptAPulsedMode: false,
			interruptBPulsedMode: false,
			clockFrequencyValue: 0,
			timerAControl: TIMER_A_CONTROL.DISABLED,
			countdownTimerBEnabled: false
    })
  })

  it('should get timer A control', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const result = await device.getTimerAControl()
    assert.deepEqual(result, {
      sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ
    })
  })

  it('should get timer B control', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const result = await device.getTimerBControl()
    assert.deepEqual(result, {
      pulseWidth: TIMER_B_PULSE_WIDTH.WIDTH_46_875_MS,
      sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ
    })
  })

  it('should get time A value', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const result = await device.getTimerAValue()
    assert.equal(result, 0)
  })

  it('should get timer B value', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const result = await device.getTimerBValue()
    assert.equal(result, 0)
  })
})