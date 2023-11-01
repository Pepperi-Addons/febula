// 1 = Admin, 2 = Rep, 3 = Buyer
export const EMPLOYEE_TYPES = [1, 2, 3] as const;
export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];