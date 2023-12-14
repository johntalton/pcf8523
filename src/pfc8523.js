import { Common } from './common.js'
import { BASE_CENTURY_Y2K } from './converter.js'

export class PCF8523 {
	#bus
	#century

	/**
	 * @param {I2CAddressedBus} bus
	*/
	static from(bus) { return new PCF8523(bus) }

	/**
	 * @param {I2CAddressedBus} bus
	*/
	constructor(bus) {
		this.#bus = bus
		this.#century = BASE_CENTURY_Y2K
	}

	async softReset() { return Common.softReset(this.#bus) }

	async getProfile() { return Common.getProfile(this.#bus) }
	async getTime(ampm_mode = false, century = BASE_CENTURY_Y2K) { return Common.getTime(this.#bus, ampm_mode, century ?? this.#century) }
	async setTime(seconds, minutes, hours, day, month, year, ampm_mode = false, century = BASE_CENTURY_Y2K) { return Common.setTime(this.#bus, seconds, minutes, hours, day, month, year) }

	async setControl3(profile) { return Common.setControl3(this.#bus, profile) }
}
