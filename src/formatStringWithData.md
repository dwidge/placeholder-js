# Design Document: formatStringWithData Function

## 1. Introduction

This document outlines the design for a function called `formatStringWithData`. This function will take a string containing placeholders and a JSON data object as input, and return a new string with the placeholders replaced by corresponding values from the data object. It aims to provide a flexible and robust way to dynamically generate strings based on data, particularly useful for creating user-facing messages or descriptions.

## 2. Goals

- **Clear and Concise API:** Provide a simple and intuitive function signature.
- **Flexible Placeholder Syntax:** Support a hierarchical placeholder syntax (e.g., `{{data.level1.level2}}`), and value transformations.
- **Robust Error Handling:** Gracefully handle missing data, invalid placeholder syntax, or transformation errors without crashing.
- **Type Safety:** Leverage TypeScript for strong typing and improved code maintainability.
- **Performance:** Optimize for common use cases without sacrificing readability.

## 3. Non-Goals

- **Complex Template Languages:** This function is not intended to be a full-fledged template engine. It focuses on simple placeholder replacement and basic transformations.
- **Extensive Data Transformation:** While basic transformations are supported, the function is not meant for complex data manipulations. For extensive transformations, data should ideally be pre-processed before being passed to the function.
- **Custom Transformation Functions (Initially):** In the first iteration, only a predefined set of transformations (`default`, `date`, `replace`) will be supported. Extensibility for custom transformations might be considered in future iterations.

## 4. Function Signature

```typescript
/**
 * Formats a string by replacing placeholders with values from a data object.
 *
 * @param template The string containing placeholders.
 * @param data The JSON data object.
 * @returns The formatted string. Returns an empty string if the template is undefined.
 */
function formatStringWithData(
  template: string | undefined,
  data: Record<string, any> | undefined,
): string {
  // ... implementation details ...
}
```

## 5. Placeholder Syntax

The function will support the following placeholder syntax:

- **Simple Key:** `{{key}}` - Replaces with the value associated with the `key` in the data object. If the key is not found, it will be replaced with an empty string.
- **Hierarchical Key:** `{{key.level1.level2}}` - Traverses nested objects to retrieve the value. If any level in the hierarchy is not found, it will be replaced with an empty string.
- **Value Transformations:** `{{transformName(key, arg1, arg2, ...)}}` - Applies a transformation function to the value retrieved from the `key`.

  - `transformName`: The name of the transformation function (e.g., `default`, `date`, `replace`).
  - `key`: The key (can be hierarchical) to retrieve the data value.
  - `arg1, arg2, ...`: Optional arguments for the transformation function. Arguments are comma-separated. String values should be enclosed in single quotes (e.g., `'string value'`).

  **Predefined Transformations:**

  - **`default(key, 'defaultValue')`:** If the value at `key` is `undefined` or `null`, it replaces the placeholder with `'defaultValue'`.
  - **`date(key)`:** Attempts to format the value at `key` as a date. It expects the value to be a number (timestamp in seconds, or a date string parsable by `Date` constructor). If the value is not a valid date representation or if there's an error during date formatting, it will return `#ERROR`. (Default date formatting using `toLocaleDateString` will be used. More specific formatting options can be added later if needed).
  - **`replace(key, ['search1', 'replace1'], ['search2', 'replace2'], ...)`:** Performs multiple string replacements on the value retrieved from `key`. It takes pairs of search and replace strings as arguments. Replacements are applied sequentially in the order they are provided. For example, `replace(key, ['x', 'Xxx'], ['y', 'Yyy'])` will first replace all occurrences of 'x' with 'Xxx', and then in the resulting string, replace all occurrences of 'y' with 'Yyy'.

## 6. Implementation Details

### 6.1. Input Validation:

- Check if `template` is `undefined`. If it is, return an empty string `""`.
- Check if `data` is `undefined`. If it is, treat it as an empty object `{}`.

### 6.2. Regular Expression:

- Use a regular expression to identify placeholders in the template. A suitable regex would be:

  ```regex
  /{{([^{}]+?)}}/g
  ```

  This regex captures the content within the double curly braces. The `?` after `+` makes the quantifier non-greedy, which is important to handle nested curly braces correctly (though nested braces are not intended to be supported as placeholders themselves, non-greedy matching is still a good practice).

### 6.3. Placeholder Replacement:

- Iterate through the matches found by the regular expression.
- For each match:
  1.  **Extract Placeholder Content:** Extract the content within the curly braces (e.g., `key.level1.level2`, `date(aaa.bbb.ccc)`, `replace(aaa.bbb.ccc, ['x','Xxx'], ['y','Yyy'])`).
  2.  **Parse Placeholder Content:**
      - **Check for Transformation:** Check if the content starts with a function name followed by `(`. If it does, it's a transformation.
        - **Parse Transformation:**
          - Extract the `transformName` (the part before the first `(`).
          - Extract the arguments within the parentheses. Arguments are comma-separated. Unquoted arguments can be a number, or a `key` (which can be hierarchical). Quoted arguments should be parsed as strings, recognizing single quotes as delimiters. Arrays use square brackets.
        - **Retrieve Value:** Get the values from the `data` object using the extracted `key` arguments. Handle hierarchical keys by splitting the key by `.` and traversing the data object. If any part of the path is not found, return `undefined`.
        - **Apply Transformation:** Based on the `transformName`, apply the corresponding transformation function to the retrieved value and arguments.
          - **`default` transformation:** If the retrieved value is `undefined` or `null`, return the provided default value argument. Otherwise, return the retrieved value.
          - **`date` transformation:** Attempt to create a `Date` object from the value. If successful, format it using `toLocaleDateString()` and return the formatted string. If not a valid date, or if any error occurs during date formatting, return `'#ERROR'`.
          - **`replace` transformation:** This transformation performs sequential string replacements. It expects pairs of search and replace strings as arguments after the key. For each pair (`search`, `replace`), it performs a global string replacement on the retrieved value. Return the final modified string.
        - **Use Transformed Value:** Use the transformed value as the replacement. If transformation results in `'#ERROR'`, use `'#ERROR'` as the replacement string.
      - **If not a Transformation:** Handle as a simple or hierarchical key:
        - **Simple/Hierarchical Key:** Split the content by `.`. Traverse the `data` object using the parts of the path. If any part of the path is not found, return `undefined`. If the entire path is resolved, return the value found. If the resolved value is `undefined`, treat it as an empty string for replacement.
  3.  **Replace Placeholder:** Replace the placeholder in the template with the retrieved (or transformed) value (converted to a string). If the retrieved value was `undefined` for a simple/hierarchical key, replace with an empty string `""`. If the placeholder's content syntax is invalid, return `#ERROR`.

### 6.4. Error Handling:

- Use `try...catch` blocks to handle potential errors during data access, date parsing, or transformation execution.
- Log errors to the console for debugging purposes (optional).
- For transformations, if an error occurs during transformation, return `'#ERROR'` as the replacement value. For simple/hierarchical key lookups, if a key is not found at any level, the lookup function should gracefully return `undefined` which is then handled as an empty string replacement.

## 7. Example Usage

```typescript
const data = {
  name: "John Doe",
  age: 30,
  address: {
    city: "New York",
    country: "USA",
  },
  isActive: true,
  favoriteColor: "blue",
  timestamp: 1678886400, // Example timestamp in seconds (March 15, 2023)
  numericString: "123",
  description: "This is a test with x and y.",
  booleanValue: true,
  items: ["apple", "banana", "cherry"],
};

const template1 = "Hello, {{name}}! You are {{age}} years old.";
const formatted1 = formatStringWithData(template1, data); // "Hello, John Doe! You are 30 years old."

const template2 = "You live in {{address.city}}, {{address.country}}.";
const formatted2 = formatStringWithData(template2, data); // "You live in New York, USA."

const template3 = "Is active: {{isActive}}";
const formatted3 = formatStringWithData(template3, data); // "Is active: true"

const template4 = "Favorite color: {{default(favoriteColor, 'unknown')}}";
const formatted4 = formatStringWithData(template4, data); // "Favorite color: blue"

const template5 = "Missing data: {{nonExistentKey}}";
const formatted5 = formatStringWithData(template5, data); // "Missing data: " (empty string)

const template6 = "Date: {{date(timestamp)}}";
const formatted6 = formatStringWithData(template6, data); // "Date: 3/15/2023" (or locale-specific date string)

const template7 = "Date Error: {{date(name)}}"; // 'name' is not a valid date
const formatted7 = formatStringWithData(template7, data); // "Date Error: #ERROR"

const template8 =
  "Default with missing key: {{default(missingKey, 'Not Found')}}";
const formatted8 = formatStringWithData(template8, data); // "Default with missing key: Not Found"

const template9 =
  "Replace example: {{replace(description, ['x', 'X'], ['y', 'Y'])}}";
const formatted9 = formatStringWithData(template9, data); // "Replace example: This is a test with X and Y."

const template10 =
  "Multiple replace: {{replace(description, ['is', 'WAS'], ['test', 'T'])}}";
const formatted10 = formatStringWithData(template10, data); // "Multiple replace: ThWAS WAS a T with x and y."

const template11 =
  "Nested key with transformation: {{date(address.timestamp)}}"; // Assuming address.timestamp is undefined in data
const formatted11 = formatStringWithData(template11, data); // "Nested key with transformation: " (because address.timestamp is undefined)

const template12 =
  "Boolean Replace: {{replace(booleanValue, ['true', 'yes'], ['false', 'no'])}}";
const formatted12 = formatStringWithData(template12, data); // "Boolean Replace: yes"

const template13 = undefined;
const formatted13 = formatStringWithData(template13, data); // "" (empty string)

const template14 = "Undefined Data: {{name}}";
const formatted14 = formatStringWithData(template14, undefined); // "Undefined Data: " (empty string because undefined data is treated as {})

const template15 = "Empty Template: ";
const formatted15 = formatStringWithData(template15, data); // "Empty Template: "

const template16 = "Template with empty placeholder: {{}}";
const formatted16 = formatStringWithData(template16, data); // "Template with empty placeholder: " (empty placeholder is treated as empty string)

const template17 =
  "Hierarchical default: {{default(address.city, 'Unknown City')}}";
const formatted17 = formatStringWithData(template17, {
  address: { country: "USA" },
}); // "Hierarchical default: Unknown City" (address.city is missing)

const template18 = "List item: {{items.0}}";
const formatted18 = formatStringWithData(template18, data); // "List item: apple"

const template19 = "Deeply nested missing key: {{address.location.zip}}";
const formatted19 = formatStringWithData(template19, data); // "Deeply nested missing key: " (empty string)

const template20 = "Invalid Placeholder: {{name"; // Unclosed brace
const formatted20 = formatStringWithData(template20, data); // "Invalid Placeholder: {{name" (not detected as placeholder, treated as literal string)
```

## 8. Testing

### 8.1. Unit Tests:

Write unit tests to cover various scenarios, including:

- **Simple key replacement**
- **Hierarchical key replacement**
- **Default value handling (`default` transformation)**
- **Missing data (simple and hierarchical keys)**
- **Invalid placeholder syntax (e.g., unclosed braces) - should be treated as literal string**
- **Error handling for basic placeholders (though errors should be gracefully handled as empty strings)**
- **`date` transformation:**
  - Valid timestamp (milliseconds and seconds)
  - Valid date string
  - Invalid date value (non-numeric string, incorrect format) - should return `'#ERROR'`
  - Missing key for `date` transformation - should return `''` empty string
- **`replace` transformation:**
  - Single replacement
  - Multiple replacements
  - No match for replacement - should not modify the original string in that part.
  - Empty search string - should be no-op.
  - Missing key for `replace` transformation - should return `''`
  - Correct handling of `replaceList` as pairs of strings.
- **Boolean replacement using `replace`**.
- **Transformation error handling:** Verify that `'#ERROR'` is returned when transformations fail (e.g., invalid date, bad syntax) but return empty string when missing key in transformation.
- **Combination of transformations and other placeholder types.**
- **Undefined and empty template inputs.**
- **Undefined data input.**

### 8.2. Integration Tests:

- Test the function with real-world data and templates.
- Test with complex nested JSON data.
- Test with templates containing a mix of all placeholder types.

## 9. Future Considerations

- **Extensible Transformations:** Allow users to register custom transformation functions to extend the functionality beyond the predefined `date` and `replace`. This could be done by providing a configuration option or a function to register new transformations.
- **Custom Date Formatting:** Provide options to specify date formats within the `date()` transformation, e.g., `{{date(timestamp, format='YYYY/MM/DD')}}`.
- **Caching:** Cache frequently used templates and data to improve performance, especially if template parsing is expensive.
- **Security:** Sanitize input data to prevent potential security vulnerabilities (e.g., cross-site scripting), especially if the data source is untrusted.
- **More Complex Logic:** Consider adding support for more complex logic within placeholders (e.g., mathematical expressions, string manipulation functions beyond replace). However, this should be carefully evaluated to avoid making the function too complex and potentially introducing security risks.
- **Improved Argument Parsing for Transformations:** Handle quoted string values in transformation arguments to allow for commas or equals signs within string arguments if needed in the future. For now, simple comma-separated arguments with single-quoted string literals are sufficient.
- **Whitespace Handling:** Define how whitespace around placeholders and within placeholders should be handled (e.g., trimming, preserving). Currently, the regex and examples suggest preserving whitespace within placeholders and around them in the template.
