/**
 * Format String With Data
 *
 * This module provides the function `formatStringWithData` which formats a template string by
 * replacing placeholders with values from a provided data object.
 *
 * Supported placeholder types:
 * 1. Simple key: {{key}} – Replaced with data[key].
 * 2. Hierarchical key: {{key.subkey}} – Replaced by traversing nested objects.
 * 3. Transformations: {{transformName(arg1, arg2, ...)}}
 *    - Supported transformations:
 *      - default(key, 'defaultValue'): If the value for key is undefined or null, returns 'defaultValue'.
 *      - date(key): Attempts to format the value at key as a date. For numeric values, if the number is
 *                 less than 1e11, it is treated as seconds (otherwise as milliseconds).
 *      - replace(key, ['search', 'replace'], ...): Applies sequential string replacements.
 *
 * If a key is not found, it is replaced with an empty string.
 * If a transformation fails (e.g. date formatting error) or an unknown transformation is used, "#ERROR" is returned.
 *
 * Transformation arguments support:
 * - Unquoted tokens (e.g. key paths, numbers).
 * - Single-quoted string literals.
 * - Array literals for the replace transformation in the format: ['search', 'replace'].
 */

type Transformations = {
  default: (value: any, defaultValue: string) => string;
  date: (value: any) => string;
  replace: (value: string, ...replacePairs: string[][]) => string;
};

const defaultTransformations: Transformations = {
  default: (value: any, defaultValue: string): string => {
    return value === undefined || value === null ? defaultValue : String(value);
  },
  date: (value: any): string => {
    let date: Date;
    try {
      if (value === "" || value == null) return "";
      if (typeof value === "number") {
        // If the value is less than 1e11, assume it's in seconds.
        date = value < 1e11 ? new Date(value * 1000) : new Date(value);
      } else {
        date = new Date(value);
      }
      if (isNaN(date.getTime())) {
        return "#ERROR";
      }
      return date.toLocaleDateString();
    } catch (error) {
      return "#ERROR";
    }
  },
  replace: (value: string, ...replacePairs: string[][]): string => {
    let result = String(value ?? "");
    for (const [search, replace] of replacePairs) {
      // Only perform replacement if search is a non-empty string.
      if (search !== "") {
        result = result.split(String(search)).join(String(replace));
      }
    }
    return result;
  },
};

/**
 * Parses transformation arguments from a comma-separated argument string.
 * It supports:
 * - Array literals (e.g. ['x', 'X']).
 * - Quoted strings.
 * - Unquoted tokens.
 *
 * @param argsString - The raw arguments string.
 * @returns An array of parsed arguments.
 */
function parseTransformationArgs(argsString: string): any[] {
  const args: any[] = [];
  // This regex matches either an array literal, a quoted string, or an unquoted token.
  const regex = /\s*(\[[^\]]*\]|'[^']*'|[^,\s][^,]*)\s*(,|$)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(argsString)) !== null) {
    let token = match[1].trim();
    if (token.startsWith("[") && token.endsWith("]")) {
      // Parse array literal, e.g. "['x', 'X']"
      const inner = token.slice(1, -1).trim();
      if (!inner) {
        args.push([]);
      } else {
        const arr: string[] = [];
        // Use a similar regex to split array elements.
        const arrRegex = /\s*('[^']*'|[^,\s][^,]*)\s*(,|$)/g;
        let arrMatch: RegExpExecArray | null;
        while ((arrMatch = arrRegex.exec(inner)) !== null) {
          let element = arrMatch[1].trim();
          if (element.startsWith("'") && element.endsWith("'")) {
            element = element.slice(1, -1);
          }
          arr.push(element);
        }
        args.push(arr);
      }
    } else if (token.startsWith("'") && token.endsWith("'")) {
      args.push(token.slice(1, -1));
    } else {
      args.push(token);
    }
  }
  return args;
}

/**
 * Resolves a dot-notated path within an object.
 *
 * @param data - The data object.
 * @param path - Dot-notated path string (e.g., "address.city").
 * @returns The value at the given path, or undefined if not found.
 */
function resolveDataPath(data: Json, path: string): any {
  if (!path) return undefined;
  const parts = path.split(".");
  let current = data;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [prop: string]: Json };

/**
 * Formats a string by replacing placeholders with values from a data object.
 *
 * @param template The string containing placeholders.
 * @param data The JSON data object.
 * @returns The formatted string. Returns an empty string if the template is undefined.
 */
export function formatStringWithData(
  template: string | undefined,
  data: Json | undefined,
): string {
  if (!template) {
    return "";
  }

  const dataToUse = data || {};

  return template.replace(/{{([^{}]*?)}}/g, (match, placeholderContent) => {
    const trimmedContent = placeholderContent.trim();
    if (!trimmedContent) {
      return ""; // Empty placeholder yields an empty string.
    }

    // Check for transformation pattern: transformName(arg1, arg2, ...)
    const transformationMatch = trimmedContent.match(/^(\w+)\((.*)\)$/);
    if (transformationMatch) {
      const transformName = transformationMatch[1];
      const argsString = transformationMatch[2];
      if (!defaultTransformations.hasOwnProperty(transformName)) {
        return "#ERROR"; // Unknown transformation.
      }
      const parsedArgs = parseTransformationArgs(argsString);
      // The first argument should be the key (possibly hierarchical).
      const keyArg = parsedArgs.length > 0 ? parsedArgs[0] : "";
      const dataValue = keyArg
        ? resolveDataPath(dataToUse, String(keyArg))
        : undefined;
      const remainingArgs = parsedArgs.slice(1);
      try {
        const transformation = (defaultTransformations as any)[transformName];
        return transformation(dataValue, ...remainingArgs);
      } catch (error) {
        console.error(`Error in transformation ${transformName}:`, error);
        return "#ERROR";
      }
    } else {
      // Handle as simple or hierarchical key.
      const value = resolveDataPath(dataToUse, trimmedContent);
      return value !== undefined && value !== null ? String(value) : "";
    }
  });
}
