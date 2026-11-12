/* Minimal PDF 1.4 writer for the two approved local stock photographs.
 * No remote requests, new dependencies, invented client inventory or external PDF service.
 * Inputs must be RGB baseline JPEGs converted from our existing gallery WebPs by Sharp. */
interface PdfPhoto {
  readonly jpeg: Buffer;
  readonly width: number;
  readonly height: number;
  readonly category: "Mermaid" | "Ball Gown";
  readonly sample: string;
  readonly photographer: string;
}

const ascii = (value: string): Buffer => Buffer.from(value, "latin1");
const literal = (value: string) => "(" + value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + ")";
const operator = (x: number, y: number, size: number, value: string): string =>
  `BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm ${literal(value)} Tj ET\n`;

export function createSampleLookbookPdf(photos: readonly PdfPhoto[]): Buffer {
  if (photos.length !== 2 || photos[0].category !== "Mermaid" || photos[1].category !== "Ball Gown") {
    throw new Error("Lookbook PDF requires the two approved sample categories");
  }
  const objects: Buffer[] = [];
  const add = (data: Buffer | string): number => (objects.push(typeof data === "string" ? ascii(data) : data), objects.length);
  const set = (index: number, data: string) => { objects[index - 1] = ascii(data); };
  const stream = (data: Buffer, dictionary = ""): Buffer =>
    Buffer.concat([ascii(`<< ${dictionary} /Length ${data.length} >>\nstream\n`), data, ascii("\nendstream")]);

  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pages = add("pending pages");
  const pageRefs: number[] = [];
  for (const photo of photos) {
    if (photo.jpeg.length < 4 || photo.jpeg[0] !== 0xff || photo.jpeg[1] !== 0xd8
      || photo.width <= 0 || photo.height <= 0) throw new Error("Invalid lookbook JPEG");
    const img = add(stream(photo.jpeg,
      `/Type /XObject /Subtype /Image /Width ${photo.width} /Height ${photo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`));
    // A4 portrait: 595 x 842pt. The original image's portrait aspect ratio is preserved.
    const maxW = 410, maxH = 595, scale = Math.min(maxW / photo.width, maxH / photo.height);
    const iw = +(photo.width * scale).toFixed(3), ih = +(photo.height * scale).toFixed(3);
    const ix = +((595 - iw) / 2).toFixed(3), iy = 152;
    const commands = [
      operator(55, 785, 20, "REDCARPERT WEDDING DRESSES"),
      operator(55, 755, 12, "DIGITAL LOOKBOOK - SAMPLE COLLECTION"),
      `q ${iw} 0 0 ${ih} ${ix} ${iy} cm /Im1 Do Q\n`,
      operator(55, 112, 17, photo.category.toUpperCase() + " | " + photo.sample),
      operator(55, 88, 10, "Demonstration photograph by " + photo.photographer.replace(/[^\x20-\x7E]/g, "")),
      operator(55, 65, 9, "Stock photography only - not confirmed Redcarpert inventory."),
    ].join("");
    const content = add(stream(ascii(commands)));
    const page = add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> /XObject << /Im1 ${img} 0 R >> >> /Contents ${content} 0 R >>`);
    pageRefs.push(page);
  }
  set(pages, `<< /Type /Pages /Kids [${pageRefs.map(n => n + " 0 R").join(" ")}] /Count ${pageRefs.length} >>`);
  const catalog = add(`<< /Type /Catalog /Pages ${pages} 0 R >>`);

  const chunks: Buffer[] = [ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = [0];
  let position = chunks[0].length;
  const push = (buf: Buffer) => { chunks.push(buf); position += buf.length; };
  objects.forEach((data, i) => {
    offsets.push(position);
    push(ascii(`${i + 1} 0 obj\n`)); push(data); push(ascii("\nendobj\n"));
  });
  const xref = position;
  push(ascii(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`));
  for (const offset of offsets.slice(1)) push(ascii(String(offset).padStart(10, "0") + " 00000 n \n"));
  push(ascii(`trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return Buffer.concat(chunks);
}
