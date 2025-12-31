/**
 * Search Service
 * Provides fuzzy search functionality for filtering employee data
 * Uses Levenshtein distance and subsequence matching algorithms
 */
import { Injectable } from '@angular/core';
import { Employee } from '../models/employee.model';

/** Interface for fuzzy match result with score */
interface FuzzyResult {
  /** The employee record */
  employee: Employee;
  /** The fuzzy match score (higher is better) */
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  /** Minimum fuzzy match score threshold (0-1) */
  private fuzzyThreshold = 0.3;

  /**
   * Searches employees using fuzzy matching across all text fields
   * Returns employees sorted by best match score
   * @param employees - Array of employees to search
   * @param searchTerm - The search term to match
   * @returns Filtered and scored array of employees
   */
  searchEmployees(employees: Employee[], searchTerm: string): Employee[] {
    // Return all employees if no search term
    if (!searchTerm.trim()) {
      return [...employees];
    }

    const term = searchTerm.trim();
    const results: FuzzyResult[] = [];

    for (const employee of employees) {
      // Calculate fuzzy score for each searchable field
      const scores = [
        this.fuzzyMatchScore(term, employee.first_name),
        this.fuzzyMatchScore(term, employee.last_name),
        this.fuzzyMatchScore(term, employee.email),
        this.fuzzyMatchScore(term, employee.role),
        this.fuzzyMatchScore(term, employee.department),
        this.fuzzyMatchScore(term, employee.status),
        // Also check combined first + last name
        this.fuzzyMatchScore(term, `${employee.first_name} ${employee.last_name}`)
      ];

      // Use the highest score from any field
      const bestScore = Math.max(...scores);

      // Include if score meets threshold
      if (bestScore >= this.fuzzyThreshold) {
        results.push({ employee, score: bestScore });
      }
    }

    // Sort by score (highest first) for relevance ranking
    results.sort((a, b) => b.score - a.score);

    // Return just the employee objects
    return results.map((r) => r.employee);
  }

  /**
   * Calculates a fuzzy match score between search term and target string
   * Uses a combination of:
   * - Substring matching (exact containment)
   * - Levenshtein distance (edit distance similarity)
   * - Subsequence matching (characters in order)
   * @param searchTerm - The search term to match
   * @param target - The target string to match against
   * @returns Score between 0 and 1 (1 = perfect match)
   */
  private fuzzyMatchScore(searchTerm: string, target: string): number {
    const search = searchTerm.toLowerCase();
    const text = target.toLowerCase();

    // Perfect match
    if (text === search) {
      return 1.0;
    }

    // Exact substring match (high score)
    if (text.includes(search)) {
      return 0.9;
    }

    // Check if search term starts with target or vice versa
    if (text.startsWith(search) || search.startsWith(text)) {
      return 0.85;
    }

    // Subsequence match - all characters appear in order
    const subsequenceScore = this.subsequenceMatchScore(search, text);
    if (subsequenceScore > 0) {
      return 0.5 + (subsequenceScore * 0.3);
    }

    // Levenshtein distance-based similarity
    const maxLen = Math.max(search.length, text.length);
    if (maxLen === 0) return 0;

    const distance = this.levenshteinDistance(search, text);
    const similarity = 1 - (distance / maxLen);

    // Only return if similarity is reasonable
    return similarity > 0.4 ? similarity * 0.7 : 0;
  }

  /**
   * Calculates the Levenshtein distance between two strings
   * This measures the minimum number of single-character edits needed
   * to transform one string into another
   * @param str1 - First string
   * @param str2 - Second string
   * @returns The edit distance between the strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Create a matrix to store distances
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Initialize first column (deletions from str1)
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }

    // Initialize first row (insertions to str1)
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          // Characters match, no edit needed
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          // Take minimum of insert, delete, or replace
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // Delete
            dp[i][j - 1],     // Insert
            dp[i - 1][j - 1]  // Replace
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Calculates a subsequence match score
   * Checks if all characters in the search term appear in the target in order
   * @param search - The search term
   * @param text - The target text
   * @returns Score between 0 and 1 based on match quality
   */
  private subsequenceMatchScore(search: string, text: string): number {
    let searchIndex = 0;
    let consecutiveMatches = 0;
    let maxConsecutive = 0;

    for (let i = 0; i < text.length && searchIndex < search.length; i++) {
      if (text[i] === search[searchIndex]) {
        searchIndex++;
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 0;
      }
    }

    // All characters found in order
    if (searchIndex === search.length) {
      // Score based on consecutive matches and total length
      const baseScore = searchIndex / text.length;
      const consecutiveBonus = maxConsecutive / search.length;
      return (baseScore + consecutiveBonus) / 2;
    }

    return 0;
  }
}
