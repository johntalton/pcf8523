
/**
 * @typedef {Object} PCF8523Options
 * @property {number} [century]
 * @property {boolean} [ampm_mode]
 */

export const CAP_MAP = [
	'7pF',
	'12.5pF'
]

/** @enum {string} */
export const CAP_VALUES = {
	SEVEN: CAP_MAP[0],
	TWELVE: CAP_MAP[1]
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

/** @enum {number} */
export const OFFSET_MODE = {
	ONCE_EVERY_TWO_HOURS: 0,
	ONCE_EVERY_MINUTE: 1
}

/** @enum {number} */
export const TIMER_A_CONTROL = {
	DISABLED: 0b00,
	COUNTDOWN: 0b01,
	WATCHDOG: 0b10,
	DISABLED_ALT: 0b11
}

/** @enum {number} */
export const TIMER_CLOCK_FREQUENCY = {
	FREQUENCY_32768: 0b000, //
	FREQUENCY_16384: 0b001, //
	FREQUENCY_8192: 0b010, //
	FREQUENCY_4096: 0b011, //  high-Z
	FREQUENCY_1024: 0b100, //  high-Z
	FREQUENCY_32: 0b101, //  high-Z
	FREQUENCY_1: 0b110, //  high-Z
	FREQUENCY_DISABLED: 0b111, //  (high-Z)
}

/** @enum {number} */
export const TIMER_AB_SOURCE_CLOCK = {
	SOURCE_4_KZ: 0b000, // 4.096 kHz
	SOURCE_64_HZ: 0b001, // 64 Hz
	SOURCE_1_HZ: 0b010, // 1 Hz
	SOURCE_1_60_HZ: 0b011, // 1⁄60 Hz
	SOURCE_1_3600_HZ: 0b111, // 1⁄3600 Hz
	SOURCE_1_3600__ALT_1_HZ: 0b110,
	SOURCE_1_3600__ALT_2_HZ: 0b100
}

/** @enum {number} */
export const SOURCE_CLOCK_VALUE_HZ_MAP = {
	[TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ]: 4.096 * 1000,
	[TIMER_AB_SOURCE_CLOCK.SOURCE_64_HZ]: 64,
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_HZ]: 1,
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_60_HZ]: 1 / 60,
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600_HZ]: 1 / 3600,
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600__ALT_1_HZ]: 1 / 3600,
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600__ALT_2_HZ]: 1 / 3600
}

/** @enum {string[]} */
export const SOURCE_CLOCK_PREFERRED_UNIT_MAP = {
	[TIMER_AB_SOURCE_CLOCK.SOURCE_4_KZ]: [ 'microseconds', 'milliseconds' ],
	[TIMER_AB_SOURCE_CLOCK.SOURCE_64_HZ]: [ 'milliseconds', 'seconds' ],
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_HZ]: [ 'seconds' ],
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_60_HZ]: [ 'minutes' ],
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600_HZ]: [ 'hours' ],
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600__ALT_1_HZ]: [ 'hours' ],
	[TIMER_AB_SOURCE_CLOCK.SOURCE_1_3600__ALT_2_HZ]: [ 'hours' ]
}


/** @enum {number} */
export const TIMER_B_PULSE_WIDTH = {
	WIDTH_46_875_MS: 0b000, //[1] 46.875 ms
	WIDTH_62_500_MS: 0b001, // 62.500 ms
	WIDTH_78_125_MS: 0b010, // 78.125 ms
	WIDTH_93_750_MS: 0b011, // 93.750 ms
	WIDTH_125_00_MS: 0b100, // 125.000 ms
	WIDTH_156_25_MS: 0b101, // 156.250 ms
	WIDTH_187_50_MS: 0b110, // 187.500 ms
	WIDTH_218_75_MS: 0b111, // 218.750 ms
}

/**
 * @typedef {Object} Control1
 * @property {CAP_VALUES} capacitorSelection
 * @property {boolean} stop
 * @property {boolean} ampm
 * @property {boolean} secondInterruptEnabled
 * @property {boolean} alarmInterruptEnabled
 * @property {boolean} correctionInterruptEnabled
 */

/**
 * @typedef {Object} Control2Flags
 * @property {boolean} watchdogAFlag
 * @property {boolean} countdownAFlag
 * @property {boolean} countdownBFlag
 * @property {boolean} secondFlag
 * @property {boolean} alarmFlag
 */

/**
 * @typedef {Object} Control2ClearFlags
 * @property {boolean} [clearCountdownAFlag = false]
 * @property {boolean} [clearCountdownBFlag = false]
 * @property {boolean} [clearSecondFlag = false]
 * @property {boolean} [clearAlarmFlag = false]
 */

/**
 * @typedef {Object} Control2Enablement
 * @property {boolean} watchdogAInterruptEnabled
 * @property {boolean} countdownAInterruptEnabled
 * @property {boolean} countdownBInterruptEnabled
 */

/**
 * @typedef {Control2Flags & Control2Enablement} Control2
 */

/**
 * @typedef {Control2ClearFlags & Control2Enablement} Control2Clear
 */

/**
 * @typedef {Object} Control3Flags
 * @property {boolean} batterySwitchoverFlag
 * @property {boolean} batteryLowFlag
 */

/**
 * @typedef {Object} Control3ClearFlags
 * @property {boolean} [clearBatterySwitchoverFlag = false]
 */

/**
 * @typedef {Object} Control3Enablement
 * @property {boolean} pmBatteryLowDetectionEnabled
 * @property {boolean} pmSwitchoverEnabled
 * @property {boolean} [pmDirectSwitchingEnabled]
 * @property {boolean} batterySwitchoverInterruptEnabled
 * @property {boolean} batteryLowInterruptEnabled
 */

/**
 * @typedef {Control3Flags & Control3Enablement} Control3
 */

/**
 * @typedef {Control3ClearFlags & Control3Enablement} Control3Clear
 */

/**
 * @typedef {Object} CoreTime
 * @property {number} second
 * @property {number} minute
 * @property {number} hour
 * @property {boolean} [pm]
 * @property {number} day
 * @property {number} weekdayValue
 * @property {number} monthsValue
 * @property {number} year4digit
 */

/**
 * @typedef {Object} TimeExtended
 * @property {boolean} integrity
 * @property {number} hour24
 * @property {string} weekday
 * @property {string} month
*/

/**
 * @typedef {CoreTime & TimeExtended} Time
 */

/**
 * @typedef {Object} Offset
 * @property {OFFSET_MODE} mode
 * @property {number} offsetValue
 * @property {number} offsetPPM
 */

/**
 * @typedef {Object} TimerControl
 * @property {boolean} interruptAPulsedMode
 * @property {boolean} interruptBPulsedMode
 * @property {TIMER_CLOCK_FREQUENCY} clockFrequencyValue
 * @property {TIMER_A_CONTROL} timerAControl
 * @property {boolean} countdownTimerBEnabled
 */

/**
 * @typedef {Object} TimerAFrequencyControl
 * @property {TIMER_AB_SOURCE_CLOCK} sourceClock
 */

/**
 * @typedef {Object} TimerBFrequencyControl
 * @property {TIMER_AB_SOURCE_CLOCK} sourceClock
 * @property {TIMER_B_PULSE_WIDTH} pulseWidth
 */

/**
 * @typedef  {Object} TimerExtension
 * @property {number} timerAValue
 * @property {number} timerBValue
 */

/**
 * @typedef {TimerControl & TimerAFrequencyControl & TimerBFrequencyControl & TimerExtension} Timer
 */



/**
 * @typedef {Object} AlarmMinute
 * @property {boolean} minuteEnabled
 * @property {number} minute
 */

/**
 * @typedef {Object} AlarmHour
 * @property {boolean} hourEnabled
 * @property {boolean} [pm]
 * @property {number} hour
 */

/**
 * @typedef {Object} AlarmHourMetadata
* @property {number} [hour24]
 */

/**
 * @typedef {AlarmHour & AlarmHourMetadata} AlarmHourExtended
 */

/**
 * @typedef {Object} AlarmDay
 * @property {boolean} dayEnabled
 * @property {number} day
 */

/**
 * @typedef {Object} AlarmWeekday
 * @property {boolean} weekdayEnabled
 * @property {number} weekdayValue
 */

/**
 * @typedef AlarmWeekdayExtended
* @property {WEEKDAYS_MAP} weekday
 */

/**
 * @typedef {AlarmMinute & AlarmHour & AlarmDay & AlarmWeekday} Alarm
 */

export const OFFSET_LSB_PPM = {
	MODE_0: 4.34,
	MODE_1: 4.069
}

export const UN_ALLOWED_POWER_MODE = 0b110

export const PM_SET_BIT = 0b0010_0000
export const OS_MASK = 0x80
export const SECONDS_MASK = 0x7F // ~OS_MASK

export const SEVEN_BIT_MASK = 0b0111_1111
export const SIGN_MASK = 0b0100_0000

export const HOUR_OFFSET_FOR_PM = 12

export const DEFAULT_PCF8523_ADDRESS = 0x68

export const RESET_MAGIC_VALUE = 0x58
export const BASE_CENTURY_Y2K = 2000

export const BIT_SET = 1
export const BIT_UNSET = 0

export const BYTE_LENGTH_ONE = 1
export const BYTE_LENGTH_TIME = 7
export const BYTE_LENGTH_ALARM = 4

export const REGISTER = {
	// Control
	CONTROL_1: 0x00,
	CONTROL_2: 0x01,
	CONTROL_3: 0x02,

	// Time and Date
	SECONDS: 0x03,
	MINUTES: 0x04,
	HOURS: 0x05,
	DAYS: 0x06,
	WEEKDAYS: 0x07,
	MONTHS: 0x08,
	YEARS: 0x09,

	// Alarm registers
	MINUTE_ALARM: 0x0A,
	HOUR_ALARM: 0x0B,
	DAY_ALARM: 0x0C,
	WEEKDAY_ALARM: 0x0D,

	// Offset register
	OFFSET: 0x0E,

	// Clock Out and timer registers
	TIMER_CLOCK_OUT_CONTROL: 0x0F,
	TIMER_A_FREQ_CONTROL: 0x10,
	TIMER_A_REG: 0x11,
	TIMER_B_FREQ_CONTROL: 0x12,
	TIMER_B_REG: 0x13,
}

export const REGISTER_BLOCK = {
	PROFILE: {
		START: REGISTER.CONTROL_1,
		LENGTH: 3
	},
	TIME: {
		START: REGISTER.SECONDS,
		LENGTH: BYTE_LENGTH_TIME
	},
	ALARM: {
		START: REGISTER.MINUTE_ALARM,
		LENGTH: BYTE_LENGTH_ALARM
	},
	TIMER: {
		START: REGISTER.TIMER_CLOCK_OUT_CONTROL,
		LENGTH: 5
	}
}
