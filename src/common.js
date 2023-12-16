import { I2CAddressedBus } from '@johntalton/and-other-delights'
import { Converter } from './converter.js'

import { REGISTER, REGISTER_BLOCK } from './register.js'

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
		if (buffer.byteLength !== 3) { throw new Error('invalid profile length') }

		const control1 = Converter.decodeControl1(new DataView(buffer, 0, 1))
		const control2 = Converter.decodeControl2(new DataView(buffer, 1, 1))
		const control3 = Converter.decodeControl3(new DataView(buffer, 2, 1))

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

	/**
	 * @param {I2CAddressedBus} bus
	 */
	static async getOffset(bus) {
		const buffer = await bus.readI2cBlock(REGISTER.OFFSET, 1)
		return Converter.decodeOffset(buffer)
	}
}