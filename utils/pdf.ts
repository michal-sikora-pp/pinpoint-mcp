import axios from 'axios';
import { PdfReader } from 'pdfreader';

/**
 * Fetches a PDF from a URL and extracts its text content
 * @param url URL of the PDF file to parse
 * @returns The raw text content of the PDF
 */
export async function parsePdfFromUrl(url: string): Promise<string> {
  try {
    // Download the PDF file
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    
    // Convert response data to buffer
    const pdfBuffer = Buffer.from(response.data);
    
    // Extract text content
    const text = await extractTextFromPdf(pdfBuffer);
    
    return text;
  } catch (error) {
    console.error('Error processing PDF:', error.message);
    throw new Error(`Failed to process PDF from URL: ${error.message}`);
  }
}

/**
 * Extract text from a PDF buffer
 * @param buffer PDF file as buffer
 * @returns Raw text content
 */
function extractTextFromPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    // Store all text items in an array
    const textItems: string[] = [];
    
    // Use pdfreader to extract text
    // @ts-ignore - Ignore type issues with the pdfreader library
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        console.error("PDF parsing error:", err);
        resolve("Error extracting text from PDF");
        return;
      }
      
      if (!item) {
        // End of file, join all text items and return
        resolve(textItems.join(' '));
        return;
      }
      
      if (item.text) {
        // Simply collect all text items
        textItems.push(item.text);
      }
    });
  });
}
