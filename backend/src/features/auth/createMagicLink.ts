import { ddbPut } from "@/lib/dynamo";
import { newId } from "@/lib/ids";
import { pk, sk } from "@/lib/keys";
import { badRequest, created } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const email = (body.email as string | undefined)?.trim();

    if (!email) {
      return badRequest("email is required");
    }

    const token = newId("owner");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await ddbPut({
      PK: pk.ownerSession(token),
      SK: sk.metadata,
      ownerEmail: email,
      expiresAt,
    });

    return created({
      token,
      email,
      expiresAt,
      message: "Magic link issued. Use the owner token in X-Owner-Token.",
    });
  } catch (error) {
    return badRequest("Invalid request body");
  }
};
