import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomBytes } from "crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const makeId = (len = 7) =>
  Array.from(randomBytes(len), (b) => CHARS[b % CHARS.length]).join("");

const respond = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  let url;
  try {
    url = JSON.parse(event.body || "{}").url;
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return respond(400, { error: "Provide a valid http(s) URL in the 'url' field" });
  }

  const shortId = makeId();
  try {
    await client.send(
      new PutCommand({
        TableName: TABLE,
        Item: { short_id: shortId, long_url: url, created_at: new Date().toISOString() },
        ConditionExpression: "attribute_not_exists(short_id)",
      })
    );
  } catch (err) {
    console.error(err);
    return respond(500, { error: "Could not save URL" });
  }

  const base = `https://${event.requestContext.domainName}`;
  return respond(201, { short_id: shortId, short_url: `${base}/${shortId}` });
};
