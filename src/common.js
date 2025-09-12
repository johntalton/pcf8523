import { I2CAddressedBus } from '@johntalton/and-other-delights'
import { Converter } from './converter.js'

import { REGISTER, REGISTER_BLOCK } from './defs.js'

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
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.PROFILE.START, REGISTER_BLOCK.PROFILE.LENGTH)
		if (buffer.byteLength !== 3) { throw new Error('invalid profile length') }

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
	 */
	static async getControl1(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.CONTROL_1, 1)
		return Converter.decodeControl1(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getControl2(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.CONTROL_2, 1)
		return Converter.decodeControl2(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getControl3(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.CONTROL_3, 1)
		return Converter.decodeControl3(buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async setControl1(bus, profile) {
		const buffer = Converter.encodeControl1(profile)
		return bus.writeI2cBlock(REGISTER.CONTROL_1, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async setControl2(bus, profile) {
		const buffer = Converter.encodeControl2(profile)
		return bus.writeI2cBlock(REGISTER.CONTROL_2, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async setControl3(bus, profile) {
		const buffer = Converter.encodeControl3(profile)
		return bus.writeI2cBlock(REGISTER.CONTROL_3, buffer)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getTime(bus, ampm_mode, baseDecade) {
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.TIME.START, REGISTER_BLOCK.TIME.LENGTH)
		return Converter.decodeTime(buffer, ampm_mode, baseDecade)
	}

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async setTime(bus, seconds, minutes, hours, day, month, year, ampm_mode, century) {
		const buffer = Converter.encodeTime(seconds, minutes, hours, day, month, year, ampm_mode, century)
		return bus.writeI2cBlock(REGISTER_BLOCK.TIME.START, buffer)
	}


	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getAlarm(bus, ampm_mode) {
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.ALARM.START, REGISTER_BLOCK.ALARM.LENGTH)
		return Converter.decodeAlarm(buffer, ampm_mode)
	}

	static async setAlarm(bus, profile) {
		throw new Error('not implemented')
	}

	/** @param {I2CAddressedBus} bus */
	static async getOffset(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.OFFSET, 1)
		return Converter.decodeOffset(buffer)
	}

	/** @param {I2CAddressedBus} bus */
	static async setOffset(bus, profile) {
		throw new Error('not implemented')
	}

	/** @param {I2CAddressedBus} bus */
	static async getTimer(bus) {
		const buffer = await bus.readI2cBlock(REGISTER_BLOCK.TIMER.START, REGISTER_BLOCK.TIMER.LENGTH)
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		return {
			...Converter.decodeTimerControl(u8.subarray(0, 1)),
			...Converter.decodeTimerAControl(u8.subarray(1, 2)),
			...Converter.decodeTimerBControl(u8.subarray(2, 3)),
			...Converter.decodeTimerAValue(u8.subarray(3, 4)),
			...Converter.decodeTimerBValue(u8.subarray(4, 5))
		}
	}

	/** @param {I2CAddressedBus} bus */
	static async getTimerControl(bus, profile) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_CLOCK_OUT_CONTROL, 1)
		return Converter.decodeTimerControl(buffer)
	}

	/** @param {I2CAddressedBus} bus */
	static async getTimerAControl(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_A_FREQ_CONTROL, 1)
		return Converter.decodeTimerAControl(buffer)
	}

	/** @param {I2CAddressedBus} bus */
	static async getTimerBControl(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_B_FREQ_CONTROL, 1)
		return Converter.decodeTimerBControl(buffer)
	}

	/** @param {I2CAddressedBus} bus */
	static async getTimerAValue(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_A_REG, 1)
		return Converter.decodeTimerAValue(buffer)
	}

	/** @param {I2CAddressedBus} bus */
	static async getTimerBValue(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.TIMER_B_REG, 1)
		return Converter.decodeTimerBValue(buffer)
	}

	/** @param {I2CAddressedBus} bus */
	static async setTimerControl(bus, profile) {
		throw new Error('not implemented')
	}

	/** @param {I2CAddressedBus} bus */
	static async setTimerAControl(bus, profile) {
		throw new Error('not implemented')
	}

	/** @param {I2CAddressedBus} bus */
	static async setTimerBControl(bus, profile) {
		throw new Error('not implemented')
	}

	/** @param {I2CAddressedBus} bus */
	static async setTimerAValue(bus, profile) {
		throw new Error('not implemented')
	}

	/** @param {I2CAddressedBus} bus */
	static async setTimerBValue(bus, profile) {
		throw new Error('not implemented')
	}



}