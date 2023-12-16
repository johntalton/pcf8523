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

		const capSelRaw = BitSmush.extractBits(control1, 7, 1) === 1
		const stop = BitSmush.extractBits(control1, 5, 1) === 1
		const reset = BitSmush.extractBits(control1, 4, 1) === 1
		const ampm = BitSmush.extractBits(control1, 3, 1) === 1
		const second = BitSmush.extractBits(control1, 2, 1) === 1
		const alarm = BitSmush.extractBits(control1, 1, 1) === 1
		const correction = BitSmush.extractBits(control1, 0, 1) === 1

		return {
			CAP_SEL: capSelRaw === 1 ? CAP_VALUES.TWELVE : CAP_VALUES.SEVEN,
			STOP: stop,
			RESET: reset,
			AM_PM_MODE: ampm,
			SECOND_INTERRUPT: second,
			ALARM_INTERRUPT: alarm,
			CORRECTION_INTERRUPT: correction
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
		const watchdogEnabled = BitSmush.extractBits(control2, 2, 1) === 1
		const countdownAEnabled = BitSmush.extractBits(control2, 1, 1) === 1
		const countdownBEnabled = BitSmush.extractBits(control2, 0, 1) === 1

		return {
			WATCHDOG_TIMER_A_FLAG: watchdogAFlag,
			COUNTDOWN_TIMER_A_FLAG: countdownAFlag,
			COUNTDOWN_TIMER_B_FLAG: countdownBFlag,
			SECOND_INTERRUPT_FLAG: secondFlag,
			ALARM_INTERRUPT_FLAG: alarmFlag,

			WATCHDOG_TIMER_ENABLED: watchdogEnabled,
			COUNTDOWN_TIMER_A_ENABLED: countdownAEnabled,
			COUNTDOWN_TIMER_B_ENABLED: countdownBEnabled,
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
		const batterySwitchoverEnabled = BitSmush.extractBits(control3, 1, 1) === 1
		const batteryLowEnabled = BitSmush.extractBits(control3, 0, 1) === 1

		const pmBatteryLowDetectionEnabled = !(BitSmush.extractBits(powerMode, 2, 1) === 1)
		const pmSwitchoverEnabled = !(BitSmush.extractBits(powerMode, 1, 1) === 1)
		const pmDirectSwitchingEnabled = BitSmush.extractBits(powerMode, 0, 1) === 1

		return {
			POWER_MODE_BATTERY_LOW_DETECTION_ENABLED: pmBatteryLowDetectionEnabled,
			POWER_MODE_SWITCHOVER_ENABLED: pmSwitchoverEnabled,
			POWER_MODE_DIRECT_SWITCHING_ENABLED: pmDirectSwitchingEnabled,

			BATTERY_SWITCHOVER_FLAG: batterySwitchoverFlag,
			BATTERY_STATUS_LOW: batteryLowFlag,
			BATTERY_SWITCHOVER_INTERRUPT_ENABLED: batterySwitchoverEnabled,
			BATTER_STATUS_LOW_INTERRUPT_ENABLED: batteryLowEnabled
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
		const weekdaysValue = BitSmush.extractBits(weekdaysByte, 2, 3)
		const weekday = WEEKDAYS_MAP[weekdaysValue]
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
			weekday,
			monthsValue,
			month,
			year
		}
	}

	//
	//
	//

	static encodeControl1() {}

	static encodeControl2() {}

	/** @returns ArrayBuffer  */
	static encodeControl3(profile) {
		const {
			pmBatteryLowDetectionEnabled,
			pmSwitchoverEnabled,
			pmDirectSwitchingEnabled,
			clearBatterSwitchoverFlag,
			switchoverEnabled,
			batteryLowEnabled,
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
			switchoverEnabled ? 1 : 0,
			batteryLowEnabled ? 1 : 0
		])

		// console.log({ powerMode, byteValue })

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
}