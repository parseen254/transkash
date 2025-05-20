
import CreatePaymentRequestForm from '@/components/CreatePaymentRequestForm';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';

export default function NewPaymentRequestPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Link2 className="mr-3 h-6 w-6 text-primary" />
            Create New Payment Request
          </CardTitle>
          <CardDescription>
            Generate a shareable link to request payment from others. They can pay via Stripe or MPESA.
          </CardDescription>
        </CardHeader>
        <CreatePaymentRequestForm />
      </Card>
    </div>
  );
}
