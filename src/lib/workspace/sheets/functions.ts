export interface FnMeta { name: string; category: FnCategory; signature: string; description: string; }
export type FnCategory = "Math" | "Statistical" | "Logical" | "Lookup" | "Text" | "Date & Time" | "Financial" | "Engineering" | "Information";

export const FUNCTIONS: FnMeta[] = [
  // Math
  { name: "SUM", category: "Math", signature: "SUM(number1, [number2, ...])", description: "Adds all the numbers in a range of cells." },
  { name: "SUMIF", category: "Math", signature: "SUMIF(range, criteria, [sum_range])", description: "Adds cells specified by a given criteria." },
  { name: "SUMIFS", category: "Math", signature: "SUMIFS(sum_range, criteria_range1, criteria1, ...)", description: "Adds cells matching multiple criteria." },
  { name: "PRODUCT", category: "Math", signature: "PRODUCT(number1, [number2, ...])", description: "Multiplies all the numbers." },
  { name: "ROUND", category: "Math", signature: "ROUND(number, num_digits)", description: "Rounds a number to a specified number of digits." },
  { name: "ROUNDUP", category: "Math", signature: "ROUNDUP(number, num_digits)", description: "Rounds a number up, away from zero." },
  { name: "ROUNDDOWN", category: "Math", signature: "ROUNDDOWN(number, num_digits)", description: "Rounds a number down, toward zero." },
  { name: "ABS", category: "Math", signature: "ABS(number)", description: "Returns the absolute value." },
  { name: "POWER", category: "Math", signature: "POWER(number, power)", description: "Returns the result of a number raised to a power." },
  { name: "SQRT", category: "Math", signature: "SQRT(number)", description: "Returns the square root." },
  { name: "MOD", category: "Math", signature: "MOD(number, divisor)", description: "Returns the remainder from division." },
  { name: "INT", category: "Math", signature: "INT(number)", description: "Rounds a number down to the nearest integer." },
  { name: "CEILING", category: "Math", signature: "CEILING(number, significance)", description: "Rounds a number up to the nearest multiple." },
  { name: "FLOOR", category: "Math", signature: "FLOOR(number, significance)", description: "Rounds a number down to the nearest multiple." },
  { name: "RAND", category: "Math", signature: "RAND()", description: "Returns a random number between 0 and 1." },
  { name: "RANDBETWEEN", category: "Math", signature: "RANDBETWEEN(bottom, top)", description: "Returns a random integer between two values." },
  // Statistical
  { name: "AVERAGE", category: "Statistical", signature: "AVERAGE(number1, ...)", description: "Returns the arithmetic mean." },
  { name: "MEDIAN", category: "Statistical", signature: "MEDIAN(number1, ...)", description: "Returns the median of a set." },
  { name: "MODE", category: "Statistical", signature: "MODE(number1, ...)", description: "Returns the most frequent value." },
  { name: "STDEV", category: "Statistical", signature: "STDEV(number1, ...)", description: "Estimates standard deviation of a sample." },
  { name: "STDEVP", category: "Statistical", signature: "STDEVP(number1, ...)", description: "Standard deviation of a population." },
  { name: "VAR", category: "Statistical", signature: "VAR(number1, ...)", description: "Estimates variance of a sample." },
  { name: "COUNT", category: "Statistical", signature: "COUNT(value1, ...)", description: "Counts numeric values." },
  { name: "COUNTA", category: "Statistical", signature: "COUNTA(value1, ...)", description: "Counts non-empty values." },
  { name: "COUNTIF", category: "Statistical", signature: "COUNTIF(range, criteria)", description: "Counts cells that meet a criterion." },
  { name: "MAX", category: "Statistical", signature: "MAX(number1, ...)", description: "Returns the largest value." },
  { name: "MIN", category: "Statistical", signature: "MIN(number1, ...)", description: "Returns the smallest value." },
  { name: "PERCENTILE", category: "Statistical", signature: "PERCENTILE(array, k)", description: "Returns the k-th percentile." },
  { name: "CORREL", category: "Statistical", signature: "CORREL(array1, array2)", description: "Returns Pearson correlation." },
  { name: "FORECAST", category: "Statistical", signature: "FORECAST(x, known_ys, known_xs)", description: "Predicts a future value." },
  { name: "RANK", category: "Statistical", signature: "RANK(number, ref, [order])", description: "Returns the rank of a number." },
  // Logical
  { name: "IF", category: "Logical", signature: "IF(logical_test, value_if_true, value_if_false)", description: "Conditional." },
  { name: "IFS", category: "Logical", signature: "IFS(test1, value1, ...)", description: "Multi-condition IF." },
  { name: "AND", category: "Logical", signature: "AND(logical1, ...)", description: "Returns TRUE if all args are true." },
  { name: "OR", category: "Logical", signature: "OR(logical1, ...)", description: "Returns TRUE if any arg is true." },
  { name: "NOT", category: "Logical", signature: "NOT(logical)", description: "Reverses the logic." },
  { name: "IFERROR", category: "Logical", signature: "IFERROR(value, value_if_error)", description: "Handles formula errors." },
  { name: "SWITCH", category: "Logical", signature: "SWITCH(expression, val1, res1, ...)", description: "Matches expression against values." },
  // Lookup
  { name: "VLOOKUP", category: "Lookup", signature: "VLOOKUP(lookup_value, table_array, col_index, [range_lookup])", description: "Looks up a value in the first column." },
  { name: "HLOOKUP", category: "Lookup", signature: "HLOOKUP(lookup_value, table_array, row_index, [range_lookup])", description: "Looks up a value in the top row." },
  { name: "INDEX", category: "Lookup", signature: "INDEX(array, row_num, [col_num])", description: "Returns value at a position." },
  { name: "MATCH", category: "Lookup", signature: "MATCH(lookup_value, lookup_array, [match_type])", description: "Returns position of a value." },
  { name: "OFFSET", category: "Lookup", signature: "OFFSET(reference, rows, cols, [height], [width])", description: "Returns a reference offset from another." },
  { name: "INDIRECT", category: "Lookup", signature: "INDIRECT(ref_text, [a1])", description: "Returns reference from text." },
  { name: "CHOOSE", category: "Lookup", signature: "CHOOSE(index_num, value1, ...)", description: "Chooses a value from a list." },
  // Text
  { name: "CONCATENATE", category: "Text", signature: "CONCATENATE(text1, ...)", description: "Joins text strings." },
  { name: "TEXTJOIN", category: "Text", signature: "TEXTJOIN(delimiter, ignore_empty, text1, ...)", description: "Joins with delimiter." },
  { name: "LEFT", category: "Text", signature: "LEFT(text, [num_chars])", description: "Returns leftmost characters." },
  { name: "RIGHT", category: "Text", signature: "RIGHT(text, [num_chars])", description: "Returns rightmost characters." },
  { name: "MID", category: "Text", signature: "MID(text, start, num_chars)", description: "Returns middle characters." },
  { name: "LEN", category: "Text", signature: "LEN(text)", description: "Length of text." },
  { name: "LOWER", category: "Text", signature: "LOWER(text)", description: "Lowercase." },
  { name: "UPPER", category: "Text", signature: "UPPER(text)", description: "Uppercase." },
  { name: "TRIM", category: "Text", signature: "TRIM(text)", description: "Removes extra spaces." },
  { name: "SUBSTITUTE", category: "Text", signature: "SUBSTITUTE(text, old, new)", description: "Replaces text." },
  { name: "TEXT", category: "Text", signature: "TEXT(value, format_text)", description: "Formats value as text." },
  // Date & Time
  { name: "TODAY", category: "Date & Time", signature: "TODAY()", description: "Current date." },
  { name: "NOW", category: "Date & Time", signature: "NOW()", description: "Current date and time." },
  { name: "DATE", category: "Date & Time", signature: "DATE(year, month, day)", description: "Constructs a date." },
  { name: "YEAR", category: "Date & Time", signature: "YEAR(date)", description: "Year of a date." },
  { name: "MONTH", category: "Date & Time", signature: "MONTH(date)", description: "Month of a date." },
  { name: "DAY", category: "Date & Time", signature: "DAY(date)", description: "Day of the month." },
  { name: "WEEKDAY", category: "Date & Time", signature: "WEEKDAY(date, [type])", description: "Day of the week." },
  { name: "DATEDIF", category: "Date & Time", signature: "DATEDIF(start, end, unit)", description: "Difference between two dates." },
  { name: "NETWORKDAYS", category: "Date & Time", signature: "NETWORKDAYS(start, end, [holidays])", description: "Number of working days." },
  // Financial
  { name: "NPV", category: "Financial", signature: "NPV(rate, value1, ...)", description: "Net present value." },
  { name: "IRR", category: "Financial", signature: "IRR(values, [guess])", description: "Internal rate of return." },
  { name: "PMT", category: "Financial", signature: "PMT(rate, nper, pv, [fv], [type])", description: "Loan payment." },
  { name: "PV", category: "Financial", signature: "PV(rate, nper, pmt, [fv], [type])", description: "Present value." },
  { name: "FV", category: "Financial", signature: "FV(rate, nper, pmt, [pv], [type])", description: "Future value." },
  { name: "RATE", category: "Financial", signature: "RATE(nper, pmt, pv, [fv], [type], [guess])", description: "Interest rate per period." },
  // Information
  { name: "ISBLANK", category: "Information", signature: "ISBLANK(value)", description: "TRUE if empty." },
  { name: "ISNUMBER", category: "Information", signature: "ISNUMBER(value)", description: "TRUE if numeric." },
  { name: "ISTEXT", category: "Information", signature: "ISTEXT(value)", description: "TRUE if text." },
  { name: "ISERROR", category: "Information", signature: "ISERROR(value)", description: "TRUE if error." },
];

export const FUNCTION_BY_NAME: Record<string, FnMeta> = Object.fromEntries(FUNCTIONS.map((f) => [f.name, f]));

export function searchFunctions(q: string, limit = 12): FnMeta[] {
  const s = q.toUpperCase();
  if (!s) return [];
  return FUNCTIONS.filter((f) => f.name.startsWith(s)).slice(0, limit);
}
