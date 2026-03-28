const genderWords = ["women", "woman", "female", "men", "man", "male", "girls", "boys", "pink"];

function cleanKeywords(input) {
  let words = input.toLowerCase().split(" ");

  let filtered = words.filter(word => !genderWords.includes(word));

  return filtered.join(" ");
}

module.exports = cleanKeywords;