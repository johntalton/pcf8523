import { Common, BASE_CENTURY_Y2K } from './common.js'
export { BASE_CENTURY_Y2K } from './common.js'

export class PCF8523 {
	#bus

	/**
	 * @param {I2CAddressedBus} bus
	*/
	static from(bus) { return new PCF8523(bus) }

	/**
	 * @param {I2CAddressedBus} bus
	*/
	constructor(bus) {
		this.#bus = bus
		this.century = BASE_CENTURY_Y2K
	}

	async softReset() { return Common.softReset(bus) }

	async getProfile() { return Common.getProfile(this.#bus) }
	async getTime() { return Common.getTime(this.#bus, false, this.century) }
	async setTime() { return Common.setTime(this.#bus) }

	async setControl3(profile) { return Common.setControl3(this.#bus, profile) }
}
