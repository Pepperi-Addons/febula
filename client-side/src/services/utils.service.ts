import { EmployeeType } from "../types";
import { FilterObject } from "../../../shared/types";

export class UtilsService {

    public static getProfileName(employeeType: EmployeeType): string {
        switch (employeeType) {
            case 1:
                return 'Admin';
            case 2:
                return 'Rep';
            case 3:
                return 'Buyer';
            default:
                return 'Unknown';
        }
    }

    public static isLocked(filterObject: FilterObject) {
        return filterObject.AddonUUID !== undefined;
    }

}