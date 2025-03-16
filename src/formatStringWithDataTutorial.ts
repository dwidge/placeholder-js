export const formatStringWithDataTutorial = `
Mini-Tutorial: Using Templates to Insert Data

This tutorial explains how to use templates to automatically insert data into strings. You'll be writing templates, and a program will use these to create customized text.

**What are Templates?**

Templates are strings that contain special placeholders. These placeholders act like empty slots that will be filled with data.  Think of it like a Mad Libs game, but for computers!

**Placeholders: Inserting Data**

Placeholders are marked by double curly braces: \`{{ ... }}\`.  Inside the braces, you tell the system *what* data to insert.

**1. Simple Data Insertion:**

If your data looks like this:

\`\`\`json
{
  "name": "Alice",
  "city": "London"
}
\`\`\`

And you want to use the "name", you write a template like this:

\`Hello, {{name}}!\`

The system will look for "name" in your data and replace \`{{name}}\` with "Alice". The result will be:

\`Hello, Alice!\`

Similarly, \`{{city}}\` would become "London".

**2. Getting Data from Inside Objects (Hierarchical Data):**

Sometimes your data is organized in objects within objects, like this:

\`\`\`json
{
  "user": {
    "firstName": "Bob",
    "address": {
      "street": "Main Street",
      "zipCode": "12345"
    }
  }
}
\`\`\`

To get the "firstName", you'd use: \`{{user.firstName}}\`
To get the "zipCode", you'd use: \`{{user.address.zipCode}}\`

Use dots (\`.\`) to go deeper into the data structure.

**3. Using Transformations (Making Data Look Different):**

Sometimes you need to change how the data looks. We have special "transformations" for this.

* **\`default(key, 'defaultValue')\`**:  If the data for \`key\` is missing, use \`'defaultValue'\` instead.

   Example Data:
   \`\`\`json
   { "product": "Laptop" }
   \`\`\`
   Template:
   \`Product: {{product}}. Description: {{default(description, 'No description available')}}\`
   Result:
   \`Product: Laptop. Description: No description available\` (because "description" is missing)

* **\`date(key)\`**: Format a date from the data at \`key\`.  It expects a number (like a timestamp) or a date string.

   Example Data:
   \`\`\`json
   { "eventDate": 1678886400 } // This is a timestamp
   \`\`\`
   Template:
   \`Event on: {{date(eventDate)}}\`
   Result (might look like):
   \`Event on: 3/15/2023\` (the exact format depends on your computer's settings)

* **\`replace(key, ['search1', 'replace1'], ['search2', 'replace2'], ...)\`**:  Find and replace text in the data at \`key\`. You give pairs of text to find and what to replace it with.

   Example Data:
   \`\`\`json
   { "message": "This is a test with x and y." }
   \`\`\`
   Template:
   \`Modified message: {{replace(message, ['x', 'EX'], ['y', 'WHY'])}}\`
   Result:
   \`Modified message: This is a test with EX and WHY.\`

**Putting it all Together - Examples:**

Let's say your data is:

\`\`\`json
{
  "itemName": "Book",
  "price": 25,
  "availability": null,
  "lastUpdated": 1689283200,
  "notes": "Special offer for x-mas"
}
\`\`\`

Here are some example templates and what they would produce:

* \`Item: {{itemName}}, Price: \${{ price }}\`  ->  \`Item: Book, Price: $25\`
* \`Availability: {{default(availability, 'In Stock')}}\` -> \`Availability: In Stock\` (because availability is \`null\`)
* \`Last updated on: {{date(lastUpdated)}}\` -> \`Last updated on: 7/14/2023\` (approximately)
* \`Important: {{replace(notes, ['x-mas', 'Christmas'])}}\` -> \`Important: Special offer for Christmas\`

**What if Data is Missing?**

If you try to use a placeholder for data that doesn't exist, you'll usually get an empty space in your final text.  For example, if "description" is not in the data and you use \`{{description}}\`, it will just be blank.

**What about Errors?**

If there's a problem with a transformation (like trying to get a date from something that's not a date), you might see \`"#ERROR"\` in your text. This tells you something went wrong with that specific placeholder.

**Start Writing Templates!**

Now you know the basics!  You can use these placeholders and transformations to create dynamic text based on your data. Experiment and have fun!
`;
