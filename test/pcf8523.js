import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { BASE_CENTURY_Y2K, OFFSET_MODE, PCF8523, REGISTER, TIMER_A_CONTROL, TIMER_AB_SOURCE_CLOCK, TIMER_B_PULSE_WIDTH  } from '@johntalton/pcf8523'

/** @import { I2CAddressedBus } from '@johntalton/and-other-delights' */

/**
 * @template T
 * @param {ArrayBufferLike|ArrayBufferView} [readBuffer]
 * @returns {T extends I2CAddressedBus ? any : any}
 * */
function mockABus(readBuffer) {
  // @ts-ignore
  return {
    readList: [],
    writeList: [],

    /**
     * @param {any} command
     * @param {number} length
     */
    async readI2cBlock(command, length) {
      this.readList.push({ command, length })

      return readBuffer ?? new ArrayBuffer(length)
    },

    /**
     * @param {any} command
     * @param {{ byteLength: any; }} buffer
     */
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
      hour24: 0,
      pm: undefined,
      day: 0,
      weekdayValue: 0,
      weekday: 'Sunday',
      monthsValue: 0,
      month: undefined,
      year4digit: 2000
    })
  })

  it('should get alarm', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    const alarm = await device.getAlarm()

    assert.deepEqual(alarm, {
      minute: 0, minuteEnabled: true,
      hour: 0, pm: undefined, hourEnabled: true,
      hour24: 0,
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


  //
  //
  //

  it('should set Control1', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setControl1({
      capacitorSelection: '7pF',
			stop: false,
			ampm: false,
			secondInterruptEnabled: false,
			alarmInterruptEnabled:  false,
			correctionInterruptEnabled: false
    })

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 1)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b0000_0000)
  })

	it('should set Control1 to unique value', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setControl1({
      capacitorSelection: '12.5pF',
			stop: false,
			ampm: true,
			secondInterruptEnabled: false,
			alarmInterruptEnabled:  true,
			correctionInterruptEnabled: false
    })

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 1)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b1000_1010)
  })

	it('should set Control2', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setControl2({
			clearCountdownAFlag: false,
			clearCountdownBFlag: false,
			clearAlarmFlag: false,
			clearSecondFlag: false,

			watchdogAInterruptEnabled: false,
			countdownAInterruptEnabled: false,
			countdownBInterruptEnabled: false
    })

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 1)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b0111_1000)
  })

	it('should set Control2 to unique value', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setControl2({
			clearCountdownAFlag: true,
			clearCountdownBFlag: false,
			clearAlarmFlag: false,
			clearSecondFlag: false,

			watchdogAInterruptEnabled: true,
			countdownAInterruptEnabled: true,
			countdownBInterruptEnabled: false
    })

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 1)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b0011_1110)
  })

	it('should set Control3', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setControl3({
			pmSwitchoverEnabled: false,
			pmDirectSwitchingEnabled: true,
			pmBatteryLowDetectionEnabled: false,

			clearBatterySwitchoverFlag: false,

			batterySwitchoverInterruptEnabled: false,
    	batteryLowInterruptEnabled: false
    })

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 1)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b1110_1100)
  })

	it('should set Control3 to unique value', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setControl3({
			pmSwitchoverEnabled: true,
			pmDirectSwitchingEnabled: false,
			pmBatteryLowDetectionEnabled: false,

			clearBatterySwitchoverFlag: true,

			batterySwitchoverInterruptEnabled: false,
			batteryLowInterruptEnabled: true
    })

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 1)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b1000_0101)
  })

	it('should set Time', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setTime({
			second: 0,
			minute: 0,
			hour: 0,
			day: 0,
      weekdayValue: 0,
			monthsValue: 0,
			year4digit: 2000
		}, false, BASE_CENTURY_Y2K)

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 7)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b0000_0000)
		assert.equal(u8[1], 0b0000_0000)
		assert.equal(u8[2], 0b0000_0000)
		assert.equal(u8[3], 0b0000_0000)
		assert.equal(u8[4], 0b0000_0000)
		assert.equal(u8[5], 0b0000_0000)
		assert.equal(u8[6], 0b0000_0000)
	})

	it('should reject if Time century negative', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await assert.rejects(() => device.setTime({
			second: 0,
			minute: 0,
			hour: 0,
			day: 0,
      weekdayValue: 0,
			monthsValue: 0,
			year4digit: 2000
		}, false, 1900))
	})

	it('should reject if Time century positive', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await assert.rejects(() => device.setTime({
			second: 0,
			minute: 0,
			hour: 0,
			day: 0,
      weekdayValue: 0,
			monthsValue: 0,
			year4digit: 2000
		}, false, 2100))
	})


	it('should set Time to unique value', async () => {
    const bus = mockABus()
    const device = new PCF8523(bus)

    await device.setTime({
			second: 42,
			minute: 1,
			hour: 13,
			day: 30,
      weekdayValue: 0,
			monthsValue: 0,
			year4digit: 2099
		}, false, BASE_CENTURY_Y2K)

		assert.equal(bus.writeList.length, 1)
		assert.equal(bus.writeList[0].length, 7)
		const u8 = ArrayBuffer.isView(bus.writeList[0].buffer) ?
			new Uint8Array(bus.writeList[0].buffer.buffer) :
			new Uint8Array(bus.writeList[0].buffer)

		assert.equal(u8[0], 0b0100_0010)
		assert.equal(u8[1], 0b0000_0001)
		assert.equal(u8[2], 0b0001_0011)
		assert.equal(u8[3], 0b0011_0000)
		assert.equal(u8[4], 0b0000_0000)
		assert.equal(u8[5], 0b0000_0000)
		assert.equal(u8[6], 0b1001_1001)
	})


  it('should set AlarmMinute', () => {
    const aBus = mockABus()
    const device = new PCF8523(aBus)
    device.setAlarmMinute({
      minuteEnabled: true,
      minute: 42
    })

    assert.equal(aBus.writeList.length, 1)
    assert.equal(aBus.writeList[0].length, 1)

    const u8 = ArrayBuffer.isView(aBus.writeList[0].buffer) ?
      new Uint8Array(aBus.writeList[0].buffer.buffer, aBus.writeList[0].buffer.byteOffset, 1) :
      new Uint8Array(aBus.writeList[0].buffer, 0, 1)

    assert.equal(u8[0], 0b0100_0010)
  })

  it('should set AlarmHour', () => {
    const aBus = mockABus()
    const device = new PCF8523(aBus)
    device.setAlarmHour({
      hourEnabled: true,
      hour: 20
    })

    assert.equal(aBus.writeList.length, 1)
    assert.equal(aBus.writeList[0].length, 1)

    const u8 = ArrayBuffer.isView(aBus.writeList[0].buffer) ?
      new Uint8Array(aBus.writeList[0].buffer.buffer, aBus.writeList[0].buffer.byteOffset, 1) :
      new Uint8Array(aBus.writeList[0].buffer, 0, 1)

    assert.equal(u8[0], 0b0010_0000)
  })

  it('should set AlarmHour 12-hour mode', () => {
    const aBus = mockABus()
    const device = new PCF8523(aBus)
    device.setAlarmHour({
      hourEnabled: true,
      hour: 11,
      pm: true
    }, true)

    assert.equal(aBus.writeList.length, 1)
    assert.equal(aBus.writeList[0].length, 1)

    const u8 = ArrayBuffer.isView(aBus.writeList[0].buffer) ?
      new Uint8Array(aBus.writeList[0].buffer.buffer, aBus.writeList[0].buffer.byteOffset, 1) :
      new Uint8Array(aBus.writeList[0].buffer, 0, 1)

    assert.equal(u8[0], 0b0011_0001)
  })

  it('should set AlarmDay', () => {
    const aBus = mockABus()
    const device = new PCF8523(aBus)
    device.setAlarmDay({
      dayEnabled: true,
      day: 31
    })

    assert.equal(aBus.writeList.length, 1)
    assert.equal(aBus.writeList[0].length, 1)

    const u8 = ArrayBuffer.isView(aBus.writeList[0].buffer) ?
      new Uint8Array(aBus.writeList[0].buffer.buffer, aBus.writeList[0].buffer.byteOffset, 1) :
      new Uint8Array(aBus.writeList[0].buffer, 0, 1)

    assert.equal(u8[0], 0b0011_0001)
  })

  it('should set AlarmWeekday', () => {
    const aBus = mockABus()
    const device = new PCF8523(aBus)
    device.setAlarmWeekday({
      weekdayEnabled: true,
      weekdayValue: 2
    })

    assert.equal(aBus.writeList.length, 1)
    assert.equal(aBus.writeList[0].length, 1)

    const u8 = ArrayBuffer.isView(aBus.writeList[0].buffer) ?
      new Uint8Array(aBus.writeList[0].buffer.buffer, aBus.writeList[0].buffer.byteOffset, 1) :
      new Uint8Array(aBus.writeList[0].buffer, 0, 1)

    assert.equal(u8[0], 0b0000_0010)
  })

  it('should set Alarm', () => {
    const aBus = mockABus()
    const device = new PCF8523(aBus)
    device.setAlarm({
      minuteEnabled: true,
      hourEnabled: true,
      dayEnabled: true,
      weekdayEnabled: true,

      minute: 42,
      hour: 4,
      day: 1,
      weekdayValue: 1
    })

    assert.equal(aBus.writeList.length, 1)
    assert.equal(aBus.writeList[0].length, 4)

    const u8 = ArrayBuffer.isView(aBus.writeList[0].buffer) ?
      new Uint8Array(aBus.writeList[0].buffer.buffer, aBus.writeList[0].buffer.byteOffset, 4) :
      new Uint8Array(aBus.writeList[0].buffer, 0, 4)

    assert.equal(u8[0], 0b0100_0010)
    assert.equal(u8[1], 0b0000_0100)
    assert.equal(u8[2], 0b0000_0001)
    assert.equal(u8[3], 0b0000_0001)
  })
})