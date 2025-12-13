import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getDataTableName } from "./constants";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export type Key = { PK: string; SK: string };

export async function ddbGet<T>(key: Key): Promise<T | undefined> {
  const res = await ddb.send(
    new GetCommand({
      TableName: getDataTableName(),
      Key: key,
    })
  );
  return res.Item as T | undefined;
}

export async function ddbPut(item: Record<string, unknown>) {
  await ddb.send(
    new PutCommand({
      TableName: getDataTableName(),
      Item: item,
    })
  );
}

export async function ddbUpdate<T>({
  key,
  updateExpression,
  expressionAttributeNames,
  expressionAttributeValues,
}: {
  key: Key;
  updateExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, unknown>;
}): Promise<T | undefined> {
  const res = await ddb.send(
    new UpdateCommand({
      TableName: getDataTableName(),
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );
  return res.Attributes as T | undefined;
}

export async function ddbQueryAll<T>({
  PK,
  beginsWithSK,
}: {
  PK: string;
  beginsWithSK?: string;
}): Promise<T[]> {
  const items: T[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined = undefined;

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: getDataTableName(),
        KeyConditionExpression:
          beginsWithSK !== undefined
            ? "PK = :pk AND begins_with(SK, :sk)"
            : "PK = :pk",
        ExpressionAttributeValues:
          beginsWithSK !== undefined
            ? { ":pk": PK, ":sk": beginsWithSK }
            : { ":pk": PK },
        ExclusiveStartKey,
      })
    );

    if (res.Items) items.push(...(res.Items as T[]));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

export async function ddbBatchWrite({
  puts,
  deletes,
}: {
  puts?: Record<string, unknown>[];
  deletes?: Key[];
}) {
  const table = getDataTableName();
  const requests: any[] = [];
  for (const item of puts ?? []) requests.push({ PutRequest: { Item: item } });
  for (const key of deletes ?? []) requests.push({ DeleteRequest: { Key: key } });

  // DynamoDB has a 25-item limit per batch.
  for (let i = 0; i < requests.length; i += 25) {
    const chunk = requests.slice(i, i + 25);
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [table]: chunk,
        },
      })
    );
  }
}

export async function ddbBatchGet<T>(keys: Key[]): Promise<T[]> {
  if (keys.length === 0) return [];
  const table = getDataTableName();

  // DynamoDB has a 100-item limit per batch get.
  const out: T[] = [];
  for (let i = 0; i < keys.length; i += 100) {
    const chunk = keys.slice(i, i + 100);
    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [table]: { Keys: chunk },
        },
      })
    );
    const items = (res.Responses?.[table] ?? []) as T[];
    out.push(...items);
  }
  return out;
}


