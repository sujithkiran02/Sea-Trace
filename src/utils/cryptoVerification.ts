import type { Incident, EvidenceArtifact, AuditEvent, VerificationStatus } from '../types/seatrace';

export interface VerifyResult {
  artifact_id: string;
  status: VerificationStatus;
  expected_hash: string;
  calculated_hash: string;
  is_match: boolean;
  byte_size: number;
  timestamp: string;
  error_message?: string;
}

/**
 * Calculates cryptographic SHA-256 hex digest from real bytes using native Web Crypto API
 */
export async function calculateSha256(content: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const data = typeof content === 'string' ? encoder.encode(content) : content;
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies the integrity of an evidence artifact by calculating the SHA-256 digest
 * from its actual bytes and comparing it with the trusted recorded digest.
 *
 * NEVER marks an artifact as verified merely because a hash string exists.
 */
export async function verifyArtifactIntegrity(
  artifact: EvidenceArtifact
): Promise<VerifyResult> {
  // If simulated tampering is active, use tampered byte stream; otherwise use authentic raw content
  const content = artifact.is_tampered && artifact.tampered_content
    ? artifact.tampered_content
    : artifact.raw_content;

  if (content === undefined || content === null) {
    return {
      artifact_id: artifact.id,
      status: 'VERIFICATION_FAILED',
      expected_hash: artifact.sha256_hash,
      calculated_hash: '',
      is_match: false,
      byte_size: 0,
      timestamp: new Date().toISOString(),
      error_message: 'Original evidence byte stream is missing from the local custody repository.'
    };
  }

  try {
    const calculated = await calculateSha256(content);
    const isMatch = calculated.toLowerCase() === artifact.sha256_hash.toLowerCase();

    return {
      artifact_id: artifact.id,
      status: isMatch ? 'VERIFIED' : 'INTEGRITY_MISMATCH',
      expected_hash: artifact.sha256_hash,
      calculated_hash: calculated,
      is_match: isMatch,
      byte_size: new TextEncoder().encode(content).length,
      timestamp: new Date().toISOString(),
      error_message: isMatch
        ? undefined
        : `Cryptographic digest mismatch: Expected ${artifact.sha256_hash.substring(0, 12)}... but computed ${calculated.substring(0, 12)}... (tamper detected)`
    };
  } catch (err: any) {
    return {
      artifact_id: artifact.id,
      status: 'VERIFICATION_FAILED',
      expected_hash: artifact.sha256_hash,
      calculated_hash: '',
      is_match: false,
      byte_size: 0,
      timestamp: new Date().toISOString(),
      error_message: `Web Crypto verification execution failure: ${err?.message || 'Unknown crypto fault'}`
    };
  }
}

/**
 * Validates the schema and cryptographic completeness of a JSON Evidence Manifest
 */
export function validateManifestJson(manifestString: string): { valid: boolean; errors: string[]; parsed?: any } {
  const errors: string[] = [];

  let parsed: any;
  try {
    parsed = JSON.parse(manifestString);
  } catch (e: any) {
    return {
      valid: false,
      errors: [`JSON syntax error: ${e.message}`]
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Manifest root must be an object.'] };
  }

  if (!parsed.incident_id || typeof parsed.incident_id !== 'string') {
    errors.push('Missing or invalid "incident_id"');
  }

  if (!parsed.manifest_generation_time) {
    errors.push('Missing "manifest_generation_time"');
  }

  if (!Array.isArray(parsed.artifacts)) {
    errors.push('Missing or invalid "artifacts" array');
  } else {
    parsed.artifacts.forEach((art: any, index: number) => {
      if (!art.id) errors.push(`Artifact at index ${index} missing "id"`);
      if (!art.sha256_digest) errors.push(`Artifact ${art.id || index} missing "sha256_digest"`);
      if (!art.filename) errors.push(`Artifact ${art.id || index} missing "filename"`);
      if (!art.verification_status) errors.push(`Artifact ${art.id || index} missing "verification_status"`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    parsed
  };
}

/**
 * Generates court-compliant structured Evidence Manifest
 */
export function generateEvidenceManifest(
  incident: Incident,
  artifacts: EvidenceArtifact[],
  auditTrail: AuditEvent[]
) {
  const verifiedCount = artifacts.filter(a => a.verification_status === 'VERIFIED').length;
  const mismatchCount = artifacts.filter(a => a.verification_status === 'INTEGRITY_MISMATCH').length;
  const unverifiedCount = artifacts.filter(a => a.verification_status === 'UNVERIFIED').length;

  return {
    manifest_spec: 'SeaTrace-CryptoAudit-v2.4',
    incident_id: incident.id,
    incident_title: incident.title,
    maritime_region: incident.region,
    detection_coordinates: {
      latitude: incident.lat,
      longitude: incident.lng
    },
    governance_authority: 'Directorate General of Lighthouses & Lightships (DGLL) & Indian Coast Guard',
    statutory_jurisdiction: 'Indian Merchant Shipping Act 1958 (Part XIA) & UNCLOS Art. 211/220',
    manifest_generation_time: new Date().toISOString(),
    overall_integrity_summary: {
      total_artifacts: artifacts.length,
      verified_artifacts: verifiedCount,
      integrity_mismatches: mismatchCount,
      unverified_artifacts: unverifiedCount,
      custody_status: mismatchCount > 0 ? 'INTEGRITY_COMPROMISED' : verifiedCount === artifacts.length ? 'FULLY_AUTHENTICATED' : 'PARTIALLY_VERIFIED'
    },
    artifacts: artifacts.map(art => ({
      id: art.id,
      title: art.title,
      filename: art.filename,
      mime_type: art.mime_type,
      file_size_bytes: art.file_size_bytes,
      sha256_digest: art.sha256_hash,
      calculated_sha256: art.calculated_hash || null,
      verification_status: art.verification_status,
      source_provenance: art.source_provenance,
      collector: art.collector,
      acquisition_time: art.acquisition_time || null,
      ingested_at: art.ingested_at,
      processing_history: art.processing_history || [],
      upstream_dependencies: art.upstream_ids || [],
      downstream_dependents: art.downstream_ids || [],
      verification_history: art.verification_history || []
    })),
    append_only_audit_ledger: auditTrail.map(event => ({
      event_id: event.id,
      timestamp: event.timestamp,
      actor: event.actor,
      action: event.action,
      artifact_id: event.artifact_id || 'GENERAL',
      outcome: event.outcome || 'SUCCESS',
      details: event.details
    }))
  };
}
