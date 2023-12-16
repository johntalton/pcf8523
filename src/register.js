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

	// CLOCKOUT and timer registers
	TIMER_CLOCK_OUT_CONTROL: 0x0F,
	TIMER_A_FREQ_CONTROL: 0x10,
	TIMER_A_REG: 0x11,
	TIMER_B_FREQ_CONTROL: 0x12,
	TIMER_B_REG: 0x13,
}

export const REGISTER_BLOCK = {
	TIME: {
		START: REGISTER.SECONDS,
		LENGTH: 7
	},
	ALARM: {
		START: REGISTER.MINUTE_ALARM,
		LENGTH: 4
	},
	TIMER: {
		START: REGISTER.TIMER_CLOCK_OUT_CONTROL,
		LENGTH: 5
	}
}
