export interface AssignmentRule {
  id: string;
  name: string;
  keywords: string[];
  budgetId: string | null;
  /** Higher priority wins when multiple rules match */
  priority: number;
  active: boolean;
  /** If true, matching bookings are treated as internal transfers */
  markAsInternalTransfer: boolean;
}
