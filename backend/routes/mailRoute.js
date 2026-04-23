const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const imapService = require('../services/imapService');

const configPath = path.join(__dirname, '..', 'config', 'mailConfig.json');

// Ensure config dir exists
if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
}

// Helper: read config with migration from old format
function readConfig() {
    if (!fs.existsSync(configPath)) return { accounts: [], keywords: [], blacklist: [], requireAttachments: true };
    const raw = jsonfile.readFileSync(configPath);

    // Migrate old single-account format
    if (raw.host && raw.auth) {
        const migrated = {
            accounts: [{
                id: 'acc_1',
                name: 'Cuenta Principal',
                host: raw.host,
                port: raw.port || 993,
                secure: raw.secure !== false,
                auth: raw.auth,
                enabled: true
            }],
            keywords: raw.keywords || [],
            blacklist: raw.blacklist || [],
            requireAttachments: raw.requireAttachments !== undefined ? raw.requireAttachments : true
        };
        jsonfile.writeFileSync(configPath, migrated, { spaces: 2 });
        return migrated;
    }

    return {
        accounts: raw.accounts || [],
        keywords: raw.keywords || [],
        blacklist: raw.blacklist || [],
        requireAttachments: raw.requireAttachments !== undefined ? raw.requireAttachments : true
    };
}

// GET /api/mail/config
router.get('/config', (req, res) => {
    try {
        const config = readConfig();
        // Hide passwords in response
        const safeAccounts = config.accounts.map(acc => ({
            ...acc,
            auth: {
                user: acc.auth?.user || '',
                pass: acc.auth?.pass ? '********' : ''
            }
        }));
        res.json({ 
            success: true, 
            accounts: safeAccounts, 
            keywords: config.keywords,
            blacklist: config.blacklist,
            requireAttachments: config.requireAttachments
        });
    } catch (error) {
        console.error('Error reading config:', error);
        res.status(500).json({ success: false, error: 'Cannot read config' });
    }
});

// POST /api/mail/config  (save full config: accounts + keywords + blacklist + requireAttachments)
router.post('/config', (req, res) => {
    try {
        const { accounts, keywords, blacklist, requireAttachments } = req.body;
        const existing = readConfig();

        // Process accounts - preserve real passwords when ******** is sent
        const processedAccounts = (accounts || []).map(acc => {
            if (acc.auth && acc.auth.pass === '********') {
                // Find existing account to preserve real password
                const existingAcc = existing.accounts.find(e => e.id === acc.id);
                if (existingAcc) {
                    acc.auth.pass = existingAcc.auth.pass;
                }
            }
            // Ensure id exists
            if (!acc.id) {
                acc.id = 'acc_' + Date.now();
            }
            return acc;
        });

        const newConfig = {
            accounts: processedAccounts,
            keywords: keywords || existing.keywords || [],
            blacklist: blacklist || existing.blacklist || [],
            requireAttachments: requireAttachments !== undefined ? requireAttachments : existing.requireAttachments
        };

        jsonfile.writeFileSync(configPath, newConfig, { spaces: 2 });
        res.json({ success: true, message: 'Configuración guardada' });
    } catch (error) {
        console.error('Error saving config:', error);
        res.status(500).json({ success: false, error: 'Cannot save config' });
    }
});

// POST /api/mail/sync
router.post('/sync', async (req, res) => {
    try {
        const config = readConfig();

        if (!config.accounts || config.accounts.length === 0) {
            return res.status(400).json({ success: false, error: 'No hay cuentas IMAP configuradas.' });
        }

        const enabledAccounts = config.accounts.filter(a => a.enabled !== false);
        if (enabledAccounts.length === 0) {
            return res.status(400).json({ success: false, error: 'No hay cuentas habilitadas.' });
        }

        let totalImported = 0;
        let totalFiltered = 0;
        const errors = [];

        for (const account of enabledAccounts) {
            try {
                console.log(`[SYNC] Sincronizando cuenta: ${account.auth?.user || account.name}...`);
                const result = await imapService.syncEmails(account, config.keywords, config.blacklist, config.requireAttachments);
                totalImported += result.imported;
                totalFiltered += result.filtered || 0;
                console.log(`[SYNC] ${account.auth?.user}: ${result.imported} importados, ${result.filtered || 0} filtrados`);
            } catch (err) {
                console.error(`[SYNC] Error en ${account.auth?.user || account.name}:`, err.message);
                errors.push({ account: account.auth?.user || account.name, error: err.message });
            }
        }

        res.json({
            success: true,
            result: {
                imported: totalImported,
                filtered: totalFiltered,
                accountsSynced: enabledAccounts.length - errors.length,
                errors: errors.length > 0 ? errors : undefined,
                lastSync: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error during sync:', error);
        res.status(500).json({ success: false, error: error.message || 'Error syncing emails' });
    }
});

// GET /api/mail/list
router.get('/list', (req, res) => {
    try {
        const list = imapService.getSyncedEmails();
        res.json({ success: true, list });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Cannot fetch email list' });
    }
});

// POST /api/mail/analyze/:id  - Analyze a single email
const emailAnalyzer = require('../services/emailAnalyzer');

router.post('/analyze/:id', async (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const dbPath = path.join(__dirname, '..', 'database', 'mailDb.json');
        const data = jsonfile.readFileSync(dbPath);
        const emails = data.emails || [];

        const email = emails.find(e => e.id === emailId);
        if (!email) {
            return res.status(404).json({ success: false, error: 'Correo no encontrado' });
        }

        // Run the analyzer
        const analysis = await emailAnalyzer.analyzeEmail(email);

        // Save analysis back into the DB
        email.ai_analysis = analysis;
        if (email.status === 'nuevo') {
            email.status = 'analizado';
        }
        jsonfile.writeFileSync(dbPath, { emails }, { spaces: 2 });

        console.log(`[ANALYZE] Correo ${emailId} analizado: ${analysis.tipoSolicitud} - ${analysis.entidad}`);

        res.json({
            success: true,
            analysis: analysis
        });
    } catch (error) {
        console.error('Error analyzing email:', error);
        res.status(500).json({ success: false, error: 'Error al analizar el correo' });
    }
});

// ===========================================================================
// ANALIZADOR INTELIGENTE — Deep Analysis Endpoints
// ===========================================================================

const documentAnalyzer = require('../services/documentAnalyzer');
const analysisDbPath = path.join(__dirname, '..', 'database', 'analysisDb.json');

function readAnalysisDb() {
    if (!fs.existsSync(analysisDbPath)) return { analyses: [] };
    try { return jsonfile.readFileSync(analysisDbPath); } catch { return { analyses: [] }; }
}
function writeAnalysisDb(data) {
    jsonfile.writeFileSync(analysisDbPath, data, { spaces: 2 });
}

// POST /api/mail/analyze-deep/:id — Full hybrid analysis (Regex + Gemini)
router.post('/analyze-deep/:id', async (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const useGemini = req.body.useGemini !== false; // default true
        const dbPath = path.join(__dirname, '..', 'database', 'mailDb.json');
        const data = jsonfile.readFileSync(dbPath);
        const emails = data.emails || [];

        const email = emails.find(e => e.id === emailId);
        if (!email) {
            return res.status(404).json({ success: false, error: 'Correo no encontrado' });
        }

        console.log(`[DEEP-ANALYZE] Iniciando análisis profundo para correo ${emailId}...`);

        // Run deep analysis
        const analysis = await documentAnalyzer.analyzeDeep(email, { useGemini });

        // Save to analysis history database
        const analysisDb = readAnalysisDb();
        const existingIdx = analysisDb.analyses.findIndex(a => a.emailId === emailId);
        if (existingIdx >= 0) {
            analysisDb.analyses[existingIdx] = analysis;
        } else {
            analysisDb.analyses.push(analysis);
        }
        writeAnalysisDb(analysisDb);

        // Update email status in mailDb
        email.status = 'analizado';
        email.reqType = analysis.tipoDocumento || 'Analizado';
        email.deep_analysis = true;
        jsonfile.writeFileSync(dbPath, { emails }, { spaces: 2 });

        console.log(`[DEEP-ANALYZE] Completado. Motor: ${analysis.motorUsado}, Semáforo: ${analysis.semaforo.porcentaje}%`);

        res.json({ success: true, analysis });
    } catch (error) {
        console.error('Error in deep analysis:', error);
        res.status(500).json({ success: false, error: error.message || 'Error en análisis profundo' });
    }
});

// GET /api/mail/analysis/:id — Get saved analysis
router.get('/analysis/:id', (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const analysisDb = readAnalysisDb();
        const analysis = analysisDb.analyses.find(a => a.emailId === emailId);

        if (!analysis) {
            return res.json({ success: true, analysis: null, message: 'No hay análisis guardado' });
        }

        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener análisis' });
    }
});

// POST /api/mail/analysis/:id/validate — Save user-validated data
router.post('/analysis/:id/validate', (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const { campos } = req.body;

        const analysisDb = readAnalysisDb();
        const analysis = analysisDb.analyses.find(a => a.emailId === emailId);

        if (!analysis) {
            return res.status(404).json({ success: false, error: 'Análisis no encontrado' });
        }

        // Merge user edits into the analysis
        if (campos) {
            for (const [key, value] of Object.entries(campos)) {
                if (analysis.campos[key]) {
                    analysis.campos[key].valor = value;
                    analysis.campos[key].confianza = 'alta';
                    analysis.campos[key].fuente = 'usuario';
                    analysis.campos[key].editadoPor = 'usuario';
                    analysis.campos[key].fechaEdicion = new Date().toISOString();
                } else {
                    analysis.campos[key] = {
                        valor: value,
                        confianza: 'alta',
                        fuente: 'usuario',
                        editadoPor: 'usuario',
                        fechaEdicion: new Date().toISOString()
                    };
                }
            }
        }

        analysis.validadoPorUsuario = true;
        analysis.fechaValidacion = new Date().toISOString();

        // Recalculate semaphore is not needed here since user validated
        writeAnalysisDb(analysisDb);

        // Update email status
        const dbPath = path.join(__dirname, '..', 'database', 'mailDb.json');
        const data = jsonfile.readFileSync(dbPath);
        const email = (data.emails || []).find(e => e.id === emailId);
        if (email) {
            email.status = 'validado';
            jsonfile.writeFileSync(dbPath, { emails: data.emails }, { spaces: 2 });
        }

        res.json({ success: true, message: 'Análisis validado y guardado' });
    } catch (error) {
        console.error('Error validating analysis:', error);
        res.status(500).json({ success: false, error: 'Error al validar' });
    }
});

// GET /api/mail/analysis/:id/export — Export analysis as JSON download
router.get('/analysis/:id/export', (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const analysisDb = readAnalysisDb();
        const analysis = analysisDb.analyses.find(a => a.emailId === emailId);

        if (!analysis) {
            return res.status(404).json({ success: false, error: 'Análisis no encontrado' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analisis_${emailId}.json"`);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al exportar' });
    }
});

module.exports = router;
