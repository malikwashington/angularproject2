/**
 * Employee Service
 * Provides data access methods for employee records
 * Acts as the single source of truth for employee data in the application
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, timeout, catchError, shareReplay } from 'rxjs/operators';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  /** Path to the local JSON data file */
  private dataUrl = 'assets/data/employees.json';

  /** Cached employee data observable for sharing across subscribers */
  private employeesCache$: Observable<Employee[]> | null = null;

  /**
   * Constructor - injects HttpClient for making HTTP requests
   * @param http - Angular's HttpClient service
   */
  constructor(private http: HttpClient) {}

  /**
   * Fetches all employee records from the JSON file
   * Includes retry logic and caching for reliability
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   * @returns Observable array of Employee objects
   */
  getEmployees(forceRefresh = false): Observable<Employee[]> {
    // Return cached data if available and not forcing refresh
    if (this.employeesCache$ && !forceRefresh) {
      return this.employeesCache$;
    }

    // Fetch with retry logic, timeout, and caching
    this.employeesCache$ = this.http.get<Employee[]>(this.dataUrl).pipe(
      timeout(10000),  // 10 second timeout
      retry(3),        // Retry up to 3 times on failure
      shareReplay(1)   // Cache the result for subsequent subscribers
    );

    return this.employeesCache$;
  }

  /**
   * Clears the cached employee data
   * Call this before getEmployees(true) to force a fresh fetch
   */
  clearCache(): void {
    this.employeesCache$ = null;
  }
}
