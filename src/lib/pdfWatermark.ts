import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface WatermarkOptions {
  userName: string
  userEmail: string
  timestamp?: Date
}

/**
 * Adds a watermark to a PDF file with user information
 * @param pdfBytes - The original PDF file bytes
 * @param options - Watermark options including user info
 * @returns The watermarked PDF bytes
 */
export async function addPDFWatermark(
  pdfBytes: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const { userName, userEmail, timestamp = new Date() } = options

  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes)
  
  // Get font for watermark text
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  // Format the watermark text
  const dateStr = timestamp.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const watermarkText = `Baixado por: ${userName} (${userEmail}) em ${dateStr}`
  
  // Get all pages
  const pages = pdfDoc.getPages()
  
  // Add watermark to each page
  pages.forEach((page) => {
    const { width, height } = page.getSize()
    const fontSize = 8
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize)
    
    // Draw watermark at the bottom center of each page
    page.drawText(watermarkText, {
      x: (width - textWidth) / 2,
      y: 20, // 20 units from bottom
      size: fontSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5), // Gray color
      opacity: 0.7,
    })
  })
  
  // Serialize the modified PDF
  return await pdfDoc.save()
}

/**
 * Downloads a file with watermark applied (for PDFs) or directly (for other files)
 * @param fileUrl - URL of the file to download
 * @param fileName - Name for the downloaded file
 * @param options - Watermark options (only applied to PDF files)
 */
export async function downloadWithWatermark(
  fileUrl: string,
  fileName: string,
  options: WatermarkOptions
): Promise<void> {
  try {
    // Fetch the file
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    
    let finalBlob: Blob
    
    // Check if it's a PDF file
    if (fileName.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf') {
      // Apply watermark to PDF
      const watermarkedBytes = await addPDFWatermark(arrayBuffer, options)
      finalBlob = new Blob([watermarkedBytes], { type: 'application/pdf' })
    } else {
      // For non-PDF files, use the original blob
      finalBlob = blob
    }
    
    // Create download link
    const url = URL.createObjectURL(finalBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file with watermark:', error)
    throw error
  }
}
