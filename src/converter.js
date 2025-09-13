import { BitSmush } from '@johntalton/bitsmush'

import {
	BASE_CENTURY_Y2K,
	BIT_SET,
	BIT_UNSET,
	BYTE_LENGTH_ALARM,
	BYTE_LENGTH_ONE,
	BYTE_LENGTH_TIME,
	CAP_VALUES,
	MONTHS_MAP,
	OFFSET_LSB_PPM,
	OFFSET_MODE,
	WEEKDAYS_MAP
} from './defs.js'

/**
 * @import { I2CBufferSource } from '@johntalton/and-other-delights'
 * @import {
 *  Control1,
 *  Control2, Control2Clear,
 *  Control3, Control3Clear,
 *  Time, CoreTime,
 *  Offset,
 *  TimerControl,
 *  TimerAFrequencyControl,
 *  TimerBFrequencyControl,
 *  AlarmMinute,
 *  AlarmHour,
 *  AlarmDay,
 *  AlarmWeekday,
 *  Alarm
 * } from './defs.js'
 */

/**
 * @param {number} value
 * @param {number} tensPos
 * @param {number} tensLen
 * @param {number} unitsPos
 * @param {number} unitsLen
 */
export function decodeBCD(value, tensPos, tensLen, unitsPos, unitsLen) {
	//return value - 6 * (value >> 4)
	return 10 * BitSmush.extractBits(value, tensPos, tensLen) +
		BitSmush.extractBits(value, unitsPos, unitsLen)
}

/**
 * @param {number} value
 * @param {number} tensPos
 * @param {number} tensLen
 * @param {number} unitsPos
 * @param {number} unitsLen
 */
export function encodeBCD(value, tensPos, tensLen, unitsPos, unitsLen) {
	return value + 6 * Math.floor(value / 10)
	//const tens = Math.floor(value / 10)
	// ...
}

const SEVEN_BIT_MASK = 0b0111_1111

/**
 * @param {number} value
 */
export function decode7BitTwosComplement(value) {
	const SIGN_MASK = 0b0100_0000

	if((value & SIGN_MASK) !== 0) { return -((~value & SEVEN_BIT_MASK) + 1) }
	return value
}

/**
 * @param {number} value
 */
export function encode7BitTwosComplement(value) {
	if(value > 63 || value < -64) { throw new RangeError('value ouf of range') }
	if(value >= 0) { return value }

	return (~(-value - 1)) & SEVEN_BIT_MASK
}

/**
 * @param {CoreTime} time
 * @returns {Date}
 */
export function decodeTimeToDate(time) {
	const { year, monthsValue, day, hour, minute, second } = time

	return new Date(Date.UTC(
		year,
		monthsValue - 1,
		day,
		hour, minute, second))
}


/**
 * @param {Date} date
 * @param {number} century
 * @returns {CoreTime}
 */
export function encodeTimeFromDate(date, century) {
	const second = date.getUTCSeconds()
	const minute = date.getUTCMinutes()
	const hour = date.getUTCHours()

	const day = date.getUTCDate()
	const monthsValue = date.getUTCMonth() + 1
	const year = date.getUTCFullYear() - century

	return {
		second,
		minute,
		hour,
		day,
		monthsValue,
		year
	}
}

export class Converter {
	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {Control1}
	 */
  static decodeControl1(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ control1 ] = u8

		const capSelRaw = BitSmush.extractBits(control1, 7, 1)
		const stop = BitSmush.extractBits(control1, 5, 1) === BIT_SET
		const ampm = BitSmush.extractBits(control1, 3, 1) === BIT_SET
		const secondInterruptEnabled = BitSmush.extractBits(control1, 2, 1) === BIT_SET
		const alarmInterruptEnabled = BitSmush.extractBits(control1, 1, 1) === BIT_SET
		const correctionInterruptEnabled = BitSmush.extractBits(control1, 0, 1) === BIT_SET

		return {
			capacitorSelection: capSelRaw === 0 ? CAP_VALUES.SEVEN : CAP_VALUES.TWELVE,
			stop,
			ampm,
			secondInterruptEnabled,
			alarmInterruptEnabled,
			correctionInterruptEnabled
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {Control2}
	 */
	static decodeControl2(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ control2 ] = u8

		const watchdogAFlag = BitSmush.extractBits(control2, 7, 1) === BIT_SET
		const countdownAFlag = BitSmush.extractBits(control2, 6, 1) === BIT_SET
		const countdownBFlag = BitSmush.extractBits(control2, 5, 1) === BIT_SET
		const secondFlag = BitSmush.extractBits(control2, 4, 1) === BIT_SET
		const alarmFlag = BitSmush.extractBits(control2, 3, 1) === BIT_SET
		const watchdogAInterruptEnabled = BitSmush.extractBits(control2, 2, 1) === BIT_SET
		const countdownAInterruptEnabled = BitSmush.extractBits(control2, 1, 1) === BIT_SET
		const countdownBInterruptEnabled = BitSmush.extractBits(control2, 0, 1) === BIT_SET

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

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {Control3}
	 */
	static decodeControl3(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ control3 ] = u8

		const powerMode = BitSmush.extractBits(control3, 7, 3)
		const batterySwitchoverFlag = BitSmush.extractBits(control3, 3, 1) === BIT_SET
		const batteryLowFlag = BitSmush.extractBits(control3, 2, 1) === BIT_SET
		const batterySwitchoverInterruptEnabled = BitSmush.extractBits(control3, 1, 1) === BIT_SET
		const batteryLowInterruptEnabled = BitSmush.extractBits(control3, 0, 1) === BIT_SET

		const pmBatteryLowDetectionEnabled = !(BitSmush.extractBits(powerMode, 2, 1) === BIT_SET)
		const pmSwitchoverEnabled = !(BitSmush.extractBits(powerMode, 1, 1) === BIT_SET)
		const pmDirectSwitchingEnabled = BitSmush.extractBits(powerMode, 0, 1) === BIT_SET

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

	/**
	 * @param {I2CBufferSource} buffer
	 * @param {boolean} ampm_mode
	 * @param {number} century
	 * @returns {Time}
	 */
	static decodeTime(buffer, ampm_mode, century) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_TIME) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_TIME)

		const [
			secondsByte,
			minutesByte,
			hoursByte,
			daysByte,
			weekdaysByte,
			monthsByte,
			yearsByte
		] = u8

		const integrity = BitSmush.extractBits(secondsByte, 7, 1) === BIT_UNSET
		const second = decodeBCD(secondsByte, 6, 3, 3, 4)
		const minute = decodeBCD(minutesByte, 6, 3, 3, 4)
		const hour = ampm_mode ?
			decodeBCD(hoursByte, 4, 1, 3, 4) :
			decodeBCD(hoursByte, 5, 2, 3, 4)
		const pm = ampm_mode ? BitSmush.extractBits(hoursByte, 7, 1) === BIT_SET : undefined
		const day = decodeBCD(daysByte, 5, 2, 3, 4)
		const weekdayValue = BitSmush.extractBits(weekdaysByte, 2, 3)
		const weekday = WEEKDAYS_MAP[weekdayValue]
		const monthsValue = decodeBCD(monthsByte, 4, 1, 3, 4)
		const month = MONTHS_MAP[monthsValue - 1]
		const year = century + decodeBCD(yearsByte, 7, 4, 3, 4)

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

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {AlarmMinute}
	 */
	static decodeAlarmMinute(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const minuteEnabled = !(BitSmush.extractBits(byteValue, 7, 1) === BIT_SET)
		const minute = decodeBCD(byteValue, 6, 3, 3, 4)

		return {
			minuteEnabled,
			minute
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @param {boolean} ampm_mode
	 * @returns {AlarmHour}
	 */
	static decodeAlarmHour(buffer, ampm_mode) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const hourEnabled = !(BitSmush.extractBits(byteValue, 7, 1) === BIT_SET)
		const pm = ampm_mode ? (BitSmush.extractBits(byteValue, 5, 1) === BIT_SET) : undefined
		const hour = ampm_mode ?
			decodeBCD(byteValue, 4, 1, 3, 4) :
			decodeBCD(byteValue, 5, 2, 3, 4)

		return {
			hourEnabled,
			hour,
			pm
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {AlarmDay}
	 */
	static decodeAlarmDay(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const dayEnabled = !(BitSmush.extractBits(byteValue, 7, 1) === BIT_SET)
		const day = decodeBCD(byteValue, 5, 2, 3, 4)

		return {
			dayEnabled,
			day
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {AlarmWeekday}
	 */
	static decodeAlarmWeekday(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const weekdayEnabled = !(BitSmush.extractBits(byteValue, 7, 1) === BIT_SET)
		const weekdayValue = BitSmush.extractBits(byteValue, 2, 3)
		const weekday = WEEKDAYS_MAP[weekdayValue]

		return {
			weekdayEnabled,
			weekdayValue,
			weekday
		}
	}


	/**
	 * @param {I2CBufferSource} buffer
	 * @param {boolean} ampm_mode
	 * @returns {Alarm}
	 */
	static decodeAlarm(buffer, ampm_mode) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ALARM) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ALARM)

		const minute = Converter.decodeAlarmMinute(u8.subarray(0))
		const hour = Converter.decodeAlarmHour(u8.subarray(1), ampm_mode)
		const day = Converter.decodeAlarmDay(u8.subarray(2))
		const weekday = Converter.decodeAlarmWeekday(u8.subarray(3))

		return {
			...minute,
			...hour,
			...day,
			...weekday
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {Offset}
	 */
	static decodeOffset(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const mode = BitSmush.extractBits(byteValue, 7, 1)
		const offsetValue7BitTwos = BitSmush.extractBits(byteValue, 6, 7)
		const offsetValue = decode7BitTwosComplement(offsetValue7BitTwos)

		const offsetLSB = mode === OFFSET_MODE.ONCE_EVERY_TWO_HOURS ? OFFSET_LSB_PPM.MODE_0 : OFFSET_LSB_PPM.MODE_1
		const offsetPPM = offsetValue * offsetLSB

		return {
			mode,
			offsetValue,
			offsetPPM
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {TimerControl}
	 */
	static decodeTimerControl(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const interruptAPulsedMode = BitSmush.extractBits(byteValue, 7, 1) === BIT_SET
		const interruptBPulsedMode = BitSmush.extractBits(byteValue, 6, 1) === BIT_SET
		const clockFrequencyValue = BitSmush.extractBits(byteValue, 5, 3)
		const timerAControl = BitSmush.extractBits(byteValue, 2, 2)
		const countdownTimerBEnabled = BitSmush.extractBits(byteValue, 0, 1) === BIT_SET

		return {
			interruptAPulsedMode,
			interruptBPulsedMode,
			clockFrequencyValue,
			timerAControl,
			countdownTimerBEnabled
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {TimerAFrequencyControl}
	*/
	static decodeTimerAControl(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const sourceClock = BitSmush.extractBits(byteValue, 2, 3)

		return {
			sourceClock
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {TimerBFrequencyControl}
	*/
	static decodeTimerBControl(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		const pulseWidth = BitSmush.extractBits(byteValue, 6, 3)
		const sourceClock = BitSmush.extractBits(byteValue, 2, 3)

		return {
			sourceClock,
			pulseWidth
		}
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {number}
	*/
	static decodeTimerAValue(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		return byteValue
	}

	/**
	 * @param {I2CBufferSource} buffer
	 * @returns {number}
	*/
	static decodeTimerBValue(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, BYTE_LENGTH_ONE) :
			new Uint8Array(buffer, 0, BYTE_LENGTH_ONE)

		const [ byteValue ] = u8

		return byteValue
	}


	//
	//
	//

	/**
	 * @param {Control1} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeControl1(profile) {
		const {
			capacitorSelection,
			stop,
			ampm,
			secondInterruptEnabled,
			alarmInterruptEnabled,
			correctionInterruptEnabled
		} = profile

		const capSelRaw = capacitorSelection === CAP_VALUES.TWELVE ? BIT_SET : BIT_UNSET

		const byteValue = BitSmush.smushBits([
			[7, 1], [5, 1], [3, 1], [2, 1], [1, 1], [0, 1]
		], [
			capSelRaw,
			stop ? BIT_SET : BIT_UNSET,
			ampm ? BIT_SET : BIT_UNSET,
			secondInterruptEnabled ? BIT_SET : BIT_UNSET,
			alarmInterruptEnabled ? BIT_SET : BIT_UNSET,
			correctionInterruptEnabled ? BIT_SET : BIT_UNSET
		])

		return Uint8Array.from([ byteValue ])
	}

	/**
	 * @param {Control2Clear} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeControl2(profile) {
		const {
			watchdogAInterruptEnabled,
			countdownAInterruptEnabled,
			countdownBInterruptEnabled,
		} = profile

		const clearWatchdogAFlag = profile.clearWatchdogAFlag ?? false
		const clearCountdownAFlag = profile.clearCountdownAFlag ?? false
		const clearCountdownBFlag = profile.clearCountdownBFlag ?? false
		const clearSecondFlag = profile.clearSecondFlag ?? false
		const clearAlarmFlag = profile.clearAlarmFlag ?? false

		const byteValue = BitSmush.smushBits([
			[7, 1], [6, 1], [5, 1], [4, 1], [3, 1],
			[2, 1], [1, 1], [0, 1]
		],
		[
			clearWatchdogAFlag ? BIT_UNSET : BIT_SET,
			clearCountdownAFlag ? BIT_UNSET : BIT_SET,
			clearCountdownBFlag ? BIT_UNSET : BIT_SET,
			clearSecondFlag ? BIT_UNSET : BIT_SET,
			clearAlarmFlag ? BIT_UNSET : BIT_SET,

			watchdogAInterruptEnabled ? BIT_SET : BIT_UNSET,
			countdownAInterruptEnabled ? BIT_SET : BIT_UNSET,
			countdownBInterruptEnabled ? BIT_SET : BIT_UNSET,
		])

		return Uint8Array.from([ byteValue ])
	}

	/**
	 * @param {Control3Clear} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeControl3(profile) {
		const {
			pmBatteryLowDetectionEnabled,
			pmSwitchoverEnabled,
			pmDirectSwitchingEnabled,

			batterySwitchoverInterruptEnabled,
			batteryLowInterruptEnabled
		} = profile

		const clearBatterySwitchoverFlag = profile.clearBatterySwitchoverFlag ?? false

		const powerMode = BitSmush.smushBits([
			[2, 1], [1, 1], [0, 1]
		], [
			pmBatteryLowDetectionEnabled ? BIT_UNSET : BIT_SET,
			pmSwitchoverEnabled ? BIT_UNSET : BIT_SET,
			pmDirectSwitchingEnabled ? BIT_SET : BIT_UNSET
		])

		const byteValue = BitSmush.smushBits([
			[ 7, 3 ], [ 3, 1 ], [2, 1], [ 1, 1 ], [ 0, 1 ]
		], [
			powerMode,
			clearBatterySwitchoverFlag ? BIT_UNSET : BIT_SET,
			BIT_SET, // read-only
			batterySwitchoverInterruptEnabled ? BIT_SET : BIT_UNSET,
			batteryLowInterruptEnabled ? BIT_SET : BIT_UNSET
		])

		return Uint8Array.from([ byteValue ])
	}

	/**
	 * @param {CoreTime} time
	 * @param {boolean} ampm_mode
	 * @param {number} century
	 * @returns {I2CBufferSource}
	 */
	static encodeTime(time, ampm_mode, century) {
		const { second, minute, hour, day, monthsValue, year } = time

		if(year < 100 && century === undefined) { console.warn('2-digit year / Y2K warning') }
		const year2digit = year >= 100 ? Math.max(0, year - century) : year

		const OS_MASK = 0x80
		const SECONDS_MASK = 0x7F // ~OS_MASK

		return Uint8Array.from([
			encodeBCD(second & SECONDS_MASK),
			encodeBCD(minute),
			encodeBCD(hour), // TODO encode ampm
			encodeBCD(day),
			encodeBCD(0),  // TODO calculate day of week? or require
			encodeBCD(monthsValue),
			encodeBCD(year2digit)
		])
	}


	/**
	 * @param {number} minute
	 * @param {boolean} enable
	 * @returns {number}
	 */
	static _encodeAlarmMinute(minute, enable) {
		const enableValue = enable ? BIT_UNSET : BIT_SET
		const minuteValue = encodeBCD(minute, 6, 3, 3, 4)
		return BitSmush.smushBits(
			[ [ 7, 1], [ 6, 7 ] ],
			[ enableValue, minuteValue ]
		)
	}

	/**
	 * @param {number} hour
	 * @param {boolean} ampm_mode
	 * @param {boolean} enable
	 * @returns {number}
	 */
	static _encodeAlarmHour(hour, ampm_mode, enable) {
		const enableValue = enable ? BIT_UNSET : BIT_SET
		// const ampm = ampm_mode ? ampmValue :
		const hourValue = ampm_mode ?
			encodeBCD(hour, 4, 1, 3, 4) :
			encodeBCD(hour, 4, 2, 3, 4)

		return BitSmush.smushBits(
			[ [ 7, 1], [ 5, 6 ] ],
			[ enableValue, hourValue ]
		)
	}

	/**
	 * @param {number} day
	 * @param {boolean} enable
	 * @returns {number}
	 */
	static _encodeAlarmDay(day, enable) {
		const enableValue = enable ? BIT_UNSET : BIT_SET
		const dayValue = encodeBCD(day, 5, 2, 3, 4)
		return BitSmush.smushBits(
			[ [ 7, 1 ], [ 5, 6 ]],
			[ enableValue, dayValue ]
		)
	}

	/**
	 * @param {number} weekdayValue
	 * @param {boolean} enable
	 * @returns {number}
	 */
	static _encodeAlarmWeekday(weekdayValue, enable) {
		const enableValue = enable ? BIT_UNSET : BIT_SET
		return BitSmush.smushBits(
			[ [ 7, 1 ], [ 2, 3 ]],
			[ enableValue, weekdayValue ]
		)
	}

	/**
	 * @param {Alarm} alarm
	 * @param {boolean} ampm_mode
	 * @returns {I2CBufferSource}
	 */
	static encodeAlarm(alarm, ampm_mode) {
		const {
			minute,
			hour,
			day,
			weekdayValue
		} = alarm

		const minuteEnabled = alarm.minuteEnabled ?? false
		const hourEnabled = alarm.hourEnabled ?? false
		const dayEnabled = alarm.dayEnabled ?? false
		const weekdayEnabled = alarm.weekdayEnabled ?? false

		const pm = ampm_mode ? alarm.pm : undefined

		return Uint8Array.from([
			Converter._encodeAlarmMinute(minute, minuteEnabled),
			Converter._encodeAlarmHour(hour, ampm_mode, hourEnabled),
			Converter._encodeAlarmDay(day, dayEnabled),
			Converter._encodeAlarmWeekday(weekdayValue, weekdayEnabled)
		])
	}

	/**
	 * @param {OFFSET_MODE} mode
	 * @param {number} offsetValue
	 * @returns {I2CBufferSource}  */
	static encodeOffset(mode, offsetValue) {
		const offsetValue7BitTwos = encode7BitTwosComplement(offsetValue)

		const byteValue = BitSmush.smushBits(
			[ [ 7, 1 ], [ 6, 7 ] ],
			[
				mode, offsetValue7BitTwos
			])

		return Uint8Array.from([ byteValue ])
	}
}