import { I2CAddressedBus } from '@johntalton/and-other-delights'
import { BitSmush } from '@johntalton/bitsmush'

import { REGISTER, TIME_REGISTER_START, TIME_REGISTER_LENGTH } from './register.js'

export const BASE_CENTURY_Y2K = 2000

export const RESET_MAGIC_VALUE = 0x58

export class Common {
	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async softReset(bus) {
		return bus.writeI2cBlock(REGISTER.CONTROL_1, Uint8Array.from([ RESET_MAGIC_VALUE ]))
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getProfile(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.CONTROL_1, 3)

		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer, buffer.byteOffset, buffer.byteLength)

		if (u8.byteLength !== 3) { throw new Error('invalid profile length') }

		const [ control1, control2, control3 ] = u8

		console.log({ control1, control2, control3 })

		const capSelRaw = BitSmush.extractBits(control1, 7, 1) === 1
		const stop = BitSmush.extractBits(control1, 5, 1) === 1
		const reset = BitSmush.extractBits(control1, 4, 1) === 1
		const ampm = BitSmush.extractBits(control1, 3, 1) === 1
		const second = BitSmush.extractBits(control1, 2, 1) === 1
		const alarm = BitSmush.extractBits(control1, 1, 1) === 1
		const correction = BitSmush.extractBits(control1, 0, 1) === 1

		const watchdogAFlag = BitSmush.extractBits(control2, 7, 1) === 1
		const countdownAFlag = BitSmush.extractBits(control2, 6, 1) === 1
		const countdownBFlag = BitSmush.extractBits(control2, 5, 1) === 1
		const secondFlag = BitSmush.extractBits(control2, 4, 1) === 1
		const alarmFlag = BitSmush.extractBits(control2, 3, 1) === 1
		const watchdogEnabled = BitSmush.extractBits(control2, 2, 1) === 1
		const countdownAEnabled = BitSmush.extractBits(control2, 1, 1) === 1
		const countdownBEnabled = BitSmush.extractBits(control2, 0, 1) === 1

		const powerMode = BitSmush.extractBits(control3, 7, 3)
		const batterySwitchoverFlag = BitSmush.extractBits(control3, 3, 1) === 1
		const batteryLowFlag = BitSmush.extractBits(control3, 2, 1) === 1
		const batterySwitchoverEnabled = BitSmush.extractBits(control3, 1, 1) === 1
		const batteryLowEnabled = BitSmush.extractBits(control3, 0, 1) === 1

		const pmBatteryLowDetectionEnabled = !(BitSmush.extractBits(powerMode, 2, 1) === 1)
		const pmSwitchoverEnabled = !(BitSmush.extractBits(powerMode, 1, 1) === 1)
		const pmDirectSwitchingEnabled = BitSmush.extractBits(powerMode, 0, 1) === 1

		return {
			// control 1
			CAP_SEL: capSelRaw === 1 ? '12.5pF' : '7pF',
			STOP: stop,
			RESET: reset,
			AM_PM_MODE: ampm,
			SECOND_INTERRUPT: second,
			ALARM_INTERRUPT: alarm,
			CORRECTION_INTERRUPT: correction,

			// control 2
			WATCHDOG_TIMER_A_FLAG: watchdogAFlag,
			COUNTDOWN_TIMER_A_FLAG: countdownAFlag,
			COUNTDOWN_TIMER_B_FLAG: countdownBFlag,
			SECOND_INTERRUPT_FLAG: secondFlag,
			ALARM_INTERRUPT_FLAG: alarmFlag,

			WATCHDOG_TIMER_ENABLED: watchdogEnabled,
			COUNTDOWN_TIMER_A_ENABLED: countdownAEnabled,
			COUNTDOWN_TIMER_B_ENABLED: countdownBEnabled,

			// control 3
			POWER_MODE_BATTERY_LOW_DETECTION_ENABLED: pmBatteryLowDetectionEnabled,
			POWER_MODE_SWITCHOVER_ENABLED: pmSwitchoverEnabled,
			POWER_MODE_DIRECT_SWITCHING_ENABLED: pmDirectSwitchingEnabled,

			BATTERY_SWITCHOVER_FLAG: batterySwitchoverFlag,
			BATTERY_STATUS_LOW: batteryLowFlag,
			BATTERY_SWITCHOVER_INTERRUPT_ENABLED: batterySwitchoverEnabled,
			BATTER_STATUS_LOW_INTERRUPT_ENABLED: batteryLowEnabled
		}
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async setControl3(bus, profile) {
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

		console.log({ powerMode, byteValue })

		const buffer = Uint8Array.from([ byteValue ])

		return bus.writeI2cBlock(REGISTER.CONTROL_3, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getTime(bus, ampm_mode = false, baseDecade = BASE_CENTURY_Y2K) {
		const buffer = await bus.readI2cBlock(TIME_REGISTER_START, TIME_REGISTER_LENGTH)

		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer, buffer.byteOffset, buffer.byteLength)

		if (u8.byteLength !== TIME_REGISTER_LENGTH) { throw new Error('invalid time length') }

		console.log(u8)
		const [
			secondsByte,
			minutesByte,
			hoursByte,
			daysByte,
			weekdaysByte,
			monthsByte,
			yearsByte
		] = u8

		function bcd(value, tensPos, tensLen, unitsPos, unitsLen) {
			//return value - 6 * (value >> 4)
			return 10 * BitSmush.extractBits(value, tensPos, tensLen) +
				BitSmush.extractBits(value, unitsPos, unitsLen)
		}

		const integrity = BitSmush.extractBits(secondsByte, 7, 1) === 0
		const second = bcd(secondsByte, 6, 3, 3, 4)
		const minute = bcd(minutesByte, 6, 3, 3, 4)
		const hour = ampm_mode ?
			bcd(hoursByte, 4, 1, 3, 4) :
			bcd(hoursByte, 5, 2, 3, 4)
		const pm = ampm_mode ? BitSmush.extractBits(hoursByte, 7, 1) === 1 : undefined
		const day = bcd(daysByte, 5, 2, 3, 4)
		const weekdaysValue = BitSmush.extractBits(weekdaysByte, 2, 3)
		const WEEKDAYS_MAP = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		]
		const weekday = WEEKDAYS_MAP[weekdaysValue]
		const monthsValue = bcd(monthsByte, 4, 1, 3, 4)
		const MONTHS_MAP = [
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
		const month = MONTHS_MAP[monthsValue - 1]
		const year = baseDecade + bcd(yearsByte, 7, 4, 3, 4)

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

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async setTime(bus, seconds, minutes, hours, century = BASE_CENTURY_Y2K) {
		const buffer = new Uint8Array(TIME_REGISTER_LENGTH)

		function bcd(value, tensPos, tensLen, unitsPos, unitsLen) {
			return value + 6 * Math.floor(value / 10)
		}

		const year = 2023 - century

		buffer[0] = bcd(0)
		buffer[1] = bcd(20)
		buffer[2] = bcd(15)
		buffer[3] = bcd(13)
		buffer[4] = bcd(3)
		buffer[5] = bcd(12)
		buffer[6] = bcd(year)

		return bus.writeI2cBlock(TIME_REGISTER_START, buffer)
	}
}