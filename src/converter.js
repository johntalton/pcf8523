import { BitSmush } from '@johntalton/bitsmush'

import {
	BIT_SET,
	BIT_UNSET,
	BYTE_LENGTH_ALARM,
	BYTE_LENGTH_ONE,
	BYTE_LENGTH_TIME,
	CAP_MAP,
	CAP_VALUES,
	HOUR_OFFSET_FOR_PM,
	MONTHS_MAP,
	OFFSET_LSB_PPM,
	OFFSET_MODE,
	PM_SET_BIT,
	SECONDS_MASK,
	SEVEN_BIT_MASK,
	SIGN_MASK,
	SOURCE_CLOCK_PREFERRED_UNIT_MAP,
	SOURCE_CLOCK_VALUE_HZ_MAP,
	UN_ALLOWED_POWER_MODE,
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
 *  AlarmHour, AlarmHourExtended,
 *  AlarmDay,
 *  AlarmWeekday,
 *  Alarm,
 *  TIMER_AB_SOURCE_CLOCK
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
	const tens = Math.floor(value / 10)
	const units = value - (tens * 10)

	return BitSmush.smushBits(
		[ [ tensPos, tensLen ], [ unitsPos, unitsLen] ],
		[ tens, units ])
}

/**
 * @param {number} value
 */
export function decode7BitTwosComplement(value) {
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
	const { year4digit, monthsValue, day, hour, pm, minute, second } = time

	const hour24 = pm === true ? hour + HOUR_OFFSET_FOR_PM : hour

	return new Date(Date.UTC(
		year4digit,
		monthsValue - 1,
		day,
		hour24, minute, second))
}


/**
 * @param {Date} date
 * @param {boolean} ampm_mode
 * @returns {CoreTime}
 */
export function encodeTimeFromDate(date, ampm_mode) {
	const second = date.getUTCSeconds()
	const minute = date.getUTCMinutes()
	const hour24 = date.getUTCHours()

	const day = date.getUTCDate()
	const monthsValue = date.getUTCMonth() + 1
	const year4digit = date.getUTCFullYear()

	const weekdayValue = date.getUTCDay()

	const pm = ampm_mode === true ? hour24 >= HOUR_OFFSET_FOR_PM : undefined
	const hour = ampm_mode === true ? (hour24 % HOUR_OFFSET_FOR_PM || HOUR_OFFSET_FOR_PM) : hour24

	return {
		second,
		minute,
		hour,
		pm,
		day,
		weekdayValue,
		monthsValue,
		year4digit
	}
}

/**
 * @param {TIMER_AB_SOURCE_CLOCK} sourceClock
 * @param {number} value
 */
export function timerValueToUnit(sourceClock, value) {
	if(value < 0 || value > 255) { throw new RangeError('invalid value') }
	const devisor = SOURCE_CLOCK_VALUE_HZ_MAP[sourceClock]
	if(devisor === undefined) { throw new RangeError('invalid source clock') }

	const trunc3 = (/** @type {number} */ v) => Math.trunc(v * 1000) / 1000

	const seconds = value / devisor
	const milliseconds = seconds * 1000
	const microseconds = milliseconds * 1000
	const minutes = seconds / 60
	const hours = minutes / 60

	const preferred = SOURCE_CLOCK_PREFERRED_UNIT_MAP[sourceClock]

	return {
		microseconds: trunc3(microseconds),
		milliseconds: trunc3(milliseconds),
		seconds: trunc3(seconds),
		minutes: trunc3(minutes),
		hours: trunc3(hours),
		preferred
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

		const capacitorSelection = capSelRaw === 0 ? CAP_VALUES.SEVEN : CAP_VALUES.TWELVE

		return {
			capacitorSelection,
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
		const pmDirectSwitchingEnabled = pmSwitchoverEnabled ? BitSmush.extractBits(powerMode, 0, 1) === BIT_SET : undefined

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
		const pm = ampm_mode ? BitSmush.extractBits(hoursByte, 5, 1) === BIT_SET : undefined
		const day = decodeBCD(daysByte, 5, 2, 3, 4)
		const weekdayValue = BitSmush.extractBits(weekdaysByte, 2, 3)
		const weekday = WEEKDAYS_MAP[weekdayValue]
		const monthsValue = decodeBCD(monthsByte, 4, 1, 3, 4)
		const month = MONTHS_MAP[monthsValue - 1]
		const year2digit = decodeBCD(yearsByte, 7, 4, 3, 4)
		const year4digit = century + year2digit

		const hour24 = pm === true ? hour + HOUR_OFFSET_FOR_PM : hour

		return {
			integrity,
			second,
			minute,
			hour,
			hour24,
			pm,
			day,
			weekdayValue,
			weekday,
			monthsValue,
			month,
			year4digit
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
	 * @returns {AlarmHourExtended}
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

		const hour24 = pm === true ? hour + HOUR_OFFSET_FOR_PM : hour

		return {
			hourEnabled,
			hour,
			hour24,
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

		if(!CAP_MAP.includes(capacitorSelection)) { throw new Error('invalid capacitor selection') }
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

		const clearCountdownAFlag = profile.clearCountdownAFlag ?? false
		const clearCountdownBFlag = profile.clearCountdownBFlag ?? false
		const clearSecondFlag = profile.clearSecondFlag ?? false
		const clearAlarmFlag = profile.clearAlarmFlag ?? false

		const byteValue = BitSmush.smushBits([
			[7, 1], [6, 1], [5, 1], [4, 1], [3, 1],
			[2, 1], [1, 1], [0, 1]
		],
		[
			BIT_UNSET, // watchdog is cleared on read
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

		// todo If switching is disabled, then disable the direct bit
		// so that the un-allowed power state can be avoided
		if(powerMode === UN_ALLOWED_POWER_MODE) { throw new Error('power mode not allowed') }

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
		const { second, minute, hour, pm, day, weekdayValue, monthsValue, year4digit } = time

		if(year4digit < 1000) { console.warn('year less then 4 digits') }
		const year2digit = year4digit - century
		if(year2digit < 0) { throw new RangeError('year not in century (after)') }
		if(year2digit >= 100) { throw new RangeError('year not in century (before)') }

		if(ampm_mode && (pm === undefined)) { throw new Error('pm undefined for ampm mode') }
		const pmFlag = ampm_mode ? pm === true ? PM_SET_BIT : 0 : 0

		return Uint8Array.from([
			encodeBCD(second & SECONDS_MASK, 6, 3, 3, 4),
			encodeBCD(minute, 6, 3, 3, 4),
			ampm_mode ?
				(pmFlag | encodeBCD(hour, 4, 1, 3, 4)):
				encodeBCD(hour, 5, 2, 3, 4),
			encodeBCD(day, 5, 2, 3, 4),
			weekdayValue,
			encodeBCD(monthsValue, 4, 1, 3, 4),
			encodeBCD(year2digit, 7, 4, 3, 4)
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
	 * @param {AlarmMinute} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeAlarmMinute(profile) {
		const { minute, minuteEnabled } = profile
		const value = Converter._encodeAlarmMinute(minute, minuteEnabled)
		return Uint8Array.from([ value ])
	}

	/**
	 * @param {number} hour
	 * @param {boolean|undefined} pm
	 * @param {boolean} enable
	 * @param {boolean} ampm_mode
	 * @returns {number}
	 */
	static _encodeAlarmHour(hour, pm, enable, ampm_mode) {
		const enableValue = enable ? BIT_UNSET : BIT_SET
		const pmFlag = ampm_mode ? pm === true ? PM_SET_BIT : 0 : 0

		if(ampm_mode && (pm === undefined)) { throw new Error('pm undefined for ampm mode') }

		const hourValue = ampm_mode ?
			(pmFlag | encodeBCD(hour, 4, 1, 3, 4)) :
			encodeBCD(hour, 5, 2, 3, 4)

		return BitSmush.smushBits(
			[ [ 7, 1], [ 5, 6 ] ],
			[ enableValue, hourValue ]
		)
	}

	/**
	 * @param {AlarmHour} profile
	 * @param {boolean} ampm_mode
	 * @returns {I2CBufferSource}
	 */
	static encodeAlarmHour(profile, ampm_mode) {
		const { hour, pm, hourEnabled } = profile
		const value = Converter._encodeAlarmHour(hour, pm, hourEnabled, ampm_mode)
		return Uint8Array.from([ value ])
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
	 * @param {AlarmDay} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeAlarmDay(profile) {
		const { day, dayEnabled } = profile
		const value = Converter._encodeAlarmDay(day, dayEnabled)
		return Uint8Array.from([ value ])
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
	 * @param {AlarmWeekday} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeAlarmWeekday(profile) {
		const { weekdayValue, weekdayEnabled } = profile
		const value = Converter._encodeAlarmWeekday(weekdayValue, weekdayEnabled)
		return Uint8Array.from([ value ])
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
			Converter._encodeAlarmHour(hour, pm, hourEnabled, ampm_mode),
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

	/**
	 * @param {TimerControl} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeTimerControl(profile) {
		const {
			interruptAPulsedMode,
			interruptBPulsedMode,
			clockFrequencyValue,
			timerAControl,
			countdownTimerBEnabled
		} = profile

		const byteValue = BitSmush.smushBits(
			[ [ 7, 1], [ 6, 1], [ 5, 3 ], [ 2, 2 ], [ 0, 1 ] ],
			[
				interruptAPulsedMode ? BIT_SET : BIT_UNSET,
				interruptBPulsedMode ? BIT_SET : BIT_UNSET,
				clockFrequencyValue,
				timerAControl,
				countdownTimerBEnabled ? BIT_SET : BIT_UNSET
			]
		)

		return Uint8Array.from([ byteValue ])
	}


	/**
	 * @param {TimerAFrequencyControl} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeTimerAControl(profile) {
		const { sourceClock } = profile

		const byteValue = BitSmush.smushBits(
			[ [ 2, 3 ] ],
			[ sourceClock ])

		return Uint8Array.from([ byteValue ])
	}

	/**
	 * @param {TimerBFrequencyControl} profile
	 * @returns {I2CBufferSource}
	 */
	static encodeTimerBControl(profile) {
		const { sourceClock, pulseWidth } = profile

		const byteValue = BitSmush.smushBits(
			[ [ 6, 3 ], [ 2, 3 ] ],
			[ pulseWidth, sourceClock ])

		return Uint8Array.from([ byteValue ])
	}

	/**
	 * @param {number} value
	 * @returns {I2CBufferSource}
	 */
	static encodeTimerAValue(value) {
		if(value > 255) { throw new RangeError('value greater then max') }
		if(value < 0) { throw new RangeError('value is negative') }
		return Uint8Array.from([ value ])
	}

	/**
	 * @param {number} value
	 * @returns {I2CBufferSource}
	 */
	static encodeTimerBValue(value) {
		if(value > 255) { throw new RangeError('value greater then max') }
		if(value < 0) { throw new RangeError('value is negative') }
		return Uint8Array.from([ value ])
	}
}