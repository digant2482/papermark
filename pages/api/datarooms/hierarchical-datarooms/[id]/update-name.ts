import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // GET /api/datarooms/hierarchical/:id/update-name
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }

    const { id } = req.query as { id: string };

    try {
      const dataroom = await prisma.hierarchicalDataroom.findUnique({
        where: {
          id: id,
        },
        select: {
          ownerId: true,
        }
      });

      // Check if the user is the owner of the document
      if (dataroom?.ownerId !== (session.user as CustomUser).id) {
        return res.status(401).end("Unauthorized");
      }

      await prisma.hierarchicalDataroom.update({
        where: {
          id: id,
        },
        data: {
          name: req.body.name,
          description: req.body.description
        }
      });

      res.status(200).json({ message: "Dataroom name/description updated!"});
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow GET and POST requests
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
