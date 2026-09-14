const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png');

// Palette reprise de DESIGN_SYSTEM.md
const COLORS = {
  primary: '#006b2d',
  primaryDark: '#04431d',
  primaryContainer: '#04873b',
  primarySoft: '#eaf6ee',
  secondary: '#964900',
  secondaryContainer: '#ff8927',
  secondarySoft: '#fff4ea',
  tertiary: '#755700',
  gold: '#fabd00',
  ink: '#141b2b',
  inkSoft: '#3e4a3e',
  outline: '#6e7a6d',
  outlineVariant: '#bdcabb',
  surfaceLow: '#f1f3ff',
  surfaceContainer: '#e9edff',
  white: '#ffffff'
};

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4 pt
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CONTENT_RIGHT = PAGE_WIDTH - PAGE_MARGIN;

function formatFcfa(amount) {
  // Formatage manuel (espace normale) : toLocaleString('fr-FR') insère un espace
  // insécable fine (U+202F) absente de l'encodage WinAnsi des polices PDF de base,
  // ce qui s'affichait comme un glyphe "/" dans le PDF généré.
  const rounded = Math.round(amount);
  const withSpaces = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${withSpaces} FCFA`;
}

function drawHeader(doc) {
  const logoWidth = 150;
  let logoBottom = PAGE_MARGIN;

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, PAGE_MARGIN, PAGE_MARGIN - 6, { width: logoWidth });
    logoBottom = PAGE_MARGIN - 6 + logoWidth * (330 / 636);
  } else {
    doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold')
      .text('Africa Univ Technology Sarl', PAGE_MARGIN, PAGE_MARGIN);
    logoBottom = PAGE_MARGIN + 26;
  }

  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.outline);
  const contactLines = [
    'Bd de la Liberté, Akwa — Douala, Cameroun',
    'Avenue Kennedy — Yaoundé, Cameroun',
    'contact@africauniv-tech.com',
    '+237 233 42 00 00 / +237 699 00 00 00'
  ];
  let cy = PAGE_MARGIN;
  contactLines.forEach((line) => {
    doc.text(line, PAGE_MARGIN, cy, { width: CONTENT_WIDTH, align: 'right' });
    cy += 12;
  });

  const headerBottom = Math.max(logoBottom, cy) + 10;
  doc.moveTo(PAGE_MARGIN, headerBottom).lineTo(CONTENT_RIGHT, headerBottom)
    .lineWidth(2).strokeColor(COLORS.primary).stroke();

  return headerBottom + 22;
}

function drawTitleBar(doc, y, { order, invoice }) {
  doc.font('Helvetica-Bold').fontSize(24).fillColor(COLORS.ink)
    .text('FACTURE', PAGE_MARGIN, y);

  doc.font('Helvetica').fontSize(9).fillColor(COLORS.inkSoft);
  doc.text(`N° ${invoice.invoiceNumber}`, PAGE_MARGIN, y + 30);
  doc.text(`Commande ${order.orderNumber}`, PAGE_MARGIN, y + 43);
  doc.text(`Émise le ${new Date(invoice.issuedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, PAGE_MARGIN, y + 56);

  // Badge "Payée (simulation)" aligné à droite
  const badgeText = 'PAYÉE (SIMULATION)';
  doc.font('Helvetica-Bold').fontSize(9);
  const badgeWidth = doc.widthOfString(badgeText) + 24;
  const badgeX = CONTENT_RIGHT - badgeWidth;
  const badgeY = y + 2;
  doc.roundedRect(badgeX, badgeY, badgeWidth, 22, 11).fill(COLORS.primarySoft);
  doc.fillColor(COLORS.primary).text(badgeText, badgeX, badgeY + 6.5, { width: badgeWidth, align: 'center' });

  return y + 80;
}

/**
 * Renders a stack of text lines inside a box, measuring each line's wrapped
 * height first so that following lines never overlap.
 */
function measureAndDraw(doc, lines, x, startY, textWidth) {
  let cursorY = startY;
  lines.forEach(({ text, font, size, color, gap = 4 }) => {
    doc.font(font).fontSize(size).fillColor(color);
    doc.text(text, x, cursorY, { width: textWidth });
    cursorY += doc.heightOfString(text, { width: textWidth }) + gap;
  });
  return cursorY;
}

function drawPartyBoxes(doc, y, { order, user }) {
  const boxWidth = (CONTENT_WIDTH - 16) / 2;
  const textWidth = boxWidth - 28;
  const rightX = PAGE_MARGIN + boxWidth + 16;
  const addr = order.shippingAddress || {};
  const padTop = 34;

  const billLines = [
    { text: `${user.firstName} ${user.lastName}`, font: 'Helvetica-Bold', size: 11, color: COLORS.ink, gap: 5 },
    ...(user.company ? [{ text: user.company, font: 'Helvetica', size: 9, color: COLORS.inkSoft }] : []),
    { text: user.email, font: 'Helvetica', size: 9, color: COLORS.inkSoft },
    ...(user.phone ? [{ text: user.phone, font: 'Helvetica', size: 9, color: COLORS.inkSoft }] : [])
  ];

  const line1 = [addr.line1, addr.line2].filter(Boolean).join(', ');
  const line2 = [addr.city, addr.region, addr.country].filter(Boolean).join(', ');
  const shipLines = [
    { text: addr.fullName || '—', font: 'Helvetica-Bold', size: 11, color: COLORS.ink, gap: 5 },
    ...(addr.phone ? [{ text: addr.phone, font: 'Helvetica', size: 9, color: COLORS.inkSoft }] : []),
    ...(line1 ? [{ text: line1, font: 'Helvetica', size: 9, color: COLORS.inkSoft }] : []),
    ...(line2 ? [{ text: line2, font: 'Helvetica', size: 9, color: COLORS.inkSoft }] : [])
  ];

  // Mesure à blanc (le texte n'est dessiné qu'après avoir tracé les rectangles de fond).
  const measureHeight = (lines) => lines.reduce((sum, l) => {
    doc.font(l.font).fontSize(l.size);
    return sum + doc.heightOfString(l.text, { width: textWidth }) + (l.gap ?? 4);
  }, 0);

  const contentHeight = Math.max(measureHeight(billLines), measureHeight(shipLines));
  const boxHeight = padTop + contentHeight + 14;

  doc.roundedRect(PAGE_MARGIN, y, boxWidth, boxHeight, 8).fill(COLORS.surfaceLow);
  doc.roundedRect(rightX, y, boxWidth, boxHeight, 8).fill(COLORS.surfaceLow);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.primary)
    .text('FACTURÉ À', PAGE_MARGIN + 14, y + 12, { characterSpacing: 0.6 });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.primary)
    .text('ADRESSE DE LIVRAISON', rightX + 14, y + 12, { characterSpacing: 0.6 });

  measureAndDraw(doc, billLines, PAGE_MARGIN + 14, y + padTop, textWidth);
  measureAndDraw(doc, shipLines, rightX + 14, y + padTop, textWidth);

  return y + boxHeight + 26;
}

const COLS = {
  label: { x: PAGE_MARGIN, width: 218 },
  unit: { x: PAGE_MARGIN + 226, width: 88 },
  qty: { x: PAGE_MARGIN + 322, width: 44 },
  total: { x: PAGE_MARGIN + 374, width: CONTENT_RIGHT - (PAGE_MARGIN + 374) }
};

function drawTableHeader(doc, y) {
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 26, 4).fill(COLORS.primary);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.white);
  doc.text('DÉSIGNATION', COLS.label.x + 10, y + 9);
  doc.text('PRIX UNITAIRE', COLS.unit.x, y + 9, { width: COLS.unit.width, align: 'right' });
  doc.text('QTÉ', COLS.qty.x, y + 9, { width: COLS.qty.width, align: 'right' });
  doc.text('TOTAL TTC', COLS.total.x, y + 9, { width: COLS.total.width - 10, align: 'right' });
  return y + 26;
}

function drawItemRow(doc, y, item, zebra) {
  const label = item.variantName ? `${item.productName} — ${item.variantName}` : item.productName;
  const labelHeight = doc.font('Helvetica-Bold').fontSize(9).heightOfString(label, { width: COLS.label.width - 10 });
  const rowHeight = Math.max(32, labelHeight + (item.sku ? 22 : 16));

  if (zebra) {
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill(COLORS.surfaceLow);
  }

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.ink)
    .text(label, COLS.label.x + 10, y + 8, { width: COLS.label.width - 10 });
  if (item.sku) {
    doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.outline)
      .text(`Réf: ${item.sku}`, COLS.label.x + 10, y + 8 + labelHeight + 2, { width: COLS.label.width - 10 });
  }

  doc.font('Helvetica').fontSize(9).fillColor(COLORS.inkSoft);
  doc.text(formatFcfa(item.unitPriceTtc), COLS.unit.x, y + 10, { width: COLS.unit.width, align: 'right' });
  doc.text(String(item.quantity), COLS.qty.x, y + 10, { width: COLS.qty.width, align: 'right' });
  doc.font('Helvetica-Bold').fillColor(COLORS.ink)
    .text(formatFcfa(item.lineTotalTtc), COLS.total.x, y + 10, { width: COLS.total.width - 10, align: 'right' });

  return y + rowHeight;
}

function drawTotals(doc, y, order) {
  const boxWidth = 230;
  const boxX = CONTENT_RIGHT - boxWidth;
  let ty = y + 14;

  const line = (label, value, opts = {}) => {
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.bold ? 11 : 9.5)
      .fillColor(opts.color || COLORS.inkSoft);
    doc.text(label, boxX, ty, { width: boxWidth - 100 });
    doc.text(value, boxX + boxWidth - 100, ty, { width: 100, align: 'right' });
    ty += opts.bold ? 22 : 17;
  };

  line('Sous-total HT', formatFcfa(order.subtotalHt));
  line(`TVA (${(order.vatRate * 100).toFixed(2)}%)`, formatFcfa(order.vatAmount));
  line('Livraison', order.shippingFee ? formatFcfa(order.shippingFee) : 'Offerte', {
    color: order.shippingFee ? COLORS.inkSoft : COLORS.primary
  });

  ty += 4;
  doc.roundedRect(boxX, ty, boxWidth, 34, 6).fill(COLORS.primary);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white)
    .text('TOTAL TTC', boxX + 14, ty + 11);
  doc.fontSize(13).text(formatFcfa(order.totalTtc), boxX, ty + 9, { width: boxWidth - 14, align: 'right' });

  return ty + 34 + 20;
}

function drawFooter(doc) {
  // Positionné à partir du bas réel de la page (moins la marge basse réduite du
  // document) pour ne jamais dépasser la zone imprimable et déclencher une page
  // supplémentaire involontaire.
  const footerY = doc.page.height - doc.page.margins.bottom - 32;
  doc.moveTo(PAGE_MARGIN, footerY).lineTo(CONTENT_RIGHT, footerY)
    .lineWidth(1).strokeColor(COLORS.outlineVariant).stroke();

  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.outline);
  doc.text(
    'Document généré automatiquement dans le cadre d\'une démonstration — paiement simulé, aucune transaction financière réelle n\'a été effectuée.',
    PAGE_MARGIN, footerY + 8, { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
  );
  doc.text(
    'Africa Univ Technology Sarl — RCCM: RC/DLA/2018/B/XXXX — N° Contribuable: M051XXXXXXXXX',
    PAGE_MARGIN, footerY + 19, { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
  );
}

/**
 * Streams a branded invoice PDF for the given order into `res`.
 */
function streamInvoicePdf(res, { order, invoice, items, user }) {
  const doc = new PDFDocument({
    size: 'A4',
    bufferPages: true,
    margins: { top: PAGE_MARGIN, bottom: 34, left: PAGE_MARGIN, right: PAGE_MARGIN }
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  let y = drawHeader(doc);
  y = drawTitleBar(doc, y, { order, invoice });
  y = drawPartyBoxes(doc, y, { order, user });

  y = drawTableHeader(doc, y);
  items.forEach((item, index) => {
    // Laisse assez de place sous le dernier article pour le bloc des totaux (~90pt) et le pied de page (~50pt).
    if (y > 640) {
      doc.addPage();
      y = PAGE_MARGIN;
      y = drawTableHeader(doc, y);
    }
    y = drawItemRow(doc, y, item, index % 2 === 0);
  });

  doc.moveTo(PAGE_MARGIN, y).lineTo(CONTENT_RIGHT, y).lineWidth(1).strokeColor(COLORS.outlineVariant).stroke();

  drawTotals(doc, y, order);
  drawFooter(doc);

  doc.end();
}

module.exports = { streamInvoicePdf, formatFcfa };
