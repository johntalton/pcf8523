import { I2CAddressedBus } from '@johntalton/and-other-delights'
import { Converter } from './converter.js'

import {
	BYTE_LENGTH_ONE,
	REGISTER,
	REGISTER_BLOCK,
	RESET_MAGIC_VALUE } from './defs.js'

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
 *  Timer,
 *  AlarmMinute,
 *  AlarmHour,
 *  AlarmDay,
 *  AlarmWeekday,
 *  Alarm,
 *  OFFSET_MODE
 * } from './defs.js'
 */


export class Common {
	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async softReset(bus) {
		await bus.writeI2cBlock(REGISTER.CONTROL_1, Uint8Array.from([ RESET_MAGIC_VALUE ]))
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getProfile(bus) {
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.PROFILE.START, REGISTER_BLOCK.PROFILE.LENGTH)
		if (buffer.byteLength < REGISTER_BLOCK.PROFILE.LENGTH) { throw new Error('invalid profile length') }

		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const control1 = Converter.decodeControl1(u8.subarray(0))
		const control2 = Converter.decodeControl2(u8.subarray(1))
		const control3 = Converter.decodeControl3(u8.subarray(2))

		return {
			...control1,
			...control2,
			...control3
		}
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<Control1>}
	 */
	static async getControl1(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.CONTROL_1, BYTE_LENGTH_ONE)
		return Converter.decodeControl1(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<Control2>}
	 */
	static async getControl2(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.CONTROL_2, BYTE_LENGTH_ONE)
		return Converter.decodeControl2(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<Control3>}
	 */
	static async getControl3(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.CONTROL_3, BYTE_LENGTH_ONE)
		return Converter.decodeControl3(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {Control1} profile
	 */
	static async setControl1(bus, profile) {
		const buffer = Converter.encodeControl1(profile)
		await bus.writeI2cBlock(REGISTER.CONTROL_1, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {Control2Clear} profile
	 */
	static async setControl2(bus, profile) {
		const buffer = Converter.encodeControl2(profile)
		await bus.writeI2cBlock(REGISTER.CONTROL_2, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {Control3Clear} profile
	 */
	static async setControl3(bus, profile) {
		const buffer = Converter.encodeControl3(profile)
		await bus.writeI2cBlock(REGISTER.CONTROL_3, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {boolean} ampm_mode
	 * @param {number} century
	 * @returns {Promise<Time>}
	 */
	static async getTime(bus, ampm_mode, century) {
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.TIME.START, REGISTER_BLOCK.TIME.LENGTH)
		return Converter.decodeTime(buffer, ampm_mode, century)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {CoreTime} time
	 * @param {boolean} ampm_mode
	 * @param {number} century
	 */
	static async setTime(bus, time, ampm_mode, century) {
		const buffer = Converter.encodeTime(time, ampm_mode, century)
		await bus.writeI2cBlock(REGISTER_BLOCK.TIME.START, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {boolean} ampm_mode
	 * @returns {Promise<Alarm>}
	 */
	static async getAlarm(bus, ampm_mode) {
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.ALARM.START, REGISTER_BLOCK.ALARM.LENGTH)
		return Converter.decodeAlarm(buffer, ampm_mode)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {Alarm} alarm
	 * @param {boolean} ampm_mode
	 */
	static async setAlarm(bus, alarm, ampm_mode) {
		const buffer = Converter.encodeAlarm(alarm, ampm_mode)
		await bus.writeI2cBlock(REGISTER_BLOCK.ALARM.START, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<Offset>}
	 */
	static async getOffset(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.OFFSET, BYTE_LENGTH_ONE)
		return Converter.decodeOffset(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {OFFSET_MODE} mode
	 * @param {number} offsetValue
	*/
	static async setOffset(bus, mode, offsetValue) {
		const buffer = Converter.encodeOffset(mode, offsetValue)
		await bus.writeI2cBlock(REGISTER.OFFSET, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<Timer>}
	 */
	static async getTimer(bus) {
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.TIMER.START, REGISTER_BLOCK.TIMER.LENGTH)
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		return {
			...Converter.decodeTimerControl(u8.subarray(0, 1)),
			...Converter.decodeTimerAControl(u8.subarray(1, 2)),
			...Converter.decodeTimerBControl(u8.subarray(2, 3)),
			timerAValue: Converter.decodeTimerAValue(u8.subarray(3, 4)),
			timerBValue: Converter.decodeTimerBValue(u8.subarray(4, 5))
		}
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<TimerControl>}
	 */
	static async getTimerControl(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_CLOCK_OUT_CONTROL, BYTE_LENGTH_ONE)
		return Converter.decodeTimerControl(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<TimerAFrequencyControl>}
	 */
	static async getTimerAControl(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_A_FREQ_CONTROL, BYTE_LENGTH_ONE)
		return Converter.decodeTimerAControl(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<TimerBFrequencyControl>}
	 */
	static async getTimerBControl(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_B_FREQ_CONTROL, BYTE_LENGTH_ONE)
		return Converter.decodeTimerBControl(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<number>}
	 */
	static async getTimerAValue(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_A_REG, BYTE_LENGTH_ONE)
		return Converter.decodeTimerAValue(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @returns {Promise<number>}
	 */
	static async getTimerBValue(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_B_REG, BYTE_LENGTH_ONE)
		return Converter.decodeTimerBValue(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {TimerControl} profile
	 */
	static async setTimerControl(bus, profile) {
		throw new Error('not implemented')
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {TimerAFrequencyControl} profile
	 */
	static async setTimerAControl(bus, profile) {
		const buffer = Converter.encodeTimerAControl(profile)
		await bus.writeI2cBlock(REGISTER.TIMER_A_FREQ_CONTROL, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {TimerBFrequencyControl} profile
	 */
	static async setTimerBControl(bus, profile) {
		const buffer = Converter.encodeTimerBControl(profile)
		await bus.writeI2cBlock(REGISTER.TIMER_B_FREQ_CONTROL, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {number} value
	 */
	static async setTimerAValue(bus, value) {
		const buffer = Converter.encodeTimerAValue(value)
		await bus.writeI2cBlock(REGISTER.TIMER_A_REG, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {number} value
	 */
	static async setTimerBValue(bus, value) {
		const buffer = Converter.encodeTimerBValue(value)
		await bus.writeI2cBlock(REGISTER.TIMER_B_REG, buffer)
	}
}