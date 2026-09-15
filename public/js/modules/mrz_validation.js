/*
    Mathematical validation of identity documents.
 */
export class MRZValidator {
    
    /*
        Uses the repeating weight pattern: 7, 3, 1
     */
    static calculateCheckDigit(str) {
        const weights = [7, 3, 1];
        let sum = 0;
        
        // Convert to uppercase to ensure standard ascii mapping
        const normalizedStr = str.toUpperCase();

        for (let i = 0; i < normalizedStr.length; i++) {
            const char = normalizedStr[i];
            let value = 0;

            if (char >= '0' && char <= '9') {
                value = parseInt(char, 10);
            } else if (char >= 'A' && char <= 'Z') {
                value = char.charCodeAt(0) - 55;
            } else if (char === '<') {
                value = 0;
            }

            sum += value * weights[i % 3];
        }

        return sum % 10;
    }

    static isValid(str, expectedDigit) {
        if (!str || !expectedDigit) return false;
        
        const calculated = this.calculateCheckDigit(str);
        const expected = expectedDigit === '<' ? 0 : parseInt(expectedDigit, 10);
        
        return calculated === expected;
    }

    /*
    Checks if a YYMMDD date string represents a date in the past.
    Note: ICAO YY rules typically pivot around the current century.
     */
    static isExpired(yymmdd) {
        if (!yymmdd || yymmdd.length !== 6) return true;
        
        const yearPart = parseInt(yymmdd.substring(0, 2), 10);
        const month = parseInt(yymmdd.substring(2, 4), 10) - 1; // JS months are 0-11
        const day = parseInt(yymmdd.substring(4, 6), 10);
        
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        
        let fullYear = currentCentury + yearPart;
        // Basic century logic for expiration dates
        if (fullYear < currentYear - 20) {
             fullYear += 100;
        }

        const expiryDate = new Date(fullYear, month, day);
        const today = new Date();
        
        // Strip time from today for accurate date-only comparison
        today.setHours(0, 0, 0, 0);
        
        return expiryDate < today;
    }
}