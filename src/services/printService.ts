import JsBarcode from 'jsbarcode';

/**
 * Opens the browser print dialog for the given badge HTML element.
 * Clones the element into a hidden iframe so the main page layout is unaffected.
 */
export function printBadge(badgeElement: HTMLElement): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;

  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to access iframe document for printing.');
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Badge</title>
      <style>
        @page {
          size: 2.125in 3.375in;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          width: 2.125in;
          height: 3.375in;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, Helvetica, sans-serif;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body></body>
    </html>
  `);
  iframeDoc.close();

  const clonedElement = badgeElement.cloneNode(true) as HTMLElement;
  iframeDoc.body.appendChild(clonedElement);

  // Copy computed styles from the original stylesheets
  const parentStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
  parentStyles.forEach((styleNode) => {
    const clone = styleNode.cloneNode(true);
    iframeDoc.head.appendChild(clone);
  });

  // Wait for styles and images to load before printing
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up after a delay to allow the print dialog to close
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}

/**
 * Generates a Code128 barcode for the given EID and returns it as a data URL (PNG).
 */
export function generateBarcode(eid: string): string {
  const canvas = document.createElement('canvas');

  JsBarcode(canvas, eid, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 12,
    font: 'Arial',
    textMargin: 4,
    margin: 4,
    background: '#ffffff',
    lineColor: '#000000',
  });

  return canvas.toDataURL('image/png');
}
