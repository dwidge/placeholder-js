import { test, describe } from "node:test";
import { expect } from "expect";
import { formatStringWithData } from "./formatStringWithData.js";

describe("formatStringWithData", () => {
  test("Simple key replacement", () => {
    const template = "Hello, {{name}}!";
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe("Hello, John Doe!");
  });

  test("Hierarchical key replacement", () => {
    const template = "You live in {{address.city}}, {{address.country}}.";
    const data = { address: { city: "New York", country: "USA" } };
    expect(formatStringWithData(template, data)).toBe(
      "You live in New York, USA.",
    );
  });

  test("Default value handling (default transformation) with existing key", () => {
    const template = "Favorite color: {{default(favoriteColor, 'unknown')}}";
    const data = { favoriteColor: "blue" };
    expect(formatStringWithData(template, data)).toBe("Favorite color: blue");
  });

  test("Default value handling (default transformation) - missing key", () => {
    const template = "Favorite color: {{default(favoriteColor, 'unknown')}}";
    const data = {};
    expect(formatStringWithData(template, data)).toBe(
      "Favorite color: unknown",
    );
  });

  test("Missing data (simple key)", () => {
    const template = "Missing data: {{nonExistentKey}}";
    const data = {};
    expect(formatStringWithData(template, data)).toBe("Missing data: ");
  });

  test("Missing data (hierarchical key)", () => {
    const template = "Missing data: {{address.street}}";
    const data = { address: { city: "New York" } };
    expect(formatStringWithData(template, data)).toBe("Missing data: ");
  });

  test("Invalid placeholder syntax (unclosed braces) - literal string", () => {
    const template = "Invalid Placeholder: {{name";
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe(
      "Invalid Placeholder: {{name",
    );
  });

  test("Date transformation - valid timestamp (seconds)", () => {
    const template = "Date: {{date(timestamp)}}";
    const data = { timestamp: 1678886400 }; // March 15, 2023 in seconds
    const formattedDate = new Date(1678886400 * 1000).toLocaleDateString();
    expect(formatStringWithData(template, data)).toBe(`Date: ${formattedDate}`);
  });

  test("Date transformation - valid timestamp (milliseconds)", () => {
    const timestampMs = 1678886400000; // milliseconds
    const template = "Date: {{date(timestamp)}}";
    const data = { timestamp: timestampMs };
    const formattedDate = new Date(timestampMs).toLocaleDateString();
    expect(formatStringWithData(template, data)).toBe(`Date: ${formattedDate}`);
  });

  test("Date transformation - invalid date value (string)", () => {
    const template = "Date Error: {{date(name)}}";
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe("Date Error: #ERROR");
  });

  test("Date transformation - missing key", () => {
    const template = "Date Error: {{date(missingKey)}}";
    const data = {};
    expect(formatStringWithData(template, data)).toBe("Date Error: ");
  });

  test("Replace transformation - single replacement", () => {
    const template = "Replace example: {{replace(description, ['x', 'X'])}}";
    const data = { description: "This is a test with x." };
    expect(formatStringWithData(template, data)).toBe(
      "Replace example: This is a test with X.",
    );
  });

  test("Replace transformation - multiple replacements", () => {
    const template =
      "Multiple replace: {{replace(description, ['is', 'WAS'], ['test', 'T'])}}";
    const data = { description: "This is a test." };
    // Expected: "ThWAS WAS a T." because "This" becomes "ThWAS" and "test" becomes "T"
    expect(formatStringWithData(template, data)).toBe(
      "Multiple replace: ThWAS WAS a T.",
    );
  });

  test("Replace transformation - no match", () => {
    const template = "Replace no match: {{replace(description, ['z', 'Z'])}}";
    const data = { description: "This is a test." };
    expect(formatStringWithData(template, data)).toBe(
      "Replace no match: This is a test.",
    );
  });

  test("Replace transformation - empty search string (no-op)", () => {
    const template =
      "Replace empty search: {{replace(description, ['', 'Z'])}}";
    const data = { description: "This is a test." };
    expect(formatStringWithData(template, data)).toBe(
      "Replace empty search: This is a test.",
    );
  });

  test("Replace transformation - missing key", () => {
    const template = "Replace missing key: {{replace(missingKey, ['x', 'X'])}}";
    const data = {};
    expect(formatStringWithData(template, data)).toBe("Replace missing key: ");
  });

  test("Boolean replacement using replace", () => {
    const template =
      "Boolean Replace: {{replace(booleanValue, ['true', 'yes'], ['false', 'no'])}}";
    const data = { booleanValue: true };
    // "true" is converted to string "true", then replaced with "yes"
    expect(formatStringWithData(template, data)).toBe("Boolean Replace: yes");
  });

  test("Transformation error handling - date transformation error", () => {
    const template = "Transformation Error: {{date(invalidDate)}}";
    const data = { invalidDate: "not a date" };
    expect(formatStringWithData(template, data)).toBe(
      "Transformation Error: #ERROR",
    );
  });

  test("Transformation error handling - default transformation missing key", () => {
    const template =
      "Transformation Missing Key: {{default(missingKey, 'defaultValue')}}";
    const data = {};
    expect(formatStringWithData(template, data)).toBe(
      "Transformation Missing Key: defaultValue",
    );
  });

  test("Unknown transformation returns #ERROR", () => {
    const template = "Unknown: {{unknownTransform(name)}}";
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe("Unknown: #ERROR");
  });

  test("Combination of transformations and simple keys", () => {
    const template =
      "Hello {{name}}, Date: {{date(timestamp)}}, Default: {{default(missingKey, 'fallback')}}";
    const data = { name: "Jane Doe", timestamp: 1678886400 };
    const formattedDate = new Date(1678886400 * 1000).toLocaleDateString();
    expect(formatStringWithData(template, data)).toBe(
      `Hello Jane Doe, Date: ${formattedDate}, Default: fallback`,
    );
  });

  test("Undefined template input", () => {
    const template = undefined;
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe("");
  });

  test("Empty template input", () => {
    const template = "";
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe("");
  });

  test("Undefined data input", () => {
    const template = "Hello, {{name}}!";
    const data = undefined;
    expect(formatStringWithData(template, data)).toBe("Hello, !");
  });

  test("Empty placeholder {{}}", () => {
    const template = "Empty Placeholder: {{}}";
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe("Empty Placeholder: ");
  });

  test("Hierarchical default - missing nested key", () => {
    const template =
      "Hierarchical default: {{default(address.city, 'Unknown City')}}";
    const data = { address: { country: "USA" } };
    expect(formatStringWithData(template, data)).toBe(
      "Hierarchical default: Unknown City",
    );
  });

  test("List item access", () => {
    const template = "List item: {{items.0}}";
    const data = { items: ["apple", "banana", "cherry"] };
    expect(formatStringWithData(template, data)).toBe("List item: apple");
  });

  test("Deeply nested missing key", () => {
    const template = "Deeply nested missing key: {{address.location.zip}}";
    const data = { address: { city: "New York" } };
    expect(formatStringWithData(template, data)).toBe(
      "Deeply nested missing key: ",
    );
  });

  test("Invalid Placeholder: unclosed brace at the end", () => {
    const template = "Invalid Placeholder: {{name";
    const data = { name: "John Doe" };
    expect(formatStringWithData(template, data)).toBe(
      "Invalid Placeholder: {{name",
    );
  });

  test("Replace transformation with multiple search-replace pairs", () => {
    const template =
      "Multiple replace pairs: {{replace(description, ['x', 'Xxx'], ['y', 'Yyy'])}}";
    const data = { description: "This is a test with x and y." };
    expect(formatStringWithData(template, data)).toBe(
      "Multiple replace pairs: This is a test with Xxx and Yyy.",
    );
  });
});
