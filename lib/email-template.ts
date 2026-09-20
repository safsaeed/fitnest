import "server-only";

const FONT_STACK =
  "Nunito, 'Avenir Next', 'Segoe UI', Arial, sans-serif";

type EmailTemplateInput = {
  preheader: string;
  eyebrow: string;
  title: string;
  contentHtml: string;
};

function getAppUrl() {
  return process.env.APP_URL?.replace(/\/+$/, "") || null;
}

export function renderEmailTemplate({
  preheader,
  eyebrow,
  title,
  contentHtml,
}: EmailTemplateInput) {
  const appUrl = getAppUrl();
  const termsLinkHtml = appUrl
    ? `<span style="color: #aaaaaa;">&nbsp;&nbsp;·&nbsp;&nbsp;</span><a href="${appUrl}/terms" style="color: #7a5933; text-decoration: underline;">Terms &amp; Conditions</a>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f0ea;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #f3f0ea; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid #e5ddd2; border-radius: 12px; border-collapse: separate; overflow: hidden; box-shadow: 0 8px 24px rgba(67, 48, 31, 0.08);">
            <tr>
              <td style="height: 6px; background-color: #8d6e52; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 32px 36px 36px; font-family: ${FONT_STACK}; color: #121212; font-size: 16px; line-height: 1.65;">
                <p style="margin: 0 0 8px; color: #8d6e52; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; line-height: 1.4; text-transform: uppercase;">${eyebrow}</p>
                <h1 style="margin: 0 0 24px; color: #121212; font-size: 28px; font-weight: 700; letter-spacing: -0.4px; line-height: 1.25;">${title}</h1>
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 22px 36px; background-color: #fbfbfb; border-top: 1px solid #eee8e0; font-family: ${FONT_STACK}; color: #555555; font-size: 13px; line-height: 1.6;">
                <p style="margin: 0 0 4px; color: #121212; font-weight: 700;">FitNest Studios</p>
                <p style="margin: 0;"><a href="mailto:contact@fitneststudios.co.uk" style="color: #7a5933; text-decoration: underline;">Contact us</a>${termsLinkHtml}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderEmailParagraph(
  content: string,
  margin = "0 0 20px",
) {
  return `<p style="margin: ${margin}; color: #555555;">${content}</p>`;
}

export function renderEmailButton(href: string, label: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; border-collapse: separate;">
    <tr>
      <td style="background-color: #8d6e52; border: 1px solid #9c601a; border-radius: 8px;">
        <a href="${href}" style="display: inline-block; padding: 11px 18px; color: #ffffff; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 700; line-height: 1.4; text-decoration: none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function renderEmailCard(contentHtml: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0; background-color: #f3f0ea; border: 1px solid #e5ddd2; border-radius: 8px; border-collapse: separate;">
    <tr>
      <td style="padding: 18px; color: #121212; font-size: 15px; line-height: 1.55;">${contentHtml}</td>
    </tr>
  </table>`;
}

export function renderEmailDetail(label: string, value: string, last = false) {
  return `<p style="margin: 0${last ? "" : " 0 9px"}; color: #555555;"><strong style="color: #121212;">${label}:</strong> ${value}</p>`;
}

export function renderEmailSmallPrint(content: string, margin = "12px 0 0") {
  return `<p style="margin: ${margin}; color: #555555; font-size: 14px; line-height: 1.55;">${content}</p>`;
}

export function renderEmailLink(href: string, label = href) {
  return `<a href="${href}" style="color: #7a5933; font-weight: 600; text-decoration: underline;">${label}</a>`;
}

export function renderEmailSignOff(
  closing = "Thanks,",
  brandName = "FitNest Studios",
) {
  return `<p style="margin: 28px 0 0; color: #555555;">${closing}<br /><strong style="color: #121212;">${brandName}</strong></p>`;
}
