# Manual verification checklist

- Sign in with GitHub and confirm onboarding completes.
- Wait for processing and verify the progress bar, retry button, and error state behave correctly.
- Confirm dashboard repo count and generated resume cards load.
- Generate a resume from a job description and confirm the PDF download matches the HTML preview.
- Confirm ATS score appears for everyone and matched/missed keywords appear only for Pro users.
- Open Settings and confirm monthly and annual payment buttons create a Razorpay checkout session.
- Complete a Razorpay test payment and confirm the user becomes Pro and payment history appears.
- Re-sync GitHub after making a small repo change and confirm only the changed repo is reprocessed.
- Wait for the monthly boundary or change the month tracker in test data and confirm usage resets automatically.
- Simulate GitHub rate limiting and confirm the UI shows an informative pause message.