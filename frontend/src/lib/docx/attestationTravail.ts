/**
 * Génération du fichier Word "Attestation de Travail"
 * ────────────────────────────────────────────────────
 * Reproduit fidèlement le modèle IFS :
 *  - Page US Letter, marges 1.25in L/R, 1in T/B
 *  - Logo double (Ambassade + Institut Français) en en-tête
 *  - Police Times New Roman 14pt corps, 18pt titre
 *  - Champs variables en rouge gras (FF0000)
 *  - Bloc signature centré à droite
 *  - Pied de page "Page 1 sur 1"
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Header,
  Footer,
  AlignmentType,
  PageNumber,
} from 'docx'
import { saveAs } from 'file-saver'

export interface AttestationData {
  signataire: string
  fonctionSignataire: string
  employe: string
  dateNaissance: string
  lieuNaissance: string
  poste: string
  dateEmbauche: string
  lieuFait: string
  dateFait: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Charge une image depuis /public et retourne un ArrayBuffer */
async function fetchImage(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path)
  return res.arrayBuffer()
}

/** Crée un TextRun noir standard (Times New Roman 14pt) */
function txt(text: string, opts?: { bold?: boolean; size?: number }): TextRun {
  return new TextRun({
    text,
    font: 'Times New Roman',
    size: (opts?.size ?? 28),       // 28 half-points = 14pt
    bold: opts?.bold,
  })
}

/** Crée un TextRun rouge gras (champs à remplir) */
function redTxt(text: string, opts?: { bold?: boolean }): TextRun {
  return new TextRun({
    text,
    font: 'Times New Roman',
    size: 28,
    bold: opts?.bold !== false,
    color: 'FF0000',
  })
}

/** Paragraphe vide (espacement vertical) */
function emptyPara(size = 22): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '', font: 'Times New Roman', size })],
  })
}

// ─── Génération du document ──────────────────────────────────────────────────

export async function generateAttestationDocx(data: AttestationData): Promise<void> {
  // Charger le logo en-tête
  const logoBuffer = await fetchImage('/images/ifs-logo-header.jpg')

  // ── En-tête : logo Ambassade + Institut Français ──────────────────────────
  const headerContent = new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            type: 'jpg',
            data: logoBuffer,
            transformation: { width: 220, height: 100 },
            altText: {
              title: 'Logo IFS',
              description: 'Ambassade de France au Sénégal - Institut Français',
              name: 'ifs-logo',
            },
          }),
        ],
      }),
    ],
  })

  // ── Pied de page : "Page X sur Y" ────────────────────────────────────────
  const footerContent = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'Page ', font: 'Times New Roman', size: 20 }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: 'Times New Roman',
            size: 20,
            bold: true,
          }),
          new TextRun({ text: ' sur ', font: 'Times New Roman', size: 20 }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: 'Times New Roman',
            size: 20,
            bold: true,
          }),
        ],
      }),
    ],
  })

  // ── Corps du document ─────────────────────────────────────────────────────
  const children: Paragraph[] = [
    // Lignes vides après l'en-tête (espace pour le logo)
    emptyPara(),
    emptyPara(),
    emptyPara(),
    emptyPara(),
    emptyPara(),

    // ── TITRE ──
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'ATTESTATION DE TRAVAIL',
          font: 'Times',
          size: 36,     // 18pt
        }),
      ],
    }),

    // Lignes vides
    emptyPara(),
    emptyPara(),

    // ── CORPS PRINCIPAL ──
    new Paragraph({
      alignment: AlignmentType.BOTH,
      indent: { firstLine: 709 },
      spacing: { before: 240 },
      children: [
        txt('Je soussigné, '),
        redTxt(data.signataire),
        txt(', ' + data.fonctionSignataire + ' de l\u2019Institut Français du Sénégal, atteste par la présente que '),
        redTxt(data.employe),
        txt(', né(e) le '),
        redTxt(data.dateNaissance),
        txt(' à ' + data.lieuNaissance + ', est '),
        redTxt(data.poste),
        txt(' au service de notre Etablissement, depuis le '),
        redTxt(data.dateEmbauche),
        txt('.', { bold: true }),
      ],
    }),

    // ── CLAUSE ──
    new Paragraph({
      alignment: AlignmentType.BOTH,
      spacing: { before: 240 },
      children: [
        txt('          La présente attestation lui est délivrée pour servir et valoir ce que de droit. '),
      ],
    }),

    // Ligne vide
    emptyPara(),

    // ── DATE ──
    new Paragraph({
      alignment: AlignmentType.BOTH,
      indent: { firstLine: 708 },
      children: [
        txt('Fait à ' + data.lieuFait + ', le '),
        new TextRun({
          text: data.dateFait,
          font: 'Times New Roman',
          size: 28,
          color: 'FF0000',
        }),
        txt('.  '),
      ],
    }),

    // Lignes vides avant signature
    emptyPara(),
    emptyPara(),
    emptyPara(),
    emptyPara(),
    emptyPara(),
    emptyPara(),
    emptyPara(),

    // ── BLOC SIGNATURE ──
    new Paragraph({
      indent: { left: 1416, firstLine: 708, right: 283 },
      children: [
        txt('                                 Le ' + data.fonctionSignataire + ' de '),
      ],
    }),

    new Paragraph({
      indent: { left: 1416, firstLine: 708, right: 283 },
      children: [
        txt('                               L\u2019Institut Français du Sénégal '),
      ],
    }),

    // Espace pour la signature manuscrite
    emptyPara(24),
    emptyPara(24),
    emptyPara(24),
    emptyPara(24),
    emptyPara(24),

    // ── NOM DU SIGNATAIRE ──
    new Paragraph({
      indent: { left: 1416, firstLine: 708, right: 283 },
      children: [
        new TextRun({
          text: '                                         ' + data.signataire + ' ',
          font: 'Times New Roman',
          size: 24,
          bold: true,
        }),
      ],
    }),
  ]

  // ── Assemblage du document ────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,    // US Letter 8.5"
              height: 15840,   // US Letter 11"
            },
            margin: {
              top: 1440,       // 1 inch
              right: 1800,     // 1.25 inch
              bottom: 1440,    // 1 inch
              left: 1800,      // 1.25 inch
            },
          },
        },
        headers: { default: headerContent },
        footers: { default: footerContent },
        children,
      },
    ],
  })

  // ── Export ─────────────────────────────────────────────────────────────────
  const buffer = await Packer.toBlob(doc)
  const filename = `Attestation de travail - ${data.employe.replace(/[^a-zA-ZÀ-ÿ ]/g, '')}.docx`
  saveAs(buffer, filename)
}
