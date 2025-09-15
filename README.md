# pcf8523 (Real Time Clock)

Like many other chips, the PCF8523 packs a range of addition features and flags.

# Usage

Basic mode and usage is around setting and retrieving the clocks time value. This is of extended value when used with the chips Battery circuitry (which need to be enabled to work in "off line" mode).

Additionally, the chip provides several timers, which can, when enabled, feed the physical interrupt pin(s).  With the addition of several variation and periods, many unique combination of interrupt events can be driven from this single chip.

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
const device = PCF8523.from(abus)

/*
... stop oscillator and set power mode
*/

const now = new Date(Date.now())

// this shows explicitly conversion of date, could use helper
// const time = encodeTimeFromDate(now)
await device.setTime({
    seconds: now.getUTCSeconds(),
    minutes: now.getUTCMinutes(),
    hours: now.getUTCHours(),

    day: now.getUTCDate(),
    month: now.getUTCMonth() + 1,
    year4digit: now.getUTCFullYear()
  },
  ampm_mode: false,
  century: BASE_CENTURY_Y2K
)

/*
... start oscillator
*/
```

## Update Control 1 Register (Stop Oscillator)

```typescript
const device = PCF8523.from(/* ... see basic example */)

/* note:
  these two calls are likely not transaction on the underlying
  bus implementation this can be of particular interest for Worker threads
  and when using async with multiple devices, or clients controlling
  the same device (even when a single event-loop)

  however, this works for 99% of people 🤷🏻‍♂️
  */
const current = await device.getControl1()
await device.setControl1({
  ...current,
  stop: true
})

```

## Setting Power Mode
```typescript
const device = PCF8523.from(/* ... see basic example */)

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

As per the datasheet this is the list of all things that can be enabled and generate an interrupt(1):
- Second timer
- Timer A
- Timer B
- Alarm
- Battery switch-over
- Battery low detection
- Clock offset correction pulse

The second interrupt (for chips that have that pin) can be generated only from Timer B