export interface CancellationPolicy {
  Id:number;
  Name :string;
  Description :string;
  FullRefundDays :number | null;
  PartialRefundDays :number | null;
  PartialRefundPercentage :number | null;
}
