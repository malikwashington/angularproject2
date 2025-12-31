/**
 * Data Table Component
 * Displays employee data in a sortable and paginated table
 * Search functionality is handled by a separate service
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { SearchService } from '../../services/search.service';

/** Type definition for sort direction */
type SortDirection = 'asc' | 'desc';

/** Interface for tracking current sort state */
interface SortState {
  /** The column currently being sorted */
  column: keyof Employee | '';
  /** The direction of the sort */
  direction: SortDirection;
}

@Component({
  selector: 'app-data-table',
  standalone: false,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnDestroy {
  /** All employees loaded from the service */
  allEmployees: Employee[] = [];

  /** Employees after applying search filter */
  filteredEmployees: Employee[] = [];

  /** Employees to display on the current page */
  displayedEmployees: Employee[] = [];

  /** Current search term entered by the user */
  searchTerm = '';

  /** Current sort state */
  sortState: SortState = {
    column: 'first_name',
    direction: 'asc'
  };

  /** Current page number (1-indexed) */
  currentPage = 1;

  /** Number of records to display per page */
  pageSize = 10;

  /** Total number of pages */
  totalPages = 0;

  /** Loading state indicator */
  isLoading = true;

  /** Error message if data loading fails */
  errorMessage = '';

  /** Subject for debouncing search input */
  private searchSubject = new Subject<string>();

  /** Subscription to the debounced search observable */
  private searchSubscription: Subscription | null = null;

  /**
   * Constructor - injects required services
   * @param employeeService - Service for fetching employee data
   * @param searchService - Service for fuzzy search functionality
   */
  constructor(
    private employeeService: EmployeeService,
    private searchService: SearchService
  ) {}

  /**
   * Lifecycle hook - initializes the component
   * Loads employee data and sets up debounced search
   */
  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadEmployees();
  }

  /**
   * Lifecycle hook - cleans up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  /**
   * Sets up the debounced search subscription
   * Waits 300ms after typing stops before executing search
   */
  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((searchTerm) => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  /**
   * Loads employee data from the service
   * @param forceRefresh - If true, clears cache and fetches fresh data
   */
  private loadEmployees(forceRefresh = false): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.employeeService.getEmployees(forceRefresh).subscribe({
      next: (employees) => {
        this.allEmployees = employees;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load employee data. Please try again.';
        this.isLoading = false;
        console.error('Error loading employees:', error);
      }
    });
  }

  /**
   * Retries loading employee data after a failure
   * Clears the cache to ensure a fresh fetch
   */
  retryLoad(): void {
    this.employeeService.clearCache();
    this.loadEmployees(true);
  }

  /**
   * Handles search input changes
   * Pushes to subject for debounced processing
   * @param event - The input event
   */
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  /**
   * Applies search filter, sorting, and pagination to the data
   */
  private applyFilters(): void {
    // Step 1: Apply fuzzy search filter via SearchService
    this.filteredEmployees = this.searchService.searchEmployees(
      this.allEmployees,
      this.searchTerm
    );

    // Step 2: Apply sorting
    this.sortEmployees();

    // Step 3: Reset to first page when filtering
    this.currentPage = 1;

    // Step 4: Calculate total pages
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);

    // Step 5: Apply pagination
    this.updateDisplayedEmployees();
  }

  /**
   * Sorts the filtered employees based on current sort state
   */
  private sortEmployees(): void {
    if (!this.sortState.column) return;

    const column = this.sortState.column;
    const direction = this.sortState.direction;

    this.filteredEmployees.sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];

      // Handle numeric values (id)
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return direction === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // Handle string values (case-insensitive)
      const stringA = String(valueA).toLowerCase();
      const stringB = String(valueB).toLowerCase();

      if (stringA < stringB) return direction === 'asc' ? -1 : 1;
      if (stringA > stringB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Handles column header click for sorting
   * Toggles sort direction if same column, otherwise sets new column with ascending order
   * @param column - The column to sort by
   */
  onSort(column: keyof Employee): void {
    if (this.sortState.column === column) {
      // Toggle direction if same column
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, start with ascending
      this.sortState.column = column;
      this.sortState.direction = 'asc';
    }

    // Re-apply sorting and pagination
    this.sortEmployees();
    this.updateDisplayedEmployees();
  }

  /**
   * Returns the sort icon class for a column header
   * @param column - The column to check
   * @returns CSS class for the sort icon
   */
  getSortIcon(column: keyof Employee): string {
    if (this.sortState.column !== column) {
      return 'sort-icon';
    }
    return this.sortState.direction === 'asc' ? 'sort-icon asc' : 'sort-icon desc';
  }

  /**
   * Updates the displayed employees for the current page
   */
  private updateDisplayedEmployees(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
  }

  /**
   * Navigates to a specific page
   * @param page - The page number to navigate to
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedEmployees();
    }
  }

  /**
   * Navigates to the previous page
   */
  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Navigates to the next page
   */
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  /**
   * Generates an array of page numbers for pagination display
   * Shows a window of pages around the current page
   * @returns Array of page numbers to display
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a window of pages around current page
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      // Adjust start if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  /**
   * Returns the range of records being displayed
   * @returns String describing the current range (e.g., "1-10 of 750")
   */
  getDisplayRange(): string {
    if (this.filteredEmployees.length === 0) {
      return '0 results';
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredEmployees.length);
    return `${start}-${end} of ${this.filteredEmployees.length}`;
  }

  /**
   * Returns appropriate CSS class for status badge
   * @param status - The employee status
   * @returns CSS class for the status badge
   */
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'badge bg-success';
      case 'on leave':
        return 'badge bg-warning text-dark';
      case 'inactive':
        return 'badge bg-secondary';
      default:
        return 'badge bg-info';
    }
  }
}
