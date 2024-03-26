import { Common } from './common.js'
import { BASE_CENTURY_Y2K } from './converter.js'

export const DEFAULT_PCF8523_ADDRESS = 0x68

export class PCF8523 {
	#bus
	#century

	/** @param {I2CAddressedBus} bus */
	static from(bus) { return new PCF8523(bus) }

	/** @param {I2CAddressedBus} bus */
	constructor(bus) {
		this.#bus = bus
		this.#century = BASE_CENTURY_Y2K
	}

	async softReset() { return Common.softReset(this.#bus) }

	async getProfile() { return Common.getProfile(this.#bus) }

	async getControl1() { return Common.getControl1(this.#bus) }
	async getControl2() { return Common.getControl2(this.#bus) }
	async getControl3() { return Common.getControl3(this.#bus) }

	async setControl1(profile) { return Common.setControl1(this.#bus, profile) }
	async setControl2(profile) { return Common.setControl2(this.#bus, profile) }
	async setControl3(profile) { return Common.setControl3(this.#bus, profile) }

	async getTime(ampm_mode = false, century) { return Common.getTime(this.#bus, ampm_mode, century ?? this.#century) }
	async setTime(seconds, minutes, hours, day, month, year, ampm_mode = false, century) {
		return Common.setTime(this.#bus, seconds, minutes, hours, day, month, year, ampm_mode, century ?? this.#century)
	}

	async getAlarm() { return Common.getAlarm(this.#bus) }
	async setAlarm(profile) { return Common.setAlarm(this.#bus, profile) }

	async getOffset() { return Common.getOffset(this.#bus) }
	async setOffset(profile) { return Common.setOffset(this.#bus, profile) }

	async getTimer() { return Common.getTimer(this.#bus) }
	async getTimerControl() { return Common.getTimerControl(this.#bus) }
	async getTimerAControl() { return Common.getTimerAControl(this.#bus) }
	async getTimerBControl() { return Common.getTimerBControl(this.#bus) }
	async getTimerAValue() { return Common.getTimerAValue(this.#bus) }
	async getTimerBValue() { return Common.getTimerBValue(this.#bus) }

	async setTimerControl(profile) { return Common.setTimerControl(this.#bus, profile) }
	async setTimerAControl(profile) { return Common.setTimerAControl(this.#bus, profile) }
	async setTimerBControl(profile) { return Common.setTimerBControl(this.#bus, profile) }
	async setTimerAValue(profile) { return Common.setTimerAValue(this.#bus, profile) }
	async setTimerBValue(profile) { return Common.setTimerBValue(this.#bus, profile) }
}
