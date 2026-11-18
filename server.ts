import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.resolve(process.cwd(), '.ideacard-store.json');

const SHARED_KEYS = new Set([
  'ideacard_users_v1',
  'ideacard_workspaces_v1',
  'ideacard_ideas_v1',
  'ideacard_anon_vault_v1',
  'ideacard_reports_v1',
  'ideacard_reflections_v1',
  'ideacard_notifications_v1',
  'ideacard_programs_v1',
  'ideacard_monthly_notes_v1',
  'ideacard_bidang_proposals_v1',
  'ideacard_seeded_v1',
]);

type StoreData = Record<string, unknown>;

function readStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as StoreData;
  } catch {
    return {};
  }
}

function writeStore(store: StoreData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Gagal menulis store server:', err);
  }
}

export function normalizeJoinCode(raw: string): string {
  let value = raw.trim();
  // Ekstrak kode jika pengguna menempelkan tautan penuh (?ruang=KODE atau ?gabung=KODE)
  try {
    if (value.includes('http://') || value.includes('https://') || value.includes('?')) {
      const urlCandidate = value.startsWith('http')
        ? value
        : `https://example.com/${value.replace(/^\/+/, '')}`;
      const parsed = new URL(urlCandidate);
      const fromQuery = parsed.searchParams.get('ruang') || parsed.searchParams.get('gabung');
      if (fromQuery) value = fromQuery;
    }
  } catch {
    // Abaikan jika bukan format URL
  }
  // Hapus awalan label seperti "Kode Gabung:" atau tanda kutip
  value = value.replace(/^kode(\s+gabung|\s+ruang)?\s*[:=]\s*/i, '');
  // Samakan berbagai jenis tanda hubung (en-dash, em-dash, minus) dan hapus spasi
  value = value.replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, '');
  return value.toUpperCase();
}

function stripHyphens(code: string): string {
  return code.replace(/[^A-Z0-9]/g, '');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Ambil seluruh state bersama dari server
  app.get('/api/state', (_req, res) => {
    res.json(readStore());
  });

  // Simpan satu koleksi berdasarkan key
  app.put('/api/state/:key', (req, res) => {
    const { key } = req.params;
    if (!SHARED_KEYS.has(key)) {
      res.status(400).json({ error: 'Key tidak diizinkan.' });
      return;
    }
    const store = readStore();
    store[key] = req.body?.value;
    writeStore(store);
    res.json({ ok: true });
  });

  // Gabung ruang secara atomik berdasarkan kode ruang
  app.post('/api/workspaces/join', (req, res) => {
    const { code, user } = req.body as {
      code?: string;
      user?: { id: string; username: string; displayName?: string };
    };
    if (!code || !user?.id) {
      res.status(400).json({ error: 'Kode ruang dan data pengguna wajib diisi.' });
      return;
    }

    const cleanCode = normalizeJoinCode(code);
    const cleanNoHyphen = stripHyphens(cleanCode);
    if (!cleanNoHyphen) {
      res.status(400).json({ error: 'Kode ruang tidak boleh kosong.' });
      return;
    }

    const store = readStore();
    const workspaces = Array.isArray(store['ideacard_workspaces_v1'])
      ? (store['ideacard_workspaces_v1'] as Array<Record<string, unknown>>)
      : [];

    const idx = workspaces.findIndex((w) => {
      const wsCode = normalizeJoinCode(String(w.joinCode || ''));
      return wsCode === cleanCode || stripHyphens(wsCode) === cleanNoHyphen;
    });

    if (idx === -1) {
      res.status(404).json({
        error: 'Kode ruang tidak ditemukan. Periksa kembali kode dari admin ruangmu.',
      });
      return;
    }

    const ws = workspaces[idx];
    const members = Array.isArray(ws.members)
      ? (ws.members as Array<Record<string, unknown>>)
      : [];
    const alreadyMember = members.some((m) => m.userId === user.id);

    if (!alreadyMember) {
      const updatedWs = {
        ...ws,
        members: [
          ...members,
          {
            userId: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            role: 'anggota',
            joinedAt: new Date().toISOString(),
          },
        ],
      };
      workspaces[idx] = updatedWs;
      store['ideacard_workspaces_v1'] = workspaces;
      writeStore(store);
    }

    res.json({ workspace: workspaces[idx], workspaces });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IdeaCard server berjalan pada http://0.0.0.0:${PORT}`);
  });
}

startServer();
