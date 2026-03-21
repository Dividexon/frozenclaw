#!/usr/bin/env node
import fs from "node:fs";
import nodemailer from "nodemailer";

const envFile = "/etc/frozenclaw/frozenclaw.env";
const recipient = process.argv[2];

if (!recipient) {
  console.error("EmpfÃ¤nger fehlt.");
  process.exit(1);
}

const values = new Map();

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    values.set(trimmed.slice(0, separatorIndex), trimmed.slice(separatorIndex + 1));
  }
}

const host = values.get("SMTP_HOST");
const port = Number.parseInt(values.get("SMTP_PORT") ?? "587", 10);
const secure = (values.get("SMTP_SECURE") ?? "false").toLowerCase() === "true";
const user = values.get("SMTP_USER");
const pass = values.get("SMTP_PASS");
const from = values.get("MAIL_FROM") ?? user;
const replyTo = values.get("SUPPORT_EMAIL") ?? from;

if (!host || !user || !pass || !from) {
  console.error("SMTP-Konfiguration ist unvollstÃ¤ndig.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user,
    pass,
  },
});

await transporter.verify();
await transporter.sendMail({
  from,
  to: recipient,
  replyTo,
  subject: "Frozenclaw Mail-Test",
  text: "Der SMTP-Versand fÃ¼r Frozenclaw funktioniert.",
  html: "<p>Der SMTP-Versand fÃ¼r Frozenclaw funktioniert.</p>",
});

console.log(`Testmail an ${recipient} gesendet.`);
