import { Common } from './common.js'
import { BASE_CENTURY_Y2K } from './defs.js'

/**
 * @import { I2CAddressedBus } from '@johntalton/and-other-delights'
 */
/**
 * @import {
 *  PCF8523Options,
 *  Control1,
 *  Control2Clear,
 *  Control3Clear,
 *  Time,
 *  Alarm,
 *  TimerControl,
 *  TimerAFrequencyControl,
 *  TimerBFrequencyControl,
 *  OFFSET_MODE
 * } from './defs.js'
 */

export class PCF8523 {
	#bus
	#century
	#ampm_mode

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {PCF8523Options} [options]
	 */
	static from(bus, options) { return new PCF8523(bus, options) }

	/**
	 * @param {I2CAddressedBus} bus
	 * @param {PCF8523Options} [options]
	 */
	constructor(bus, options) {
		this.#bus = bus
		this.#century = options?.century ?? BASE_CENTURY_Y2K
		this.#ampm_mode = options?.ampm_mode ?? false
	}

	async softReset() {
		return Common.softReset(this.#bus)
	}

	async getProfile() {
		return Common.getProfile(this.#bus)
	}

	async getControl1() {
		return Common.getControl1(this.#bus)
	}

	async getControl2() {
		return Common.getControl2(this.#bus)
	}

	async getControl3() {
		return Common.getControl3(this.#bus)
	}

	/**
	 * @param {Control1} profile
	 */
	async setControl1(profile) {
		return Common.setControl1(this.#bus, profile)
	}

	/**
	 * @param {Control2Clear} profile
	 */
	async setControl2(profile) {
		return Common.setControl2(this.#bus, profile)
	}

	/**
	 * @param {Control3Clear} profile
	 */
	async setControl3(profile) {
		return Common.setControl3(this.#bus, profile)
	}

	async getTime(ampm_mode = undefined, century = undefined) {
		return Common.getTime(this.#bus, ampm_mode ?? this.#ampm_mode, century ?? this.#century)
	}

	/**
	 * @param {Time} time
	 */
	async setTime(time, ampm_mode = undefined, century = undefined) {
		return Common.setTime(this.#bus, time, ampm_mode ?? this.#ampm_mode, century ?? this.#century)
	}

	async getAlarm(ampm_mode = undefined) {
		return Common.getAlarm(this.#bus, ampm_mode ?? this.#ampm_mode)
	}

	/**
	 * @param {Alarm} profile
	 */
	async setAlarm(profile, ampm_mode = undefined) {
		return Common.setAlarm(this.#bus, profile, ampm_mode ?? this.#ampm_mode)
	}

	async getOffset() {
		return Common.getOffset(this.#bus)
	}

	/**
	 * @param {OFFSET_MODE} mode
	 * @param {number} offsetValue
	 */
	async setOffset(mode, offsetValue) {
		return Common.setOffset(this.#bus, mode, offsetValue)
	}

	async getTimer() {
		return Common.getTimer(this.#bus)
	}
	async getTimerControl() {
		return Common.getTimerControl(this.#bus)
	}
	async getTimerAControl() {
		return Common.getTimerAControl(this.#bus)
	}
	async getTimerBControl() {
		return Common.getTimerBControl(this.#bus)
	}
	async getTimerAValue() {
		return Common.getTimerAValue(this.#bus)
	}
	async getTimerBValue() {
		return Common.getTimerBValue(this.#bus)
	}

	/**
	 * @param {TimerControl} profile
	 */
	async setTimerControl(profile) {
		return Common.setTimerControl(this.#bus, profile)
	}

	/**
	 * @param {TimerAFrequencyControl} profile
	 */
	async setTimerAControl(profile) {
		return Common.setTimerAControl(this.#bus, profile)
	}

	/**
	 * @param {TimerBFrequencyControl} profile
	 */
	async setTimerBControl(profile) {
		return Common.setTimerBControl(this.#bus, profile)
	}

	/**
	 * @param {number} profile
	 */
	async setTimerAValue(profile) {
		return Common.setTimerAValue(this.#bus, profile)
	}

	/**
	 * @param {number} profile
	 */
	async setTimerBValue(profile) {
		return Common.setTimerBValue(this.#bus, profile)
	}
}
