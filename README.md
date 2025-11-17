# Whoosh Designer

A professional in-browser tool for designing, auditioning, and rendering cinematic whoosh sound effects using the Web Audio API.

## Features

- **Multi-layer sound design** - Combine up to 3 layers of oscillators and noise generators
- **Real-time preview** - Hear your changes instantly
- **Advanced controls** - Envelope shaping (Attack/Hold/Decay), pitch sweeps, panning, and volume per layer
- **Global effects** - Master duration, volume, high-pass/low-pass filters, and reverb
- **Preset system** - Quick-start templates for common whoosh types
- **Export to WAV** - Render and download your designs as high-quality 48kHz audio files
- **Browser-based** - No installation required, runs entirely in your browser

## Live Demo

Try it out: [https://workmanl.github.io/whoosh-designer/](https://workmanl.github.io/whoosh-designer/)

## Local Development

### Prerequisites
- Node.js (v14 or higher)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/workmanl/whoosh-designer.git
   cd whoosh-designer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` folder.

## Deployment

Deploy to GitHub Pages:

```bash
npm run deploy
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Web Audio API** - Audio synthesis and processing
- **Tailwind CSS** - Styling

## How to Use

1. **Enable/disable layers** - Toggle individual sound layers on or off
2. **Choose sound sources** - Select from sine, square, sawtooth, triangle waves, or noise types (white, pink, brown)
3. **Shape envelopes** - Control attack, hold, and decay for volume automation
4. **Set pitch sweeps** - Define start and end frequencies for dynamic pitch changes
5. **Pan sounds** - Position audio in the stereo field
6. **Apply global effects** - Add filters and reverb for polish
7. **Preview** - Hit the Play button or press Spacebar
8. **Export** - Click "Render & Download" to save your WAV file

## Keyboard Shortcuts

- **Spacebar** - Play/Stop

## License

MIT

## Author

Created by Scott Manley
