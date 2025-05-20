
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Mail, Phone, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <LifeBuoy className="mr-3 h-8 w-8 text-primary" />
          Support
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Get Help and Support</CardTitle>
          <CardDescription>Find answers to your questions or contact our support team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions (FAQ)</h2>
            <p className="text-muted-foreground mb-4">
              Browse our FAQ to find answers to common questions about {process.env.NEXT_PUBLIC_APP_NAME || "our service"}.
            </p>
            {/* TODO: Implement FAQ Accordion if needed, or link to a dedicated FAQ page */}
            <Button variant="outline" disabled>View FAQ (Coming Soon)</Button>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p className="text-muted-foreground mb-4">If you can&apos;t find an answer in the FAQ, feel free to reach out to us through one of the channels below.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-secondary/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg"><Mail className="mr-2 h-5 w-5 text-primary"/> Email Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Send us an email and we&apos;ll get back to you as soon as possible.</p>
                  <Button asChild variant="link" className="p-0 h-auto mt-2">
                    <Link href={`mailto:support@${(process.env.NEXT_PUBLIC_APP_NAME || 'app').toLowerCase()}.com`}>
                      support@{(process.env.NEXT_PUBLIC_APP_NAME || 'app').toLowerCase()}.com
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-secondary/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg"><Phone className="mr-2 h-5 w-5 text-primary"/> Phone Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">For urgent issues, please refer to the phone number provided on our official website or in your account dashboard if applicable.</p>
                   {/* <p className="font-semibold mt-2 text-primary">Contact via official channels</p> */}
                </CardContent>
              </Card>
               <Card className="bg-secondary/50 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg"><MessageSquare className="mr-2 h-5 w-5 text-primary"/> Community Forum / Help Center</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Join our community forum to ask questions, share solutions, and connect with other users. (Link to be provided when available)</p>
                   <Button variant="outline" disabled className="mt-2">Visit Community (Coming Soon)</Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
