/**
 * Export PDF de l'attestation de congé IFS
 * Utilise html2canvas pour capturer le rendu HTML, puis jsPDF pour le PDF final.
 */
export async function generateAttestationCongePdf(elementId: string): Promise<void> {
  const { default: html2canvas } = await import('html2canvas')
  const { default: jsPDF }       = await import('jspdf')

  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Élément #${elementId} introuvable`)

  const canvas = await html2canvas(element, {
    scale: 2,             // 2× pour une meilleure résolution
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData   = canvas.toDataURL('image/jpeg', 0.97)
  const pdfWidth  = 215.9  // mm — US Letter width
  const pdfHeight = 279.4  // mm — US Letter height

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  })

  const canvasRatio    = canvas.height / canvas.width
  const renderedHeight = pdfWidth * canvasRatio

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth,
    renderedHeight > pdfHeight ? pdfHeight : renderedHeight)

  pdf.save('Attestation_de_conges_IFS.pdf')
}
