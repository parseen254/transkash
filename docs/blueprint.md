# **App Name**: TransKash

## Core Features:

- Stripe Payment Gateway: Secure Stripe Payment Integration: Allow users to make payments through Stripe using a payment link.
- Recipient Details Form: Recipient Information Input: Collect recipient's details (e.g., phone number for MPESA) using a simple form.
- MPESA Transfer Automation: Automated MPESA Transfer: Use the Daraja B2C API to automatically transfer funds to the recipient's MPESA account.  Requires server-side processing of the payment via the API.  May be implemented as a queue to manage calls to the 3rd party service.
- Transaction Logging and Notifications: Transaction History: Maintain a basic log of successful transactions. Provide transaction status and details to both sender and receiver by SMS.

## Style Guidelines:

- Primary color: A deep sky blue (#42A5F5) to inspire feelings of trust, security and efficiency.
- Background color: Very light blue (#F0F8FF), almost white. It offers a clean, unobtrusive backdrop that keeps attention on content.
- Accent color: A subdued violet (#9575CD), a harmonious yet contrasting companion, suitable for interactive elements like confirmation buttons.
- Clean and modern sans-serif font to ensure clarity and readability across all devices.
- Simple and easily recognizable icons to represent payment methods and transaction status.
- Clear, intuitive layout that simplifies the payment process, especially on mobile devices.