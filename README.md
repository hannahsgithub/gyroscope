# Clinometer

A smartphone-based digital clinometer for measuring object height. Built for SYDE 362 Project 2 — Design 3.

## How it works

The app reads the phone's tilt angle in real time using the browser's `DeviceOrientation` API. A physical sighting tube is mounted along the edge of the phone. The user looks through the tube, tilts the phone until the top of object is visible, then taps **Lock** to freeze the angle. Height is computed using:

```
H = d × tan(θ) + eye height
```

Where `d` is the horizontal distance to the object and `θ` is the locked angle.

## Setup

### Requirements

- Node.js 18+
- iPhone running Safari (Chrome on iOS blocks DeviceOrientation)
- Both your computer and phone on the same WiFi network

### Install

```bash
npm install
```

### Run

```bash
npm run dev -- --host
```

Open the **Network** URL (e.g. `https://192.168.x.x:5173`) in Safari on your iPhone. Accept the self-signed certificate warning on first load.

## Usage

1. **Measure eye height** — use the tape measure to measure the distance from the ground to your eye, enter it in the app
2. **Measure distance** — use the tape measure to measure the horizontal distance from yourself to the base of the tree, enter it in the app
3. **Aim** — hold the phone in portrait mode, look through the sighting tube at the treetop
4. **Lock** — tap Lock when aligned; height is calculated instantly
5. **Reset** — tap Reset to take another measurement
6. **History** - past measurements are saved locally

## Physical materials

| Material     | Purpose                                   | Est. cost |
| ------------ | ----------------------------------------- | --------- |
| Boba straw   | Sighting tube                             | ~$0.50    |
| Tape         | Mount sighting tube to phone              | ~$0.25    |
| Tape measure | Eye height + horizontal dist. measurement | ~$6.99    |

**Total: < $8**
