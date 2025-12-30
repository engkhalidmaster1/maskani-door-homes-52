// Property Code Generation Utilities

/**
 * Generate a unique property code based on date, bedrooms, and sequential number
 * Format: YYYYMMDD-BR{bedrooms}-{sequential}
 * Example: 20241225-BR3-001
 */
export const generatePropertyCode = (bedrooms: number, createdDate?: Date): string => {
  const date = createdDate || new Date();
  
  // Format date as YYYYMMDD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Format bedrooms
  const bedroomsStr = `BR${bedrooms}`;
  
  // Generate sequential number (3 digits)
  // In a real implementation, this would be based on database count
  const sequential = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  
  return `${dateStr}-${bedroomsStr}-${sequential}`;
};

/**
 * Generate property code with database sequential number
 * This should be used when creating properties in the database
 */
export const generatePropertyCodeWithSequence = async (
  bedrooms: number, 
  createdDate?: Date,
  getSequenceNumber?: () => Promise<number>
): Promise<string> => {
  const date = createdDate || new Date();
  
  // Format date as YYYYMMDD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Format bedrooms
  const bedroomsStr = `BR${bedrooms}`;
  
  // Get sequential number from database or generate random
  let sequential: string;
  if (getSequenceNumber) {
    const seqNum = await getSequenceNumber();
    sequential = String(seqNum).padStart(3, '0');
  } else {
    sequential = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  }
  
  return `${dateStr}-${bedroomsStr}-${sequential}`;
};

/**
 * Parse property code to extract information
 */
export const parsePropertyCode = (code: string) => {
  const parts = code.split('-');
  if (parts.length !== 3) {
    return null;
  }
  
  const [datePart, bedroomsPart, sequentialPart] = parts;
  
  // Parse date
  if (datePart.length !== 8) return null;
  const year = parseInt(datePart.substring(0, 4));
  const month = parseInt(datePart.substring(4, 6));
  const day = parseInt(datePart.substring(6, 8));
  const date = new Date(year, month - 1, day);
  
  // Parse bedrooms
  const bedroomsMatch = bedroomsPart.match(/BR(\d+)/);
  if (!bedroomsMatch) return null;
  const bedrooms = parseInt(bedroomsMatch[1]);
  
  // Parse sequential
  const sequential = parseInt(sequentialPart);
  
  return {
    date,
    bedrooms,
    sequential,
    dateString: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    fullCode: code
  };
};

/**
 * Validate property code format
 */
export const isValidPropertyCode = (code: string): boolean => {
  const pattern = /^\d{8}-BR\d+-\d{3}$/;
  return pattern.test(code);
};

/**
 * Format property code for display
 */
export const formatPropertyCodeForDisplay = (code: string): string => {
  const parsed = parsePropertyCode(code);
  if (!parsed) return code;
  
  return `${code} (${parsed.dateString})`;
};






