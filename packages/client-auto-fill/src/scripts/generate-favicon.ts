import { encode } from "https://deno.land/x/pngs@0.1.1/mod.ts";

// Create a 16x16 favicon
const width = 16;
const height = 16;
const data = new Uint8Array(width * height * 4);

// Create a simple key icon (white on blue background)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;

    // Blue background
    data[i] = 66; // R
    data[i + 1] = 139; // G
    data[i + 2] = 202; // B
    data[i + 3] = 255; // A

    // Draw a simple key shape in white
    if (
      (y === 8 && x >= 4 && x <= 12) || // horizontal line
      (x === 8 && y >= 4 && y <= 12)
    ) { // vertical line
      data[i] = 255; // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
    }
  }
}

// Encode PNG
const png = encode(data, width, height);

// Save as favicon.ico
await Deno.writeFile("./favicon.ico", png);
