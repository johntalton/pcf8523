import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
	Converter,
	CAP_VALUES,
	decode7BitTwosComplement,
	OFFSET_MODE,
	TIMER_CLOCK_FREQUENCY,
	TIMER_A_CONTROL,
	TIMER_AB_SOURCE_CLOCK,
	TIMER_B_PULSE_WIDTH,
	encode7BitTwosComplement,
	decodeTimeToDate,
	BASE_CENTURY_Y2K,
	encodeTimeFromDate,
	encodeBCD
} from '@johntalton/pcf8523'

const encodeBCD_63_34 = value => encodeBCD(value, 6,3, 3,4)
const encodeBCD_41_34 = value => encodeBCD(value, 4,1, 3,4)
const encodeBCD_52_34 = value => encodeBCD(value, 5,2, 3,4)
const encodeBCD_74_34 = value => encodeBCD(value, 7,4, 3,4)

describe('decodeBCD', () => {
	it('should decode', () => {

	})
})

describe('encodeBCD', () => {
	// 6, 3, 3, 4  seconds / minutes
	describe('6,3, 3,4', () => {
		it('should encode 12 ', () => {
			const value = encodeBCD_63_34(12)
			assert.equal(value, 0b0001_0010)
		})
	})

	// 4, 1, 3, 4  hour
	describe('4,1, 3,4', () => {
		it('should encode 12 ', () => {
			const value = encodeBCD_41_34(12)
			assert.equal(value, 0b0001_0010)
		})
	})

	// 5, 2, 3, 4  hour / day
	describe('5,2, 3,4', () => {
		it('should encode 12 ', () => {
			const value = encodeBCD_52_34(12)
			assert.equal(value, 0b0001_0010)
		})
	})

	// 7, 4, 3, 4  year
	describe('7,4, 3,4', () => {
		it('should encode 12 ', () => {
			const value = encodeBCD_74_34(12)
			assert.equal(value, 0b0001_0010)
		})
	})
})

describe('decode7BitTwosComplement', () => {
	it('should decode 63', () => {
		const result = decode7BitTwosComplement(0b0011_1111)
		assert.equal(result, 63)
	})

	it('should decode 62', () => {
		const result = decode7BitTwosComplement(0b0011_1110)
		assert.equal(result, 62)
	})

	it('should decode 2', () => {
		const result = decode7BitTwosComplement(0b00000010)
		assert.equal(result, 2)
	})

	it('should decode 1', () => {
		const result = decode7BitTwosComplement(0b0000_0001)
		assert.equal(result, 1)
	})

	it('should decode 0', () => {
		const result = decode7BitTwosComplement(0b0000_0000)
		assert.equal(result, 0)
	})

	it('should decode -1', () => {
		const result = decode7BitTwosComplement(0b0111_1111)
		assert.equal(result, -1)
	})

		it('should decode -2', () => {
		const result = decode7BitTwosComplement(0b01111110)
		assert.equal(result, -2)
	})

	it('should decode -63', () => {
		const result = decode7BitTwosComplement(0b0100_0001)
		assert.equal(result, -63)
	})

	it('should decode -64', () => {
		const result = decode7BitTwosComplement(0b0100_0000)
		assert.equal(result, -64)
	})
})

describe('encode7BitTwosComplement', () => {
	it('should throw if value out of range (positive)', () => {
		assert.throws(() => encode7BitTwosComplement(64))
	})

	it('should throw if value out of range (negative)', () => {
		assert.throws(() => encode7BitTwosComplement(-65))
	})

	it('should encode 63', () => {
		const result = encode7BitTwosComplement(63)
		assert.equal(result, 0b0011_1111)
	})

	it('should encode 62', () => {
		const result = encode7BitTwosComplement(62)
		assert.equal(result, 0b0011_1110)
	})

	it('should encode 2', () => {
		const result = encode7BitTwosComplement(2)
		assert.equal(result, 0b00000010)
	})

	it('should encode 1', () => {
		const result = encode7BitTwosComplement(1)
		assert.equal(result, 0b0000_0001)
	})

	it('should encode 0', () => {
		const result = encode7BitTwosComplement(0)
		assert.equal(result, 0b0000_0000)
	})

	it('should encode -1', () => {
		const result = encode7BitTwosComplement(-1)
		assert.equal(result, 0b0111_1111)
	})

	it('should encode -2', () => {
		const result = encode7BitTwosComplement(-2)
		assert.equal(result, 0b01111110)
	})

	it('should encode -63', () => {
		const result = encode7BitTwosComplement(-63)
		assert.equal(result, 0b0100_0001)
	})

	it('should encode -64', () => {
		const result = encode7BitTwosComplement(-64)
		assert.equal(result, 0b0100_0000)
	})
})

describe('decodeTimeToDate', () => {
	it('should decoder', () => {
		const date = decodeTimeToDate({
			year4digit: 2030,
			monthsValue: 5,
			day: 5,
			hour: 2,
			minute: 30,
			second: 1
		})

		assert.deepEqual(date, new Date(Date.UTC(2030, 4, 5, 2, 30, 1)))
		assert.equal(date.getTime(), 1904178601000)
	})
})

describe('encodeTimeFromDate', () => {
	it('should encode', () => {
		const date = new Date(Date.UTC(2525, 9, 31, 0, 0, 42))
		const time = encodeTimeFromDate(date)

		assert.deepEqual(time, {
			second: 42,
			minute: 0,
			hour: 0,
			day: 31,
			weekdayValue: 3,
			monthsValue: 10,
			year4digit: 2525
		})
	})
})


describe('Converter', () => {
	describe('decodeControl1', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeControl1(buffer))
		})

		it('should decode', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeControl1(buffer)

			assert.deepEqual(result, {
				capacitorSelection: '7pF',
				stop: false,
				ampm: false,
				secondInterruptEnabled: false,
				alarmInterruptEnabled: false,
				correctionInterruptEnabled: false
			})
		})

		it('should decode from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeControl1(buffer.buffer)

			assert.deepEqual(result, {
				capacitorSelection: '7pF',
				stop: false,
				ampm: false,
				secondInterruptEnabled: false,
				alarmInterruptEnabled: false,
				correctionInterruptEnabled: false
			})
		})

		it('should decode unique value', () => {
			const buffer = Uint8Array.from([ 0b1000_1001 ])
			const result = Converter.decodeControl1(buffer.buffer)

			assert.deepEqual(result, {
				capacitorSelection: CAP_VALUES.TWELVE,
				stop: false,
				ampm: true,
				secondInterruptEnabled: false,
				alarmInterruptEnabled: false,
				correctionInterruptEnabled: true
			})
		})
	})

	describe('decodeControl2', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeControl2(buffer))
		})

		it('should decode', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeControl2(buffer)
			assert.deepEqual(result, {
				watchdogAFlag: false,
				countdownAFlag: false,
				countdownBFlag: false,
				secondFlag: false,
				alarmFlag: false,

				watchdogAInterruptEnabled: false,
				countdownAInterruptEnabled: false,
				countdownBInterruptEnabled: false
			})
		})

		it('should decode from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeControl2(buffer.buffer)
			assert.deepEqual(result, {
				watchdogAFlag: false,
				countdownAFlag: false,
				countdownBFlag: false,
				secondFlag: false,
				alarmFlag: false,

				watchdogAInterruptEnabled: false,
				countdownAInterruptEnabled: false,
				countdownBInterruptEnabled: false
			})
		})

		it('should decode unique value', () => {
			const buffer = Uint8Array.from([ 0b0100_0111 ])
			const result = Converter.decodeControl2(buffer)
			assert.deepEqual(result, {
				watchdogAFlag: false,
				countdownAFlag: true,
				countdownBFlag: false,
				secondFlag: false,
				alarmFlag: false,

				watchdogAInterruptEnabled: true,
				countdownAInterruptEnabled: true,
				countdownBInterruptEnabled: true
			})
		})
	})

	describe('decodeControl3', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeControl3(buffer))
		})

		it('should decode', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeControl3(buffer)
			assert.deepEqual(result, {
				pmBatteryLowDetectionEnabled: true,
				pmSwitchoverEnabled: true,
				pmDirectSwitchingEnabled: false,

				batterySwitchoverInterruptEnabled: false,
				batteryLowInterruptEnabled: false,

				batterySwitchoverFlag: false,
				batteryLowFlag: false
			})
		})

		it('should decode from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeControl3(buffer.buffer)
			assert.deepEqual(result, {
				pmBatteryLowDetectionEnabled: true,
				pmSwitchoverEnabled: true,
				pmDirectSwitchingEnabled: false,

				batterySwitchoverInterruptEnabled: false,
				batteryLowInterruptEnabled: false,

				batterySwitchoverFlag: false,
				batteryLowFlag: false
			})
		})

		it('should decode unique value', () => {
			const buffer = Uint8Array.from([ 0b0110_0101 ])
			const result = Converter.decodeControl3(buffer)
			assert.deepEqual(result, {
				pmBatteryLowDetectionEnabled: true,
				pmSwitchoverEnabled: false,
				pmDirectSwitchingEnabled: undefined,

				batterySwitchoverInterruptEnabled: false,
				batteryLowInterruptEnabled: true,

				batterySwitchoverFlag: false,
				batteryLowFlag: true
			})
		})

		it('should decode unique value alt', () => {
			const buffer = Uint8Array.from([ 0b0100_1100 ])
			const result = Converter.decodeControl3(buffer)
			assert.deepEqual(result, {
				pmBatteryLowDetectionEnabled: true,
				pmSwitchoverEnabled: false,
				pmDirectSwitchingEnabled: undefined,

				batterySwitchoverInterruptEnabled: false,
				batteryLowInterruptEnabled: false,

				batterySwitchoverFlag: true,
				batteryLowFlag: true
			})
		})
	})

	describe('decodeTime', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeTime(buffer, false, BASE_CENTURY_Y2K))
		})

		it('should throw on short length', () => {
			const buffer = Uint8Array.from([ 0, 0, 0  ])
			assert.throws(() => Converter.decodeTime(buffer, false, BASE_CENTURY_Y2K))
		})

		it('should decode from zeroed', () => {
			const buffer = Uint8Array.from([
				0, 0, 0, 0, 0, 0, 0
			])

			const result = Converter.decodeTime(buffer, false, BASE_CENTURY_Y2K)
			assert.deepEqual(result, {
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
				year4digit: 2000
			})
		})

		it('should decode from zeroed ArrayBuffer', () => {
			const buffer = Uint8Array.from([
				0, 0, 0, 0, 0, 0, 0
			])

			const result = Converter.decodeTime(buffer.buffer, false, 900)
			assert.deepEqual(result, {
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
				year4digit: 900
			})
		})

		it('should decode A New Hope', () => {
			const buffer = Uint8Array.from([
				0, 0, 0,
				0b0010_0101,
				0,
				0b0000_0101,
				0b0111_0111 // May 25, 1977
			])

			const result = Converter.decodeTime(buffer, false, 1900)
			assert.deepEqual(result, {
				integrity: true,
				second: 0,
				minute: 0,
				hour: 0,
				pm: undefined,
				day: 25,
				weekdayValue: 0,
				weekday: 'Sunday',
				monthsValue: 5,
				month: 'May',
				year4digit: 1977
			})
		})

		it('should decode The Empire Strikes Back', () => {
			const buffer = Uint8Array.from([
				0, 0, 0,
				0b0010_0001,
				0,
				0b0000_0101,
				0b1000_0000 // May 21, 1980
			])

			const result = Converter.decodeTime(buffer, false, 1900)
			assert.deepEqual(result, {
				integrity: true,
				second: 0,
				minute: 0,
				hour: 0,
				pm: undefined,
				day: 21,
				weekdayValue: 0,
				weekday: 'Sunday',
				monthsValue: 5,
				month: 'May',
				year4digit: 1980
			})
		})

		it('should decode The Phantom Menace', () => {
			const buffer = Uint8Array.from([
				0, 0, 0,
				0b0001_1001,
				0,
				0b0000_0101,
				0b1001_1001 // May 19, 1999
			])

			const result = Converter.decodeTime(buffer, false, 1900)
			assert.deepEqual(result, {
				integrity: true,
				second: 0,
				minute: 0,
				hour: 0,
				pm: undefined,
				day: 19,
				weekdayValue: 0,
				weekday: 'Sunday',
				monthsValue: 5,
				month: 'May',
				year4digit: 1999
			})
		})

		it('should decode Revenge of the Sith', () => {
			const buffer = Uint8Array.from([
				0, 0, 0,
				0b0001_1001,
				0,
				0b0000_0101,
				0b0000_0101 // May 19, 2005
			])

			const result = Converter.decodeTime(buffer, false, BASE_CENTURY_Y2K)
			assert.deepEqual(result, {
				integrity: true,
				second: 0,
				minute: 0,
				hour: 0,
				pm: undefined,
				day: 19,
				weekdayValue: 0,
				weekday: 'Sunday',
				monthsValue: 5,
				month: 'May',
				year4digit: 2005
			})
		})

		it('should decode Rogue One', () => {
			const buffer = Uint8Array.from([
				0, 0, 0,
				0b0001_0101,
				0,
				0b0001_0010,
				0b0001_0110 // December 15, 2016
			])

			const result = Converter.decodeTime(buffer, false, BASE_CENTURY_Y2K)
			assert.deepEqual(result, {
				integrity: true,
				second: 0,
				minute: 0,
				hour: 0,
				pm: undefined,
				day: 15,
				weekdayValue: 0,
				weekday: 'Sunday',
				monthsValue: 12,
				month: 'December',
				year4digit: 2016
			})
		})
	})

	// describe('decodeAlarm', () => {
	// 	it('should', () => {
	// 		const buffer = Uint8Array.from([ 0 ])
	// 		const result = Converter.decodeAlarm(buffer)

	// 		assert.equal(result, false)
	// 	})
	// })

	describe('decodeOffset', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeOffset(buffer))
		})

		it('should decode zeroed', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeOffset(buffer)

			assert.deepEqual(result, {
				mode: OFFSET_MODE.ONCE_EVERY_TWO_HOURS,
				offsetValue: 0,
				offsetPPM: 0
			})
		})

		it('should decode zeroed from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeOffset(buffer.buffer)

			assert.deepEqual(result, {
				mode: OFFSET_MODE.ONCE_EVERY_TWO_HOURS,
				offsetValue: 0,
				offsetPPM: 0
			})
		})

		it('should decode unique value mode 0', () => {
			const buffer = Uint8Array.from([ 0b0101_0110 ])
			const result = Converter.decodeOffset(buffer)

			assert.deepEqual(result, {
				mode: OFFSET_MODE.ONCE_EVERY_TWO_HOURS,
				offsetValue: -42,
				offsetPPM: -42 * 4.34
			})
		})

		it('should decode unique value mode 1', () => {
			const buffer = Uint8Array.from([ 0b1101_0110 ])
			const result = Converter.decodeOffset(buffer)

			assert.deepEqual(result, {
				mode: OFFSET_MODE.ONCE_EVERY_MINUTE,
				offsetValue: -42,
				offsetPPM: -42 * 4.069
			})
		})
	})

	describe('decodeTimerControl', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeTimerControl(buffer))
		})

		it('should decode zeroed', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerControl(buffer)

			assert.deepEqual(result, {
				interruptAPulsedMode: false,
				interruptBPulsedMode: false,
				clockFrequencyValue: TIMER_CLOCK_FREQUENCY.FREQUENCY_32768,
				timerAControl: TIMER_A_CONTROL.DISABLED,
				countdownTimerBEnabled: false
			})
		})

		it('should decode zeroed from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerControl(buffer.buffer)

			assert.deepEqual(result, {
				interruptAPulsedMode: false,
				interruptBPulsedMode: false,
				clockFrequencyValue: TIMER_CLOCK_FREQUENCY.FREQUENCY_32768,
				timerAControl: TIMER_A_CONTROL.DISABLED,
				countdownTimerBEnabled: false
			})
		})

		it('should decode unique value', () => {
			const buffer = Uint8Array.from([ 0b0110_0100 ])
			const result = Converter.decodeTimerControl(buffer.buffer)

			assert.deepEqual(result, {
				interruptAPulsedMode: false,
				interruptBPulsedMode: true,
				clockFrequencyValue: TIMER_CLOCK_FREQUENCY.FREQUENCY_1024,
				timerAControl: TIMER_A_CONTROL.WATCHDOG,
				countdownTimerBEnabled: false
			})
		})
	})

	describe('decodeTimerAControl', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeTimerAControl(buffer))
		})

		it('should decode zeroed', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerAControl(buffer)

			assert.deepEqual(result, {
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ
			})
		})

		it('should decode zeroed from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerAControl(buffer.buffer)

			assert.deepEqual(result, {
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ
			})
		})

		it('should decode unique value', () => {
			const buffer = Uint8Array.from([ 0b0000_0011 ])
			const result = Converter.decodeTimerAControl(buffer)

			assert.deepEqual(result, {
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_1_60_HZ
			})
		})
	})

	describe('decodeTimerBControl', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeTimerBControl(buffer))
		})

		it('should decode zeroed', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerBControl(buffer)

			assert.deepEqual(result, {
				pulseWidth: TIMER_B_PULSE_WIDTH.WIDTH_46_875_MS,
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ
			})
		})

		it('should decode zeroed from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerBControl(buffer.buffer)

			assert.deepEqual(result, {
				pulseWidth: TIMER_B_PULSE_WIDTH.WIDTH_46_875_MS,
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ
			})
		})

		it('should decode unique value', () => {
			const buffer = Uint8Array.from([ 0b0100_0011 ])
			const result = Converter.decodeTimerBControl(buffer)

			assert.deepEqual(result, {
				pulseWidth: TIMER_B_PULSE_WIDTH.WIDTH_125_00_MS,
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_1_60_HZ
			})
		})
	})

	describe('decodeTimerAValue', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeTimerAValue(buffer))
		})

		it('should decode zeroed', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerAValue(buffer)
			assert.equal(result, 0)
		})

		it('should decode zeroed from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerAValue(buffer.buffer)
			assert.equal(result, 0)
		})
	})

	describe('decodeTimerBValue', () => {
		it('should throw on zero length', () => {
			const buffer = Uint8Array.from([ ])
			assert.throws(() => Converter.decodeTimerBValue(buffer))
		})

		it('should decode zeroed', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerBValue(buffer)
			assert.equal(result, 0)
		})

		it('should decode zeroed from ArrayBuffer', () => {
			const buffer = Uint8Array.from([ 0 ])
			const result = Converter.decodeTimerBValue(buffer.buffer)
			assert.equal(result, 0)
		})
	})

	//
	//
	//


	describe('encodeControl1', () => {
		it('should encode', () => {
			const ab = Converter.encodeControl1({
				capacitorSelection: CAP_VALUES.SEVEN,
				stop: false,
				ampm: false,
				secondInterruptEnabled: false,
				alarmInterruptEnabled: false,
				correctionInterruptEnabled: false
			})

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_0000)
		})

		it('should encode unique value', () => {
			const ab = Converter.encodeControl1({
				capacitorSelection: CAP_VALUES.TWELVE,
				stop: true,
				ampm: false,
				secondInterruptEnabled: true,
				alarmInterruptEnabled: false,
				correctionInterruptEnabled: false
			})

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1010_0100)
		})
	})

	describe('encodeControl2', () => {
		it('should encode without clear', () => {
			const ab = Converter.encodeControl2({
				watchdogAInterruptEnabled: false,
				countdownAInterruptEnabled: false,
				countdownBInterruptEnabled: false,
			})

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1111_1000)
		})

		it('should encode with clear', () => {
			const ab = Converter.encodeControl2({
				clearSecondFlag: true,
				clearAlarmFlag: true,

				watchdogAInterruptEnabled: false,
				countdownAInterruptEnabled: false,
				countdownBInterruptEnabled: true,
			})

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1110_0001)
		})

		it('should encode with alt clear', () => {
			const ab = Converter.encodeControl2({
				clearWatchdogAFlag: true,
				clearCountdownAFlag: true,
				clearCountdownBFlag: true,

				watchdogAInterruptEnabled: true,
				countdownAInterruptEnabled: true,
				countdownBInterruptEnabled: true,
			})

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0001_1111)
		})
	})

	describe('encodeControl3', () => {
		it('should encode without clear', () => {
			const ab = Converter.encodeControl3({
				pmBatteryLowDetectionEnabled: true,
				pmSwitchoverEnabled: true,
				pmDirectSwitchingEnabled: false,

				batterySwitchoverInterruptEnabled: false,
				batteryLowInterruptEnabled: false,
			})

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_1100)
		})

		it('should encode without clear', () => {
			const ab = Converter.encodeControl3({
				pmBatteryLowDetectionEnabled: true,
				pmSwitchoverEnabled: true,
				pmDirectSwitchingEnabled: false,

				clearBatterySwitchoverFlag: true,

				batterySwitchoverInterruptEnabled: true,
				batteryLowInterruptEnabled: true,
			})

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_0111)
		})
	})

	describe('encodeTime', () => {
		it('should encode', () => {
			const ab = Converter.encodeTime({
				second: 0,
				minute: 0,
				hour: 0,
				day: 0,
				monthsValue: 0,
				year4digit: 0
			}, false, 0)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(ab.byteLength, 7)
			assert.equal(u8[0], 0b0000_0000)
			assert.equal(u8[1], 0b0000_0000)
			assert.equal(u8[2], 0b0000_0000)
			assert.equal(u8[3], 0b0000_0000)
			assert.equal(u8[4], 0b0000_0000)
			assert.equal(u8[5], 0b0000_0000)
			assert.equal(u8[6], 0b0000_0000)
		})
	})

	describe('encodeAlarm', () => {
		it('should encode', () => {
			const ab = Converter.encodeAlarm({
				minute: 0, minuteEnabled: false,
				hour: 0, hourEnabled: false,
				day: 0, dayEnabled: false,
				weekdayValue: 0, weekdayEnabled: false
			}, false)

			assert.equal(ab.byteLength, 4)

			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1000_0000)
		})
	})

	describe('encodeOffset', () => {
		it('should encode', () => {
			const ab = Converter.encodeOffset(OFFSET_MODE.ONCE_EVERY_TWO_HOURS, 0)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_0000)
		})

		it('should encode unique mode', () => {
			const ab = Converter.encodeOffset(OFFSET_MODE.ONCE_EVERY_MINUTE, 0)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1000_0000)
		})

		it('should encode unique mode and value', () => {
			const ab = Converter.encodeOffset(OFFSET_MODE.ONCE_EVERY_MINUTE, 42)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1010_1010)
		})

		it('should encode unique mode and negative value', () => {
			const ab = Converter.encodeOffset(OFFSET_MODE.ONCE_EVERY_MINUTE, -42)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1101_0110)
		})
	})

	describe('encodeTimerControl', () => {
		it('should encode', () => {
			const ab = Converter.encodeTimerControl({
				interruptAPulsedMode: false,
				interruptBPulsedMode: false,
				clockFrequencyValue: TIMER_CLOCK_FREQUENCY.FREQUENCY_32768,
				timerAControl: TIMER_A_CONTROL.DISABLED,
				countdownTimerBEnabled: false
			})
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_0000)
		})

		it('should encode unique value', () => {
			const ab = Converter.encodeTimerControl({
				interruptAPulsedMode: true,
				interruptBPulsedMode: false,
				clockFrequencyValue: TIMER_CLOCK_FREQUENCY.FREQUENCY_32768,
				timerAControl: TIMER_A_CONTROL.WATCHDOG,
				countdownTimerBEnabled: true
			})
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b1000_0101)
		})
	})

	describe('encodeTimerAControl', () => {
		it('should encode', () => {
			const ab = Converter.encodeTimerAControl({
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600_HZ
			})
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_0111)
		})

		it('should encode', () => {
			const ab = Converter.encodeTimerAControl({
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_64_HZ
			})
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_0001)
		})
	})

	describe('encodeTimerBControl', () => {
		it('should encode', () => {
			const ab = Converter.encodeTimerBControl({
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600_HZ,
				pulseWidth: TIMER_B_PULSE_WIDTH.WIDTH_46_875_MS
			})
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0000_0111)
		})

		it('should encode unique value', () => {
			const ab = Converter.encodeTimerBControl({
				sourceClock: TIMER_AB_SOURCE_CLOCK.SOURCE_1_HZ,
				pulseWidth: TIMER_B_PULSE_WIDTH.WIDTH_156_25_MS
			})
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0b0101_0010)
		})
	})

	describe('encodeTimerAValue', () => {
		it('should encode', () => {
			const ab = Converter.encodeTimerAValue(0)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0)
		})

		it('should encode unique value', () => {
			const ab = Converter.encodeTimerAValue(42)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 42)
		})
	})

	describe('encodeTimerBValue', () => {
		it('should encode', () => {
			const ab = Converter.encodeTimerBValue(0)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 0)
		})

		it('should encode unique value', () => {
			const ab = Converter.encodeTimerBValue(77)
			const u8 = ArrayBuffer.isView(ab) ?
				new Uint8Array(ab.buffer, ab.byteOffset, ab.byteLength) :
				new Uint8Array(ab)

			assert.equal(u8[0], 77)
		})
	})

})


