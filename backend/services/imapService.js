const { ImapFlow } = require('imapflow');
const simpleParser = require('mailparser').simpleParser;
const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'database', 'mailDb.json');
const uploadsPath = path.join(__dirname, '..', '..', 'sgd', 'uploads');

// Ensure DB directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
if (!fs.existsSync(dbPath)) {
    jsonfile.writeFileSync(dbPath, { emails: [] }, { spaces: 2 });
}
// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

function getSyncedEmails() {
    const data = jsonfile.readFileSync(dbPath);
    return data.emails || [];
}

// Normalize text for keyword matching (remove accents, lowercase)
function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

// Check if email matches any keyword
function emailMatchesKeywords(subject, body, keywords) {
    if (!keywords || keywords.length === 0) return true; // No filter = accept all

    const normalizedSubject = normalizeText(subject);
    const normalizedBody = normalizeText(body);
    const combined = normalizedSubject + ' ' + normalizedBody;

    return keywords.some(keyword => {
        const normalizedKeyword = normalizeText(keyword);
        return combined.includes(normalizedKeyword);
    });
}

// Check if email matches blacklist
function emailMatchesBlacklist(senderEmail, blacklist) {
    if (!blacklist || blacklist.length === 0 || !senderEmail) return false;
    const normalizedSender = senderEmail.toLowerCase();
    
    return blacklist.some(blackItem => {
        const item = blackItem.toLowerCase().trim();
        // Exact match or domain match
        return normalizedSender === item || normalizedSender.endsWith('@' + item) || normalizedSender.endsWith('.' + item);
    });
}

async function syncEmails(accountConfig, keywords, blacklist, requireAttachments) {
    if (!accountConfig.host || !accountConfig.auth?.user || !accountConfig.auth?.pass) {
        throw new Error('Configuración IMAP incompleta');
    }

    const client = new ImapFlow({
        host: accountConfig.host,
        port: parseInt(accountConfig.port) || 993,
        secure: accountConfig.secure !== false,
        auth: {
            user: accountConfig.auth.user,
            pass: accountConfig.auth.pass
        },
        logger: false,
        emitLogs: false,
        socketTimeout: 30000 // 30 seconds timeout
    });

    let newEmailsCount = 0;
    let filteredCount = 0;

    await client.connect();

    let lock = await client.getMailboxLock('INBOX');
    try {
        const existingEmails = getSyncedEmails();
        const existingMessageIds = new Set(existingEmails.map(e => e.messageId));

        // Solo traer correos de las últimas 2 semanas
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const searchCriteria = { since: twoWeeksAgo };

        console.log(`[IMAP] ${accountConfig.auth.user}: Buscando correos desde ${twoWeeksAgo.toISOString().split('T')[0]}...`);

        const messages = client.fetch(searchCriteria, { source: true, uid: true });

        for await (let message of messages) {
            try {
                const parsed = await simpleParser(message.source);
                const messageId = parsed.messageId || String(message.uid);
                
                if (existingMessageIds.has(messageId)) {
                    continue; // Skip duplicates
                }

                const senderEmail = parsed.from?.value?.[0]?.address || 'desconocido@correo.com';

                // Apply Blacklist Filter
                if (emailMatchesBlacklist(senderEmail, blacklist)) {
                    filteredCount++;
                    continue; // Skip - sender is blacklisted
                }

                const subject = parsed.subject || 'Sin Asunto';
                const bodyText = parsed.text || parsed.html || '';

                // Apply keyword filter
                if (!emailMatchesKeywords(subject, bodyText, keywords)) {
                    filteredCount++;
                    continue; // Skip - doesn't match keywords
                }

                // Apply Attachments Filter
                if (requireAttachments && (!parsed.attachments || parsed.attachments.length === 0)) {
                    filteredCount++;
                    continue; // Skip - no attachments found
                }

                // Handle attachments
                const adjuntosInfo = [];
                if (parsed.attachments && parsed.attachments.length > 0) {
                    for (const att of parsed.attachments) {
                        const filename = att.filename || `adjunto_${Date.now()}`;
                        const safeFilename = `${crypto.randomBytes(4).toString('hex')}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
                        const filepath = path.join(uploadsPath, safeFilename);
                        
                        fs.writeFileSync(filepath, att.content);
                        
                        let ext = path.extname(filename).toLowerCase();
                        let type = 'other';
                        if (['.pdf'].includes(ext)) type = 'pdf';
                        if (['.doc', '.docx'].includes(ext)) type = 'word';
                        if (['.xls', '.xlsx'].includes(ext)) type = 'excel';
                        if (['.jpg', '.jpeg', '.png'].includes(ext)) type = 'image';

                        adjuntosInfo.push({
                            id: safeFilename,
                            name: filename,
                            type: type,
                            url: `/sgd/uploads/${safeFilename}`
                        });
                    }
                }

                const newEmail = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    messageId: messageId,
                    uid: message.uid,
                    account: accountConfig.auth.user,
                    senderName: parsed.from?.value?.[0]?.name || 'Desconocido',
                    senderEmail: parsed.from?.value?.[0]?.address || 'desconocido@correo.com',
                    subject: subject,
                    datetime: parsed.date ? new Date(parsed.date).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
                    reqType: 'Pendiente Análisis',
                    status: 'nuevo',
                    body: parsed.text || parsed.html || 'Sin contenido',
                    adjuntos: adjuntosInfo,
                    anexos: []
                };

                existingEmails.push(newEmail);
                newEmailsCount++;

            } catch (err) {
                console.error('[IMAP] Error parsing individual email:', err.message);
            }
        }

        // Save DB
        jsonfile.writeFileSync(dbPath, { emails: existingEmails }, { spaces: 2 });

    } finally {
        lock.release();
    }

    await client.logout();

    console.log(`[IMAP] ${accountConfig.auth.user}: ${newEmailsCount} importados, ${filteredCount} ignorados (por filtros)`);

    return {
        imported: newEmailsCount,
        filtered: filteredCount,
        lastSync: new Date().toISOString()
    };
}

module.exports = {
    syncEmails,
    getSyncedEmails
};
