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
  Tmr_CLKOUT_ctrl: 0x0F,
  Tmr_A_freq_ctrl: 0x10,
  Tmr_A_reg: 0x11,
  Tmr_B_freq_ctrl: 0x12,
  Tmr_B_reg: 0x13,
}

export const TIME_REGISTER_START = REGISTER.SECONDS
export const TIME_REGISTER_LENGTH = 7
