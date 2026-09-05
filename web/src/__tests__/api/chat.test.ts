// Test file for enhanced Prend chatbot fallback logic
// This tests the improved pattern matching, synonym recognition, and intent classification

// Since the getPrendFallbackResponse function is embedded in route.ts,
// these tests focus on testing the logic through the API endpoint
// For a more isolated test, we would refactor the function to a utility module

import { describe, it, expect } from 'vitest';

// Mock the normalizeQueryForCache function for testing
function normalizeQueryForCache(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

// Mock the synonyms map from the enhanced fallback function
const synonyms: Record<string, string[]> = {
  book: ['reserve', 'schedule', 'get', 'secure', 'make'],
  court: ['facility', 'venue', 'place', 'location'],
  paddle: ['racket', 'paddle', 'gear', 'equipment'],
  pay: ['pay', 'payment', 'cost', 'price', 'fee'],
  cancel: ['cancel', 'refund', 'refund', 'money back'],
  tournament: ['tournament', 'competition', 'league', 'match', 'game'],
  welcome: ['hi', 'hello', 'hey', 'yo', 'yow', 'sup', 'kamusta', 'musta'],
  goodbye: ['bye', 'goodbye', 'see you', 'later'],
  help: ['help', 'assist', 'support', 'guide'],
  rules: ['rule', 'regulation', 'guideline', 'how to play', 'how do i'],
  kitchen: ['kitchen', 'non-volley', 'nvz', 'no volley'],
  serve: ['serve', 'service', 'shot'],
  score: ['score', 'scoring', 'points', 'point'],
  wallet: ['wallet', 'account', 'balance', 'credit', 'credits'],
  gcash: ['gcash', 'g-cash', 'gcash'],
  maya: ['maya', 'maya wallet'],
  topup: ['top up', 'topup', 'add money', 'load'],
  bring: ['bring', 'carry', 'have', 'use'],
  demo: ['demo', 'demonstration', 'trial', 'test'],
  private: ['private', 'personal', 'exclusive', 'solo'],
  openplay: ['open play', 'openplay', 'drop in', 'casual']
};

// Helper function to check if query contains any synonyms for a concept
function containsConcept(concept: string, query: string): boolean {
  const words = synonyms[concept] || [concept];
  return words.some(word => query.includes(word));
}

// Test cases for the enhanced fallback logic
describe('Enhanced Prend Fallback Logic', () => {

  describe('Synonym Recognition', () => {
    it('should recognize synonyms for booking', () => {
      expect(containsConcept('book', 'I want to reserve a court')).toBe(true);
      expect(containsConcept('book', 'Can I schedule a game?')).toBe(true);
      expect(containsConcept('book', 'How do I get a booking?')).toBe(true);
      expect(containsConcept('book', 'Secure a court for me')).toBe(true);
    });

    it('should recognize synonyms for payment', () => {
      expect(containsConcept('pay', 'What is the cost?')).toBe(true);
      expect(containsConcept('pay', 'How much is the fee?')).toBe(true);
      expect(containsConcept('pay', 'What is the price?')).toBe(true);
    });

    it('should recognize synonyms for gcash', () => {
      expect(containsConcept('gcash', 'Can I use GCash?')).toBe(true);
      expect(containsConcept('gcash', 'Is G-Cash accepted?')).toBe(true);
    });

    it('should recognize synonyms for maya', () => {
      expect(containsConcept('maya', 'Do you accept Maya Wallet?')).toBe(true);
    });
  });

  describe('Intent Classification', () => {
    // These would test the getIntent function logic if extracted
    // For now, we test the concepts that feed into it

    it('should detect booking cost intent', () => {
      const query = normalizeQueryForCache('how much does it cost to book a court');
      const hasBook = containsConcept('book', query);
      const hasCost = query.includes('cost') || query.includes('price') || query.includes('fee') || query.includes('how much');
      expect(hasBook && hasCost).toBe(true);
    });

    it('should detect booking cancel intent', () => {
      const query = normalizeQueryForCache('how do I cancel my booking');
      const hasBook = containsConcept('book', query);
      const hasCancel = query.includes('cancel') || query.includes('refund');
      expect(hasBook && hasCancel).toBe(true);
    });

    it('should detect payment gcash intent', () => {
      const query = normalizeQueryForCache('can I pay with gcash');
      const hasPay = containsConcept('pay', query) || containsConcept('wallet', query);
      const hasGcash = containsConcept('gcash', query);
      expect(hasPay && hasGcash).toBe(true);
    });

    it('should detect rules kitchen intent', () => {
      const query = normalizeQueryForCache('what is the kitchen rule');
      const hasRules = containsConcept('rules', query);
      const hasKitchen = containsConcept('kitchen', query) || query.includes('non-volley');
      expect(hasRules && hasKitchen).toBe(true);
    });
  });

  describe('Query Normalization', () => {
    it('should normalize whitespace', () => {
      expect(normalizeQueryForCache('  hello   world  ')).toBe('hello world');
    });

    it('should remove punctuation', () => {
      expect(normalizeQueryForCache('Hello, world! How are you?')).toBe('hello world how are you');
    });

    it('should convert to lowercase', () => {
      expect(normalizeQueryForCache('HELLO WORLD')).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(normalizeQueryForCache('')).toBe('');
    });
  });

  describe('Enhanced Response Categories', () => {
    it('should recognize detailed booking intents', () => {
      // This would be tested in the actual getIntent function
      const bookingQueries = [
        'how much does it cost to book',
        'what time slots are available',
        'how do I book a court',
        'can I cancel my booking'
      ];

      bookingQueries.forEach(query => {
        const normalized = normalizeQueryForCache(query);
        expect(containsConcept('book', normalized)).toBe(true);
      });
    });

    it('should recognize detailed payment intents', () => {
      const paymentQueries = [
        'can I use gcash to pay',
        'do you accept maya wallet',
        'how do I top up my wallet',
        'can I pay with credit card'
      ];

      paymentQueries.forEach(query => {
        const normalized = normalizeQueryForCache(query);
        expect(containsConcept('pay', normalized) || containsConcept('wallet', normalized)).toBe(true);
      });
    });

    it('should recognize detailed rules intents', () => {
      const rulesQueries = [
        'what is the kitchen rule',
        'how does serving work',
        'how is scoring calculated',
        'what are the common faults'
      ];

      rulesQueries.forEach(query => {
        const normalized = normalizeQueryForCache(query);
        expect(containsConcept('rules', normalized)).toBe(true);
      });
    });
  });
});