import { NextApiRequest, NextApiResponse } from "next";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import prisma from "@/lib/prisma";
import z from "zod";
import { checkPassword } from "@/lib/utils";

const bodySchema = z.object({
  email: z.string().email(),
  identifier: z.string(),
  password: z.string().nullable(),
  emailProtected: z.boolean(),
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // GET /api/verification/email_authcode
    // Verify authcode
    const { authenticationToken, identifier } = req.query as {
      authenticationToken: string;
      identifier: string;
    };

    //Check verification code in database
    const token = await prisma.verificationToken.findFirst({
      where: {
        token: authenticationToken,
        identifier: identifier,
      },
    });

    if (!token) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }
    //Check the token's expiry
    if (Date.now() > token.expiresAt.getTime()) {
      //Delete the token if expired
      await prisma.verificationToken.delete({
        where: {
          token: authenticationToken,
        },
      });
      return res.status(401).json({ message: "Verification code expired" });
    }
    res.status(200).json({ message: "Verification successful" });
  } else if (req.method === "POST") {
    // POST /api/verification/email_authcode

    // Input validation
    let email: string;
    let identifier: string;
    let password: string | null;
    let emailProtected: boolean;
    try {
      ({ email, identifier, password, emailProtected } = bodySchema.parse(
        req.body,
      ));
    } catch (error) {
      res.status(403).json({ message: `Invalid inputs` });
      return;
    }

    //Password validation
    if (password) {
      const link = await prisma.link.findFirst({
        where: {
          id: identifier,
        },
      });

      if (!link) {
        return res.status(404).json({ message: "Object not found" });
      }

      const isPasswordValid = await checkPassword(
        password,
        link.password || "",
      );

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }
    }

    // Generate authcode
    const authenticationCode = generateUniqueString(12);
    await prisma.verificationToken.create({
      data: {
        token: authenticationCode,
        identifier,
      },
    });
    const URL = `${process.env.NEXT_PUBLIC_BASE_URL}/view/${identifier}?authenticationCode=${authenticationCode}`;

    //Only send email if email protected
    if (emailProtected) {
      await sendVerificationEmail(email, URL);
    }
    res.status(200).json({ authenticationCode });
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function generateUniqueString(length: number) {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let uniqueString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    uniqueString += charset.charAt(randomIndex);
  }

  return uniqueString;
}
