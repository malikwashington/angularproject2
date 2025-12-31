/**
 * Employee Interface
 * Defines the structure of an employee record in the application
 */
export interface Employee {
  /** Unique identifier for the employee */
  id: number;

  /** Employee's first name */
  first_name: string;

  /** Employee's last name */
  last_name: string;

  /** Employee's email address */
  email: string;

  /** Employee's job role/title */
  role: string;

  /** Department the employee belongs to */
  department: string;

  /** Current employment status (Active, On Leave, Inactive) */
  status: string;
}
