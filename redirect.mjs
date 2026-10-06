import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;

const respond = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) return respond(400, { error: "Missing short ID" });

  try {
    const { Item } = await client.send(
      new GetCommand({ TableName: TABLE, Key: { short_id: id } })
    );
    if (!Item) return respond(404, { error: "Short URL not found" });

    return { statusCode: 302, headers: { Location: Item.long_url }, body: "" };
  } catch (err) {
    console.error(err);
    return respond(500, { error: "Lookup failed" });
  }
};
