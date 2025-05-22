import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { PaymentDetails } from "@/lib/types";

interface PaymentDetailsCardProps {
  details: PaymentDetails;
  title?: string;
  description?: string;
  children?: React.ReactNode; // For additional elements like buttons
}

export function PaymentDetailsDisplay({ details }: { details: PaymentDetails }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Payment Reference:</span>
        <span className="font-medium text-foreground">{details.reference}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Recipient Name:</span>
        <span className="font-medium text-foreground">{details.name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Amount:</span>
        <span className="font-medium text-foreground text-lg">{details.amount}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Date:</span>
        <span className="font-medium text-foreground">{details.date}</span>
      </div>
      {details.status && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className={`font-medium ${details.status === 'Successful' ? 'text-green-600' : details.status === 'Failed' ? 'text-destructive' : 'text-foreground'}`}>
            {details.status}
          </span>
        </div>
      )}
      {details.paymentReason && (
         <div className="pt-2">
          <span className="text-muted-foreground block mb-1">Payment Reason:</span>
          <p className="font-medium text-foreground bg-muted p-2 rounded-md">{details.paymentReason}</p>
        </div>
      )}
    </div>
  );
}


export function PaymentDetailsCard({ details, title, description, children }: PaymentDetailsCardProps) {
  return (
    <Card className="w-full">
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        <PaymentDetailsDisplay details={details} />
        {children}
      </CardContent>
    </Card>
  );
}
