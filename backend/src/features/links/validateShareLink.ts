import { columnSchema, shareLinkSchema, uploadSchema, workspaceSchema } from "@/contracts";
import { ddbGet, ddbQueryAll } from "@/lib/dynamo";
import { pk, sk } from "@/lib/keys";
import { badRequest, notFound, success } from "@/utils/response";
import type { APIGatewayProxyHandler } from "aws-lambda";
import { getShareLinkByToken, touchShareLinkLastUsedAt } from "./linkStore";

export const handler: APIGatewayProxyHandler = async (event) => {
  const token = event.pathParameters?.token;
  if (!token) {
    return badRequest("token is required");
  }

  // Special-case public demo token so marketing always works without seeding Dynamo.
  if (token === "demo-token") {
    const now = new Date().toISOString();
    const link = shareLinkSchema.parse({
      id: "lnk_demo",
      workspaceId: "ws_demo",
      token: "demo-token",
      passcodeRequired: false,
      status: "active",
      permissions: { canUpload: false, canEditRows: false },
      lastUsedAt: now,
    });

    const columns = [
      columnSchema.parse({
        id: "col_vendor",
        workspaceId: "ws_demo",
        name: "Vendor",
        description: "Company issuing the invoice.",
        type: "text",
        required: true,
        order: 0,
      }),
      columnSchema.parse({
        id: "col_invoice",
        workspaceId: "ws_demo",
        name: "Invoice #",
        description: "Invoice identifier as it appears on the document.",
        type: "text",
        required: true,
        order: 1,
      }),
      columnSchema.parse({
        id: "col_date",
        workspaceId: "ws_demo",
        name: "Date",
        description: "Invoice date.",
        type: "date",
        required: true,
        order: 2,
      }),
      columnSchema.parse({
        id: "col_amount",
        workspaceId: "ws_demo",
        name: "Amount",
        description: "Total amount due.",
        type: "number",
        required: true,
        order: 3,
      }),
      columnSchema.parse({
        id: "col_currency",
        workspaceId: "ws_demo",
        name: "Currency",
        description: "ISO currency code (e.g. EUR, USD).",
        type: "text",
        required: true,
        order: 4,
      }),
      columnSchema.parse({
        id: "col_evidence",
        workspaceId: "ws_demo",
        name: "Evidence",
        description: "Original file(s) that produced the values.",
        type: "attachment",
        required: false,
        order: 5,
      }),
    ];

    const workspace = workspaceSchema.parse({
      id: "ws_demo",
      name: "Demo: Vendor invoice intake",
      description: "Preview: a request link that turns messy invoices into clean rows.",
      createdAt: now,
      status: "active",
      columns,
      shareLinks: [link],
    });

    return success({
      workspace,
      link,
      columns,
      latestUpload: undefined,
    });
  }

  const link = await getShareLinkByToken(token);
  if (!link) return notFound("Share link not found or expired");

  await touchShareLinkLastUsedAt({ workspaceId: link.workspaceId, linkId: link.id });

  const wsItem = await ddbGet<any>({ PK: pk.workspace(link.workspaceId), SK: sk.metadata });
  if (!wsItem) return notFound("Workspace not found");
  const { PK: _pk, SK: _sk, ...wsRest } = wsItem;

  const columnItems = await ddbQueryAll<any>({
    PK: pk.workspace(link.workspaceId),
    beginsWithSK: "COLUMN#",
  });
  const columns = columnItems
    .map((i) => {
      const { PK: __pk, SK: __sk, ...rest } = i ?? {};
      return columnSchema.parse(rest);
    })
    .sort((a, b) => a.order - b.order);

  const uploadItems = await ddbQueryAll<any>({
    PK: pk.workspace(link.workspaceId),
    beginsWithSK: "UPLOAD#",
  });
  const uploadsForLink = uploadItems
    .map((i) => {
      const { PK: __pk, SK: __sk, ...rest } = i ?? {};
      return uploadSchema.safeParse(rest).success ? uploadSchema.parse(rest) : null;
    })
    .filter(Boolean) as any[];

  const latestUpload = uploadsForLink
    .filter((u) => u.linkId === link.id)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];

  const workspace = workspaceSchema.parse({
    ...wsRest,
    id: link.workspaceId,
    columns,
    shareLinks: [link],
  });

  return success({
    workspace,
    link,
    columns,
    latestUpload,
  });
};
