import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import ForgotPasswordEmail from '@/emails/forgot-password-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();

  // In a real app, you'd look up the user by email and generate a unique, secure token.
  // For this example, we'll use a static token and link.
  const user = {
    name: 'User', // Replace with actual user name
    email,
  };
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=some-secret-token`;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Replace with your "from" email
      to: email,
      subject: 'Reset Your Password',
      react: ForgotPasswordEmail({
        user,
        resetLink,
      }),
    });
    return NextResponse.json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error sending email.' },
      { status: 500 }
    );
  }
}
