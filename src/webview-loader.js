const vscode = require('vscode');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const WEBVIEW_DIST = 'webview-dist';

function generateNonce() {
  return crypto.randomBytes(24).toString('base64');
}

function loadWebviewHtml(panel, context) {
  const distRoot  = vscode.Uri.joinPath(context.extensionUri, WEBVIEW_DIST);
  const indexPath = path.join(distRoot.fsPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;color:#ccc;background:#06060a">
      <h2>Loadout — webview not built</h2>
      <p>Run <code>cd webview && npm install && npm run build</code> first.</p>
    </body></html>`;
  }
  let html = fs.readFileSync(indexPath, 'utf8');
  const nonce     = generateNonce();
  const cspSource = panel.webview.cspSource;
  const distUri   = panel.webview.asWebviewUri(distRoot);

  html = html.replace(/<script\b/g, `<script nonce="${nonce}"`);
  html = html.replace(/<link\b([^>]*?)\brel="stylesheet"/g, `<link$1rel="stylesheet" nonce="${nonce}"`);
  html = html.replace(/(href|src)="(?!https?:|data:|#)([^"]+)"/g, (_, attr, value) => {
    const cleaned = value.replace(/^\.?\//, '');
    if (cleaned.includes('..')) return `${attr}=""`;
    return `${attr}="${distUri.toString()}/${cleaned}"`;
  });

  const csp = [
    `default-src 'none'`,
    `img-src ${cspSource} https: data:`,
    `script-src 'nonce-${nonce}' ${cspSource}`,
    `style-src ${cspSource} 'nonce-${nonce}'`,
    `font-src ${cspSource} data:`,
    `connect-src ${cspSource}`,
  ].join('; ');
  html = html.replace(
    '<!-- {{CSP_META}} -->',
    `<meta http-equiv="Content-Security-Policy" content="${csp}">\n  <meta name="csp-nonce" content="${nonce}">`,
  );
  html = html.replace('<!-- {{FONT_LINKS}} -->', '');

  return html;
}

module.exports = { WEBVIEW_DIST, generateNonce, loadWebviewHtml };
