import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import * as React from 'react';

interface ForgotPasswordEmailProps {
  user: {
    name: string;
  };
  resetLink: string;
}

const ForgotPasswordEmail = ({
  user,
  resetLink,
}: ForgotPasswordEmailProps) => {
  const previewText = `Reset your password for Robostreaks Inventory`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px] text-center">
              <Img
                src="https://res.cloudinary.com/diqgquom2/image/upload/v1754114497/WhatsApp_Image_2024-11-13_at_23.44.12_1060fab9-removebg-preview_hzogwa.png"
                width="80"
                height="80"
                alt="Robostreaks"
                className="my-0 mx-auto"
              />
            </Section>
            <Section className="text-center">
              <Text className="text-black text-[24px] font-bold">
                Robostreaks Inventory
              </Text>
            </Section>
            <Section>
              <Text className="text-black text-[14px] leading-[24px]">
                Hello {user.name},
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Someone recently requested a password change for your Robostreaks
                Inventory account. If this was you, you can set a new password
                here:
              </Text>
              <Button
                className="bg-primary rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={resetLink}
              >
                Reset Password
              </Button>
              <Text className="text-black text-[14px] leading-[24px]">
                If you don&apos;t want to change your password or didn&apos;t
                request this, you can ignore and delete this message.
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                To keep your account secure, please don&apos;t forward this email
                to anyone.
              </Text>
            </Section>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Text className="text-[#666666] text-[12px] leading-[24px]">
                © 2024 Robostreaks, All Rights Reserved
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ForgotPasswordEmail;
