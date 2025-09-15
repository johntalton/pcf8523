# pcf8523 (Real Time Clock)

Feature rich Real Time Clock including Alarm and Timers.


[![npm Version](https://img.shields.io/npm/v/@johntalton/pcf8523.svg)](https://www.npmjs.com/package/@johntalton/pcf8523)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/pcf8523)
[![CI](https://github.com/johntalton/pcf8523/actions/workflows/CI.yml/badge.svg)](https://github.com/johntalton/pcf8523/actions/workflows/CI.yml)


# Examples
## Basic Time

Using the legacy `Date` object, the time can be set.

Note however, without enabling the proper Power Mode (aka, switch to battery when off line) this will only keep time while on main power.

It is also "recommended" to start/stop the oscillator when changing time (as well as most other time related parameters of the chip).

```typescript
import { I2CAddressedBus, I2CBus } from '@johntalton/and-other-delights'
import {
  PCF8523,
  DEFAULT_PCF8523_ADDRESS,
  BASE_CENTURY_Y2K
} from '@johntalton/pcf8523'

const bus:I2CBus = /* ... */
const abus = new I2CAddressedBus(bus, DEFAULT_PCF8523_ADDRESS)
const device = new PCF8523(abus)

// should we store the clock using 24 hour or 12 hour
const ampm_mode = false // 24-hour

// the chip only stores last 2 digits, using this as the base
const century = BASE_CENTURY_Y2K

// get some time ...
const now = new Date(Date.now())

// the time can be manually constructed, here we use a helper
const time = encodeTimeFromDate(now)
await device.setTime(time, ampm_mode, century)
```

## Update Control 1 Register (Stop Oscillator)

```typescript
const device = new PCF8523(/* ... see basic example */)

// fetch current control and then set with override value
const current = await device.getControl1()
await device.setControl1({
  ...current,
  stop: true
})
```

## Setting Power Mode
```typescript
const device = new PCF8523(/* ... see basic example */)

await device.setControl3({
  // enable power switchover mode (this enable fallback to battery)
  // use standard mode
  pmSwitchoverEnabled: true,
  pmDirectSwitchingEnabled: false,

  // enable detection of low battery events (see interrupt enable bellow trigger)
  pmBatteryLowDetectionEnabled: true,

  clearBatterSwitchoverFlag: true, // clear any existing switchover events

  // enable both battery events to trigger an interrupt
  batterySwitchoverInterruptEnabled: true,
  batteryLowInterruptEnabled: true,
})
```

# Interrupts

Support for multiple types of interrupts are supported.  Note that this is independent of the Flags set (control 2 and 3).  While multiple flags can be set, the chip has the ability to optionally expose those to the INT pin.

The Clock need to be disabled for interrupt pin to be valid.

The Second interrupt Flag will also only be enabled when the interrupt itself is enabled.

- Timer A
- Timer B
- Alarm
- Second timer
- Battery switch-over
- Battery low detection
- Clock offset correction pulse

