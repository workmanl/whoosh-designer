
/**
 * Encodes an AudioBuffer to a 24-bit WAV file.
 * @param buffer The AudioBuffer to encode.
 * @returns A Blob representing the WAV file.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 3; // 3 bytes per sample for 24-bit
  const sampleRate = buffer.sampleRate;
  const dataSize = length;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  let offset = 0;

  // RIFF chunk descriptor
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, 36 + dataSize, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;

  // "fmt " sub-chunk
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size for PCM
  view.setUint16(offset, 1, true); offset += 2; // AudioFormat 1 for PCM
  view.setUint16(offset, numOfChan, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numOfChan * 3, true); offset += 4; // ByteRate
  view.setUint16(offset, numOfChan * 3, true); offset += 2; // BlockAlign
  view.setUint16(offset, 24, true); offset += 2; // BitsPerSample

  // "data" sub-chunk
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, dataSize, true); offset += 4;

  // Write the PCM data
  const channels = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < numOfChan; j++) {
      // Convert float sample to 24-bit signed integer
      const sample = Math.max(-1, Math.min(1, channels[j][i]));
      const intSample = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
      
      view.setInt8(offset, (intSample >> 0) & 0xFF); offset++;
      view.setInt8(offset, (intSample >> 8) & 0xFF); offset++;
      view.setInt8(offset, (intSample >> 16) & 0xFF); offset++;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
