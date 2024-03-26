import { BitSmush } from '@johntalton/bitsmush'

export const BASE_CENTURY_Y2K = 2000

export const CAP_VALUES = {
	SEVEN: '7pF',
	TWELVE: '12.5pF'
}

export const WEEKDAYS_MAP = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

export const MONTHS_MAP = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

export function decodeBCD(value, tensPos, tensLen, unitsPos, unitsLen) {
	//return value - 6 * (value >> 4)
	return 10 * BitSmush.extractBits(value, tensPos, tensLen) +
		BitSmush.extractBits(value, unitsPos, unitsLen)
}

export function encodeBCD(value, tensPos, tensLen, unitsPos, unitsLen) {
	return value + 6 * Math.floor(value / 10)
	//const tens = Math.floor(value / 10)
	// ...
}

export class Converter {
	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
  static decodeControl1(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ control1 ] = u8

		const capSelRaw = BitSmush.extractBits(control1, 7, 1)
		const stop = BitSmush.extractBits(control1, 5, 1) === 1
		const ampm = BitSmush.extractBits(control1, 3, 1) === 1
		const secondInterruptEnabled = BitSmush.extractBits(control1, 2, 1) === 1
		const alarmInterruptEnabled = BitSmush.extractBits(control1, 1, 1) === 1
		const correctionInterruptEnabled = BitSmush.extractBits(control1, 0, 1) === 1

		return {
			capacitorSelection: capSelRaw === 1 ? CAP_VALUES.TWELVE : CAP_VALUES.SEVEN,
			stop, ampm,
			secondInterruptEnabled, alarmInterruptEnabled, correctionInterruptEnabled
		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeControl2(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ control2 ] = u8

		const watchdogAFlag = BitSmush.extractBits(control2, 7, 1) === 1
		const countdownAFlag = BitSmush.extractBits(control2, 6, 1) === 1
		const countdownBFlag = BitSmush.extractBits(control2, 5, 1) === 1
		const secondFlag = BitSmush.extractBits(control2, 4, 1) === 1
		const alarmFlag = BitSmush.extractBits(control2, 3, 1) === 1
		const watchdogAInterruptEnabled = BitSmush.extractBits(control2, 2, 1) === 1
		const countdownAInterruptEnabled = BitSmush.extractBits(control2, 1, 1) === 1
		const countdownBInterruptEnabled = BitSmush.extractBits(control2, 0, 1) === 1

		return {
			watchdogAFlag,
			countdownAFlag,
			countdownBFlag,
			secondFlag,
			alarmFlag,

			watchdogAInterruptEnabled,
			countdownAInterruptEnabled,
			countdownBInterruptEnabled
		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeControl3(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ control3 ] = u8

		const powerMode = BitSmush.extractBits(control3, 7, 3)
		const batterySwitchoverFlag = BitSmush.extractBits(control3, 3, 1) === 1
		const batteryLowFlag = BitSmush.extractBits(control3, 2, 1) === 1
		const batterySwitchoverInterruptEnabled = BitSmush.extractBits(control3, 1, 1) === 1
		const batteryLowInterruptEnabled = BitSmush.extractBits(control3, 0, 1) === 1

		const pmBatteryLowDetectionEnabled = !(BitSmush.extractBits(powerMode, 2, 1) === 1)
		const pmSwitchoverEnabled = !(BitSmush.extractBits(powerMode, 1, 1) === 1)
		const pmDirectSwitchingEnabled = BitSmush.extractBits(powerMode, 0, 1) === 1

		return {
			pmBatteryLowDetectionEnabled,
			pmSwitchoverEnabled,
			pmDirectSwitchingEnabled,

			batterySwitchoverInterruptEnabled,
			batteryLowInterruptEnabled,

			batterySwitchoverFlag,
			batteryLowFlag
		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeTime(buffer, ampm_mode, baseDecade) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		// this is "the same" as the registers byte count to read
		// though, that is in terms of register lengths and this
		// is in terms of bytes in the packed buffer
		// this is a validation value as apposed to physical read value 🤷🏻‍♂️
		const TIME_LENGTH = 7
		if (u8.byteLength !== TIME_LENGTH) { throw new Error('invalid time length') }

		const [
			secondsByte,
			minutesByte,
			hoursByte,
			daysByte,
			weekdaysByte,
			monthsByte,
			yearsByte
		] = u8

		const integrity = BitSmush.extractBits(secondsByte, 7, 1) === 0
		const second = decodeBCD(secondsByte, 6, 3, 3, 4)
		const minute = decodeBCD(minutesByte, 6, 3, 3, 4)
		const hour = ampm_mode ?
			decodeBCD(hoursByte, 4, 1, 3, 4) :
			decodeBCD(hoursByte, 5, 2, 3, 4)
		const pm = ampm_mode ? BitSmush.extractBits(hoursByte, 7, 1) === 1 : undefined
		const day = decodeBCD(daysByte, 5, 2, 3, 4)
		const weekdayValue = BitSmush.extractBits(weekdaysByte, 2, 3)
		const weekday = WEEKDAYS_MAP[weekdayValue]
		const monthsValue = decodeBCD(monthsByte, 4, 1, 3, 4)
		const month = MONTHS_MAP[monthsValue - 1]
		const year = baseDecade + decodeBCD(yearsByte, 7, 4, 3, 4)

		return {
			integrity,
			second,
			minute,
			hour,
			pm,
			day,
			weekdayValue,
			weekday,
			monthsValue,
			month,
			year
		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeAlarm(buffer, ampm_mode) {
		throw new Error('not implemented')
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeOffset(buffer) {
		throw new Error('not implemented')
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeTimerControl(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ byteValue ] = u8

		const interruptAPulsedMode = BitSmush.extractBits(byteValue, 7, 1) === 1
		const interruptBPulsedMode = BitSmush.extractBits(byteValue, 6, 1) === 1
		const clockFrequencyValue = BitSmush.extractBits(byteValue, 5, 3)
		//const timerAModeValue = BitSmush.extractBits(byteValue, 2, 2)
		const watchdogAEnabled = BitSmush.extractBits(byteValue, 2, 1) === 1
		const countdownTimerAEnabled = BitSmush.extractBits(byteValue, 1, 1) === 1
		const countdownTimerBEnabled = BitSmush.extractBits(byteValue, 0, 1) === 1

		// 000 32768
		// 001 16384
		// 010 8192
		// 011 4096 high-Z
		// 100 1024 high-Z
		// 101 32 high-Z
		// 110 1 high-Z
		// 111 disabled (high-Z)

		return {
			interruptAPulsedMode,
			interruptBPulsedMode,
			clockFrequencyValue, clockFrequency,
			watchdogAEnabled, countdownTimerAEnabled,
			countdownTimerBEnabled
		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeTimerAControl(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ byteValue ] = u8

		return {

		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeTimerBControl(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ byteValue ] = u8

		return {

		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeTimerAValue(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ byteValue ] = u8

		return {

		}
	}

	/** @param {ArrayBufferLike|ArrayBufferView} buffer  */
	static decodeTimerBValue(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ byteValue ] = u8

		return {

		}
	}


	//
	//
	//

	/** @returns ArrayBuffer  */
	static encodeControl1(profile) {
		const {
			capacitorSelection,
			stop,
			ampm,
			secondInterruptEnabled,
			alarmInterruptEnabled,
			correctionInterruptEnabled
		} = profile

		const capSelRaw = capacitorSelection === CAP_VALUES.SEVEN ? 0 :
			capacitorSelection === CAP_VALUES.TWELVE ? 1 :
			// throw new Error('unknown cap value') // this should be a thing
			0

		const byteValue = BitSmush.smushBits([
			[7, 1], [5, 1], [3, 1], [2, 1], [1, 1], [0, 1]
		], [
			capSelRaw, stop, ampm, secondInterruptEnabled, alarmInterruptEnabled, correctionInterruptEnabled
		])

		const buffer = Uint8Array.from([ byteValue ])
		return buffer.buffer
	}

	/** @returns ArrayBuffer  */
	static encodeControl2(profile) {
		const {
			clearCountdownAFlag,
			clearCountdownBFlag,
			clearSecondFlag,
			clearAlarmFlag,

			watchdogInterruptEnabled,
			countdownAInterruptEnabled,
			countdownBInterruptEnabled,
		} = profile


		const byteValue = BitSmush.smushBits([
			[6, 1], [5, 1], [4, 1], [3, 1],
			[2, 1], [1, 1], [0, 1]
		],
		[
			clearCountdownAFlag ? 0 : 1,
			clearCountdownBFlag ? 0 : 1,
			clearSecondFlag ? 0 : 1,
			clearAlarmFlag ? 0 : 1,

			watchdogInterruptEnabled ? 1 : 0,
			countdownAInterruptEnabled ? 1 : 0,
			countdownBInterruptEnabled ? 1 : 0,
		])

		const buffer = Uint8Array.from([ byteValue ])
		return buffer.buffer
	}

	/** @returns ArrayBuffer  */
	static encodeControl3(profile) {
		const {
			pmBatteryLowDetectionEnabled,
			pmSwitchoverEnabled,
			pmDirectSwitchingEnabled,

			clearBatterSwitchoverFlag,

			batterySwitchoverInterruptEnabled,
			batteryLowInterruptEnabled,
		} = profile

		const powerMode = BitSmush.smushBits([
			[2, 1], [1, 1], [0, 1]
		], [
			pmBatteryLowDetectionEnabled ? 0 : 1,
			pmSwitchoverEnabled ? 0 : 1,
			pmDirectSwitchingEnabled ? 1 : 0
		])

		const byteValue = BitSmush.smushBits([
			[ 7, 3 ], [ 3, 1 ], [2, 1], [ 1, 1 ], [ 0, 1 ]
		], [
			powerMode,
			clearBatterSwitchoverFlag ? 0 : 1,
			1,
			batterySwitchoverInterruptEnabled ? 1 : 0,
			batteryLowInterruptEnabled ? 1 : 0
		])

		const buffer = Uint8Array.from([ byteValue ])
		return buffer.buffer
	}

	/** @returns ArrayBuffer  */
	static encodeTime(seconds, minutes, hours, day, month, year, ampm_mode, century) {
		if(year < 100 && century === undefined) { console.warn('2-digit year / Y2K warning') }
		const year2digit = year >= 100 ? Math.max(0, year - century) : year

		const OS_MASK = 0x7f

		const buffer = Uint8Array.from([
			encodeBCD(seconds & OS_MASK),
			encodeBCD(minutes),
			encodeBCD(hours), // TODO encode ampm
			encodeBCD(day),
			encodeBCD(0),  // TODO calculate day of week? or require
			encodeBCD(month),
			encodeBCD(year2digit)
		])

		return buffer.buffer
	}

	/** @returns ArrayBuffer  */
	static encodeAlarm() {
		throw new Error('no implementation')
	}

	/** @returns ArrayBuffer  */
	static encodeOffset() {
		throw new Error('no implementation')
	}
}