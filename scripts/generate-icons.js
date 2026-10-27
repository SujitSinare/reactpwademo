import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, isMaskable = false) {
  // Simple uncompressed or deflated RGBA PNG generator using Node's built-in zlib
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: Navy (#0B192C to #1E3E62)
      const gradT = y / height;
      let r = Math.round(11 + (30 - 11) * gradT);
      let g = Math.round(25 + (62 - 25) * gradT);
      let b = Math.round(44 + (98 - 44) * gradT);
      let a = 255;

      // Draw rounded corner if not maskable
      if (!isMaskable) {
        const cornerR = width * 0.22;
        const inLeft = x < cornerR;
        const inRight = x > width - cornerR;
        const inTop = y < cornerR;
        const inBottom = y > height - cornerR;

        if ((inLeft || inRight) && (inTop || inBottom)) {
          const cornerCx = inLeft ? cornerR : width - cornerR;
          const cornerCy = inTop ? cornerR : height - cornerR;
          const cornerDist = Math.sqrt((x - cornerCx) ** 2 + (y - cornerCy) ** 2);
          if (cornerDist > cornerR) {
            a = 0; // Transparent outside rounded corner
          }
        }
      }

      if (a > 0) {
        // Draw U-shape banking pillar emblem in Teal (#14B8A6 / #06B6D4)
        const scale = width / 512;
        const nx = (x - cx) / scale; // normalized x (-256 to 256)
        const ny = (y - cy) / scale; // normalized y (-256 to 256)

        // U-arch: inner radius ~60, outer radius ~120, vertical legs from -70 to 40
        const archDist = Math.sqrt(nx * nx + (ny - 30) * (ny - 30));
        const inArch = ny >= 30 && archDist >= 55 && archDist <= 125;
        const inLeftLeg = ny >= -80 && ny < 30 && nx >= -125 && nx <= -55;
        const inRightLeg = ny >= -80 && ny < 30 && nx >= 55 && nx <= 125;

        // Top pediment bar
        const inPediment = ny >= -115 && ny <= -90 && nx >= -135 && nx <= 135;
        // Central Gold diamond/star
        const inStar = Math.abs(nx) + Math.abs(ny + 10) <= 32;

        if (inStar) {
          // Gold (#F59E0B)
          r = 245; g = 158; b = 11;
        } else if (inArch || inLeftLeg || inRightLeg) {
          // Teal (#14B8A6)
          r = 20; g = 184; b = 166;
        } else if (inPediment) {
          // White
          r = 255; g = 255; b = 255;
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Construct PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeInt32BE(crc, 8 + length);
  return chunk;
}

// CRC-32 implementation
const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(outDir, 'icon-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(outDir, 'icon-512x512-maskable.png'), createPNG(512, 512, true));

console.log('PWA icons created successfully in public/icons!');
