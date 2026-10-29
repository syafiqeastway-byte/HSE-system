import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Endpoint to fetch employee list from Supabase MAIN EMPLOYEE ID
  app.get('/api/employees', async (req, res) => {
    try {
      const url = 'https://rgpkzyqytepatahedsfp.supabase.co/rest/v1/MAIN%20EMPLOYEE%20ID';
      const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_HhufO6p-mEKEhKE2lHPeaA_Mz1XPe3H';
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, data });
      }
      return res.status(response.status).json({ success: false, error: 'Supabase error ' + response.status });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Endpoint to fetch latest FORM NO from Google Sheet (NEW IR, Column A) and generate next number
  app.get('/api/latest-form-no', async (req, res) => {
    try {
      const sheetId = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
      const sheetName = encodeURIComponent('NEW IR');
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Sheet response: ${response.status}`);
      }
      const text = await response.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      const formNumbers: string[] = [];
      for (const line of lines) {
        const match = line.match(/^"([^"]*)"/);
        const val = (match ? match[1] : line.split(',')[0]).trim();
        if (
          val &&
          !val.toUpperCase().includes('INCIDENT REPORT') &&
          !val.toUpperCase().includes('FORM NO') &&
          !val.toUpperCase().includes('REPORT NO')
        ) {
          formNumbers.push(val);
        }
      }

      const lastFormNo = formNumbers[formNumbers.length - 1] || 'EE-INC-062';
      let nextFormNo = 'EE-INC-001';
      const numMatch = lastFormNo.match(/^(.*?)(\d+)$/);
      if (numMatch) {
        const prefix = numMatch[1];
        const numStr = numMatch[2];
        const nextNum = parseInt(numStr, 10) + 1;
        nextFormNo = `${prefix}${String(nextNum).padStart(numStr.length, '0')}`;
      }

      return res.json({
        success: true,
        lastFormNo,
        nextFormNo
      });
    } catch (e: any) {
      console.warn('Error fetching latest FORM NO from Google Sheet:', e);
      return res.json({
        success: true,
        lastFormNo: 'EE-INC-062',
        nextFormNo: 'EE-INC-063',
        fallback: true
      });
    }
  });

  // API Endpoint for AI Incident Report Generation
  app.post('/api/generate-incident-report', async (req, res) => {
    try {
      const { kronologiBm, chronology } = req.body;
      const inputChronology = (chronology || kronologiBm || '').trim();

      if (!inputChronology) {
        return res.status(400).json({ error: 'Please enter the incident chronology.' });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are an experienced Health, Safety, and Environment (HSE) Officer at Eastway Engineering.

The user provided the following incident chronology:
"${inputChronology}"

Task:
Generate a formal HSE incident report strictly in 100% standard English. Regardless of whether the input is in Bahasa Melayu, mixed or colloquial language, ALL generated output fields must be purely in professional, fluent English:
1. 'description': A well-written, formal English standard essay detailing the chronology, operational context, and immediate outcome of the incident.
2. 'preliminaryCauses': Key preliminary root causes and contributing factors strictly in English (provide all relevant and comprehensive points).
3. 'preventiveActions': Practical corrective and preventive action plans (CAPA) strictly in English (provide all relevant and actionable points).`;

      let responseText = '{}';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: {
                  type: Type.STRING,
                  description: 'A comprehensive, formal English standard essay describing the chronology and details of the incident.',
                },
                preliminaryCauses: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of all analyzed preliminary causes strictly in English.',
                },
                preventiveActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of all relevant preventive and corrective actions (CAPA) strictly in English.',
                },
              },
              required: ['description', 'preliminaryCauses', 'preventiveActions'],
            },
          },
        });
        responseText = response.text || '{}';
      } catch (primaryErr: any) {
        console.warn('Primary model gemini-3.5-flash-lite retry with gemini-3.1-flash-lite:', primaryErr?.message);
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                preliminaryCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                preventiveActions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['description', 'preliminaryCauses', 'preventiveActions'],
            },
          },
        });
        responseText = fallbackRes.text || '{}';
      }
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        parsed = {
          description: responseText,
          preliminaryCauses: ['Pending detailed investigation', 'Equipment and operational factors'],
          preventiveActions: ['Enforce safe work procedures', 'Conduct site safety briefing'],
        };
      }

      const causesList = Array.isArray(parsed.preliminaryCauses) ? parsed.preliminaryCauses : [];
      const actionsList = Array.isArray(parsed.preventiveActions) ? parsed.preventiveActions : [];

      return res.json({
        success: true,
        description: parsed.description || '',
        preliminaryCauses: causesList,
        preventiveActions: actionsList,
      });
    } catch (err: any) {
      console.error('Error generating AI incident report:', err);
      return res.status(500).json({ error: err?.message || 'Failed to generate incident report using AI.' });
    }
  });

  // Serve Frontend
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
