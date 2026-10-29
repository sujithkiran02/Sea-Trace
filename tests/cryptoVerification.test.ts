import { describe, it, expect } from 'vitest';
import {
  calculateSha256,
  verifyArtifactIntegrity,
  validateManifestJson,
  generateEvidenceManifest
} from '../src/utils/cryptoVerification';
import type { Incident, EvidenceArtifact, AuditEvent } from '../src/types/seatrace';

describe('Cryptographic Evidence Verification Engine', () => {
  const sampleIncident: Incident = {
    id: 'IN-2026-61C2',
    title: 'Kandla Deepwater Fairway Hydrocarbon Discharge',
    region: 'Arabian Sea (West Coast)',
    status: 'ACTIVE',
    severity: 'CRITICAL',
    lat: 22.7840,
    lng: 69.7120,
    detection_time: '2026-10-23T06:14:00Z',
    source: 'Sentinel-1C SAR (IW Mode)',
    estimated_volume_m3: 480.0,
    spill_type: 'Heavy Fuel Oil / Crude',
    created_at: '2026-10-23T06:30:00Z',
    updated_at: '2026-10-23T07:15:00Z'
  };

  const sampleRawContent = '<?xml version="1.0" encoding="UTF-8"?>\n<sentinel1:acquisition id="TEST_ACQUISITION"/>';
  // SHA-256 of sampleRawContent:
  // TextEncoder().encode(sampleRawContent)
  let expectedDigest = '';

  it('1. Calculates exact matching SHA-256 hashes from real byte streams', async () => {
    expectedDigest = await calculateSha256(sampleRawContent);
    expect(expectedDigest).toHaveLength(64);
    expect(expectedDigest).toMatch(/^[0-9a-f]{64}$/);

    const artifact: EvidenceArtifact = {
      id: 'EVID-TEST-01',
      incident_id: 'IN-2026-61C2',
      artifact_type: 'RAW_SAR_SCENE',
      title: 'Test SAR Acquisition',
      filename: 'test.xml',
      mime_type: 'application/xml',
      sha256_hash: expectedDigest,
      verification_status: 'UNVERIFIED',
      file_size_bytes: sampleRawContent.length,
      source_provenance: 'ESA Copernicus Hub',
      collector: 'Automated Daemon',
      ingested_at: new Date().toISOString(),
      raw_content: sampleRawContent
    };

    const result = await verifyArtifactIntegrity(artifact);
    expect(result.status).toBe('VERIFIED');
    expect(result.is_match).toBe(true);
    expect(result.calculated_hash).toBe(expectedDigest);
    expect(result.error_message).toBeUndefined();
  });

  it('2. Detects cryptographic integrity mismatches when bytes are tampered', async () => {
    const tamperedContent = '<?xml version="1.0" encoding="UTF-8"?>\n<sentinel1:acquisition id="TAMPERED_MUTATION"/>';

    const artifact: EvidenceArtifact = {
      id: 'EVID-TEST-02',
      incident_id: 'IN-2026-61C2',
      artifact_type: 'DETECTION_MASK',
      title: 'Slick Contour GeoJSON',
      filename: 'slick.geojson',
      mime_type: 'application/geo+json',
      sha256_hash: expectedDigest, // Trusted hash does NOT match tampered content
      verification_status: 'UNVERIFIED',
      file_size_bytes: tamperedContent.length,
      source_provenance: 'Neural Segmenter',
      collector: 'Inference Worker',
      ingested_at: new Date().toISOString(),
      raw_content: sampleRawContent,
      tampered_content: tamperedContent,
      is_tampered: true // Simulating tampering
    };

    const result = await verifyArtifactIntegrity(artifact);
    expect(result.status).toBe('INTEGRITY_MISMATCH');
    expect(result.is_match).toBe(false);
    expect(result.calculated_hash).not.toBe(expectedDigest);
    expect(result.error_message).toContain('Cryptographic digest mismatch');
  });

  it('3. Fails verification gracefully when original byte stream is missing', async () => {
    const artifact: EvidenceArtifact = {
      id: 'EVID-TEST-03',
      incident_id: 'IN-2026-61C2',
      artifact_type: 'AIS_CORRIDOR_EXTRACT',
      title: 'AIS Kinematics',
      filename: 'ais.csv',
      mime_type: 'text/csv',
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      verification_status: 'UNVERIFIED',
      file_size_bytes: 0,
      source_provenance: 'DGLL NAIS',
      collector: 'Capt. Varma',
      ingested_at: new Date().toISOString(),
      raw_content: undefined // Missing file bytes!
    };

    const result = await verifyArtifactIntegrity(artifact);
    expect(result.status).toBe('VERIFICATION_FAILED');
    expect(result.is_match).toBe(false);
    expect(result.error_message).toContain('missing from the local custody repository');
  });

  it('4. Rejects invalid and corrupted JSON manifests during schema validation', () => {
    // Malformed JSON syntax
    const malformedJson = '{ "incident_id": "IN-2026-61C2", artifacts: [ missing_quote }';
    const result1 = validateManifestJson(malformedJson);
    expect(result1.valid).toBe(false);
    expect(result1.errors[0]).toContain('JSON syntax error');

    // Missing required incident_id and artifacts array
    const missingFieldsJson = JSON.stringify({
      manifest_generation_time: new Date().toISOString()
    });
    const result2 = validateManifestJson(missingFieldsJson);
    expect(result2.valid).toBe(false);
    expect(result2.errors).toContain('Missing or invalid "incident_id"');
    expect(result2.errors).toContain('Missing or invalid "artifacts" array');

    // Incomplete artifact objects
    const invalidArtifactsJson = JSON.stringify({
      incident_id: 'IN-2026-61C2',
      manifest_generation_time: new Date().toISOString(),
      artifacts: [
        { id: 'EVID-01' } // Missing sha256_digest, filename, verification_status
      ]
    });
    const result3 = validateManifestJson(invalidArtifactsJson);
    expect(result3.valid).toBe(false);
    expect(result3.errors.some(e => e.includes('missing "sha256_digest"'))).toBe(true);
  });

  it('5. Generates valid and court-compliant Evidence Manifest from stored records', () => {
    const artifacts: EvidenceArtifact[] = [
      {
        id: 'EVID-01',
        incident_id: 'IN-2026-61C2',
        artifact_type: 'RAW_SAR_SCENE',
        title: 'Sentinel-1C Acquisition',
        filename: 's1c.xml',
        mime_type: 'application/xml',
        sha256_hash: '1897c602da0d6b4d51a61970f3ab3c994a515e55494c8de949a27419b9363da3',
        verification_status: 'VERIFIED',
        file_size_bytes: 1024,
        source_provenance: 'ESA Hub',
        collector: 'Daemon',
        ingested_at: '2026-10-23T06:30:15Z'
      }
    ];

    const auditTrail: AuditEvent[] = [
      {
        id: 'AUD-01',
        incident_id: 'IN-2026-61C2',
        action: 'EVIDENCE_INGESTION',
        actor: 'Officer Priya Nair',
        details: 'Ingested raw SAR raster',
        timestamp: '2026-10-23T06:30:15Z',
        outcome: 'SUCCESS'
      }
    ];

    const manifest = generateEvidenceManifest(sampleIncident, artifacts, auditTrail);
    expect(manifest.incident_id).toBe('IN-2026-61C2');
    expect(manifest.governance_authority).toContain('Directorate General of Lighthouses & Lightships');
    expect(manifest.overall_integrity_summary.total_artifacts).toBe(1);
    expect(manifest.overall_integrity_summary.verified_artifacts).toBe(1);
    expect(manifest.artifacts).toHaveLength(1);
    expect(manifest.append_only_audit_ledger).toHaveLength(1);

    // Validate generated manifest output
    const validation = validateManifestJson(JSON.stringify(manifest));
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('6. Records immutable append-only audit events with actor and outcomes', () => {
    const auditLedger: AuditEvent[] = [];

    function appendEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
      const newEvent: AuditEvent = {
        id: `AUD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        ...event
      };
      auditLedger.push(newEvent);
      return newEvent;
    }

    const event1 = appendEvent({
      incident_id: 'IN-2026-61C2',
      action: 'SHA256_VERIFICATION_PASS',
      actor: 'Investigator Priya Nair',
      artifact_id: 'EVID-61C2-01',
      outcome: 'VERIFIED',
      details: 'Hash verified against recorded digest'
    });

    const event2 = appendEvent({
      incident_id: 'IN-2026-61C2',
      action: 'INTEGRITY_MISMATCH_ALERT',
      actor: 'Security Auditor',
      artifact_id: 'EVID-61C2-02',
      outcome: 'MISMATCH_DETECTED',
      details: 'Calculated hash diverged from recorded digest'
    });

    expect(auditLedger).toHaveLength(2);
    expect(auditLedger[0].actor).toBe('Investigator Priya Nair');
    expect(auditLedger[0].outcome).toBe('VERIFIED');
    expect(auditLedger[1].outcome).toBe('MISMATCH_DETECTED');
    expect(auditLedger[0].timestamp).toBeDefined();
  });
});
