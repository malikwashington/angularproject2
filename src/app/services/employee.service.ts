/**
 * Employee Service
 * Provides data access methods for employee records
 * Acts as the single source of truth for employee data in the application
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  /** Path to the local JSON data file */
  private dataUrl = 'assets/data/employees.json';

  /**
   * Constructor - injects HttpClient for making HTTP requests
   * @param http - Angular's HttpClient service
   */
  constructor(private http: HttpClient) {}

  /**
   * Fetches all employee records from the JSON file
   * @returns Observable array of Employee objects
   */
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.dataUrl);
  }
}
