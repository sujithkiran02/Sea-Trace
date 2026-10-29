import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Incident } from '../src/types/seatrace';

// Setup browser globals for jsPDF in Node/Vitest
if (typeof (globalThis as any).atob === 'undefined') {
  (globalThis as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}
if (typeof (globalThis as any).btoa === 'undefined') {
  (globalThis as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

describe('Export Engine Dossier Generation & File Downloads', () => {
  let createdUrls: string[] = [];
  let clickedElements: any[] = [];
  let appendedElements: any[] = [];
  let removedElements: any[] = [];

  const mockIncident: Incident = {
    id: 'IN-2026-61C2',
    title: 'Kandla Deepwater Fairway Hydrocarbon Discharge',
    region: 'Gulf of Kutch (West Coast)',
    status: 'VALIDATED',
    severity: 'HIGH',
    lat: 22.5640,
    lng: 69.7820,
    detection_time: '2026-09-14T10:30:00Z',
    source: 'Sentinel-1B C-Band SAR',
    estimated_volume_m3: 75.0,
    spill_type: 'Heavy Fuel Oil (HFO)',
    created_at: '2026-09-14T10:45:00Z',
    updated_at: '2026-09-14T11:00:00Z'
  };

  beforeEach(() => {
    createdUrls = [];
    clickedElements = [];
    appendedElements = [];
    removedElements = [];

    const createMockAnchor = () => {
      const anchor: any = {
        style: {},
        href: '',
        download: '',
        setAttribute: vi.fn((name: string, val: string) => {
          if (name === 'download') anchor.download = val;
        }),
        getAttribute: vi.fn((name: string) => {
          return name === 'download' ? anchor.download : null;
        }),
        click: vi.fn(() => {
          clickedElements.push(anchor);
        })
      };
      return anchor;
    };

    const mockDocument = {
      createElement: vi.fn((tag: string) => {
        if (tag === 'a') return createMockAnchor();
        return {};
      }),
      body: {
        appendChild: vi.fn((el: any) => {
          appendedElements.push(el);
          return el;
        }),
        removeChild: vi.fn((el: any) => {
          removedElements.push(el);
          return el;
        }),
        contains: vi.fn(() => true)
      }
    };

    const mockWindow = {
      atob: (globalThis as any).atob,
      btoa: (globalThis as any).btoa,
      URL: {
        createObjectURL: vi.fn((blob: Blob) => {
          const url = `blob:http://localhost:5173/${Math.random().toString(36).substring(2, 10)}`;
          createdUrls.push(url);
          return url;
        }),
        revokeObjectURL: vi.fn((url: string) => {})
      }
    };

    // Polyfill globals for Node/Vitest test runner
    (globalThis as any).window = mockWindow;
    (globalThis as any).document = mockDocument;
  });

  it('1. triggerBrowserDownload sets proper download attribute and filename extension', async () => {
    const { triggerBrowserDownload } = await import('../src/utils/exportEngine');
    const dummyBlob = new Blob(['Test content'], { type: 'text/plain' });
    const filename = 'SEATRACE_TEST_DOCUMENT.pdf';

    triggerBrowserDownload(dummyBlob, filename);

    expect((globalThis as any).window.URL.createObjectURL).toHaveBeenCalledWith(dummyBlob);
    expect(clickedElements).toHaveLength(1);
    expect(clickedElements[0].download).toBe(filename);
    expect(clickedElements[0].getAttribute('download')).toBe(filename);
    // Ensure URL is NOT revoked synchronously (delay timer)
    expect((globalThis as any).window.URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('2. downloadClientPdf generates valid PDF with correct .pdf filename', async () => {
    const { downloadClientPdf } = await import('../src/utils/exportEngine');
    const filename = downloadClientPdf(mockIncident);
    expect(filename).toMatch(/^SEATRACE_DOSSIER_IN-2026-61C2_\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(clickedElements).toHaveLength(1);
    expect(clickedElements[0].download).toBe(filename);
    expect(clickedElements[0].download.endsWith('.pdf')).toBe(true);
  });

  it('3. downloadClientXlsx generates valid Excel workbook with .xlsx filename', async () => {
    const { downloadClientXlsx } = await import('../src/utils/exportEngine');
    const filename = downloadClientXlsx(mockIncident);
    expect(filename).toMatch(/^SEATRACE_FORENSIC_WORKBOOK_IN-2026-61C2_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(clickedElements).toHaveLength(1);
    expect(clickedElements[0].download).toBe(filename);
    expect(clickedElements[0].download.endsWith('.xlsx')).toBe(true);
  });

  it('4. downloadClientCsv generates valid CSV with .csv filename', async () => {
    const { downloadClientCsv } = await import('../src/utils/exportEngine');
    const filename = downloadClientCsv(mockIncident);
    expect(filename).toMatch(/^SEATRACE_ATTRIBUTION_DATA_IN-2026-61C2_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(clickedElements).toHaveLength(1);
    expect(clickedElements[0].download).toBe(filename);
    expect(clickedElements[0].download.endsWith('.csv')).toBe(true);
  });

  it('5. downloadClientGeoJson generates valid GeoJSON with .geojson filename', async () => {
    const { downloadClientGeoJson } = await import('../src/utils/exportEngine');
    const filename = downloadClientGeoJson(mockIncident);
    expect(filename).toMatch(/^SEATRACE_SPATIAL_FEATURES_IN-2026-61C2_\d{4}-\d{2}-\d{2}\.geojson$/);
    expect(clickedElements).toHaveLength(1);
    expect(clickedElements[0].download).toBe(filename);
    expect(clickedElements[0].download.endsWith('.geojson')).toBe(true);
  });
});
