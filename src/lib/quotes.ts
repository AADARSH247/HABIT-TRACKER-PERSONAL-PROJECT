export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Atomic habits yield compounding results. Little changes make a big difference.", author: "James Clear" },
  { text: "It is easier to prevent bad habits than to break them.", author: "Benjamin Franklin" },
  { text: "Your habits will determine your future.", author: "Jack Canfield" },
  { text: "Consistency is key. Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Successful people are simply those with successful habits.", author: "Brian Tracy" },
  { text: "All big things come from small beginnings. The seed of every habit is a single, tiny decision.", author: "James Clear" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }
];

export function getRandomQuote(): Quote {
  // Use today's date to select a quote so it changes once per day
  const today = new Date();
  const index = (today.getFullYear() + today.getMonth() + today.getDate()) % quotes.length;
  return quotes[index];
}
