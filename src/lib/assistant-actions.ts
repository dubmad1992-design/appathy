import jwt from "jsonwebtoken";

type AssistantActionPayload = {
  type: "restart_app";
  appKey: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return secret;
}

export function createAssistantActionToken(payload: AssistantActionPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "15m" });
}

export function verifyAssistantActionToken(token: string) {
  return jwt.verify(token, getSecret()) as AssistantActionPayload;
}
