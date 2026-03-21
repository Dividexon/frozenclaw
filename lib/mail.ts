import "server-only";

import nodemailer from "nodemailer";
import { getAppConfig } from "@/lib/env";

type ReadyMailInput = {
  to: string;
  setupUrl: string;
  agentUrl: string;
  slug: string;
};

type FailedMailInput = {
  to: string;
  orderId: number;
  message: string;
};

type LoginLinkMailInput = {
  to: string;
  loginUrl: string;
};

declare global {
  var __frozenclawMailer:
    | ReturnType<typeof nodemailer.createTransport>
    | undefined;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getMailer() {
  if (!global.__frozenclawMailer) {
    const config = getAppConfig();

    if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.mailFrom) {
      throw new Error("Mailversand ist nicht vollständig konfiguriert.");
    }

    global.__frozenclawMailer = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  return global.__frozenclawMailer;
}

export function isMailConfigured() {
  const config = getAppConfig();
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.mailFrom);
}

export async function verifyMailer() {
  if (!isMailConfigured()) {
    throw new Error("Mailversand ist nicht konfiguriert.");
  }

  await getMailer().verify();
}

export async function sendProvisioningReadyMail(input: ReadyMailInput) {
  const config = getAppConfig();

  await getMailer().sendMail({
    from: config.mailFrom!,
    to: input.to,
    replyTo: config.supportEmail ?? config.mailFrom!,
    subject: "Deine Frozenclaw-Instanz ist bereit",
    text: [
      "Deine Frozenclaw-Instanz ist jetzt bereit.",
      "",
      `Instanz: ${input.slug}`,
      `Zugang einrichten: ${input.setupUrl}`,
      `OpenClaw öffnen: ${input.agentUrl}`,
      "",
      "Wenn du Fragen hast, antworte einfach auf diese E-Mail.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:24px;margin-bottom:16px">Deine Frozenclaw-Instanz ist bereit</h1>
        <p>Deine gehostete OpenClaw-Instanz wurde erfolgreich bereitgestellt.</p>
        <p><strong>Instanz:</strong> ${escapeHtml(input.slug)}</p>
        <p><a href="${escapeHtml(input.setupUrl)}">Zugang einrichten</a></p>
        <p><a href="${escapeHtml(input.agentUrl)}">OpenClaw öffnen</a></p>
        <p>Wenn du Fragen hast, antworte einfach auf diese E-Mail.</p>
      </div>
    `,
  });
}

export async function sendProvisioningFailedMail(input: FailedMailInput) {
  const config = getAppConfig();

  await getMailer().sendMail({
    from: config.mailFrom!,
    to: input.to,
    replyTo: config.supportEmail ?? config.mailFrom!,
    subject: "Probleme bei der Bereitstellung deiner Frozenclaw-Instanz",
    text: [
      "Bei der Bereitstellung deiner Frozenclaw-Instanz ist ein Fehler aufgetreten.",
      "",
      `Bestellung: ${input.orderId}`,
      `Fehler: ${input.message}`,
      "",
      "Wir prüfen das automatisch. Falls du Rückfragen hast, antworte direkt auf diese E-Mail.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:24px;margin-bottom:16px">Bereitstellung fehlgeschlagen</h1>
        <p>Bei der Bereitstellung deiner Frozenclaw-Instanz ist ein Fehler aufgetreten.</p>
        <p><strong>Bestellung:</strong> ${input.orderId}</p>
        <p><strong>Fehler:</strong> ${escapeHtml(input.message)}</p>
        <p>Wir prüfen das automatisch. Falls du Rückfragen hast, antworte direkt auf diese E-Mail.</p>
      </div>
    `,
  });
}

export async function sendTestMail(to: string) {
  const config = getAppConfig();

  await getMailer().sendMail({
    from: config.mailFrom!,
    to,
    replyTo: config.supportEmail ?? config.mailFrom!,
    subject: "Frozenclaw Mail-Test",
    text: "Der SMTP-Versand für Frozenclaw funktioniert.",
    html: "<p>Der SMTP-Versand fÃ¼r Frozenclaw funktioniert.</p>",
  });
}

export async function sendLoginLinkMail(input: LoginLinkMailInput) {
  const config = getAppConfig();

  await getMailer().sendMail({
    from: config.mailFrom!,
    to: input.to,
    replyTo: config.supportEmail ?? config.mailFrom!,
    subject: "Dein Frozenclaw-Zugangslink",
    text: [
      "Hier ist dein Zugangslink zu Frozenclaw.",
      "",
      input.loginUrl,
      "",
      "Der Link ist für 30 Minuten gültig.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:24px;margin-bottom:16px">Dein Frozenclaw-Zugangslink</h1>
        <p>Hier ist dein Zugangslink zu Frozenclaw.</p>
        <p><a href="${escapeHtml(input.loginUrl)}">Jetzt anmelden</a></p>
        <p>Der Link ist fÃ¼r 30 Minuten gÃ¼ltig.</p>
      </div>
    `,
  });
}
