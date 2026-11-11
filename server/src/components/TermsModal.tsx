'use client';

import React from 'react';
import { getTermsOfServiceContent, getPrivacyPolicyContent, TermsDocument, TermsSection } from '../lib/terms-content';

interface TermsModalProps {
  isOpen: boolean;
  type: 'terms' | 'privacy';
  onClose: () => void;
}

function TermsModalHeader({ title, onClose }: { title: string; onClose: () => void }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #d0d7de' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2328' }}>{title}</h3>
      <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#656d76' }}>✕</button>
    </div>
  );
}

function TermsModalBody({ doc }: { doc: TermsDocument }): React.JSX.Element {
  return (
    <div style={{ padding: '20px', maxHeight: '380px', overflowY: 'auto' }}>
      <p style={{ fontSize: '12px', color: '#656d76', marginTop: 0, marginBottom: '16px' }}>버전: {doc.version} | 시행일: {doc.effectiveDate}</p>
      {doc.sections.map((sec: TermsSection, idx: number): React.JSX.Element => (
        <div key={idx} style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 6px 0', color: '#1f2328' }}>{sec.title}</h4>
          <p style={{ fontSize: '12px', color: '#57606a', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{sec.content}</p>
        </div>
      ))}
    </div>
  );
}

export function TermsModal({ isOpen, type, onClose }: TermsModalProps): React.JSX.Element | null {
  if (!isOpen) return null;
  const doc: TermsDocument = type === 'terms' ? getTermsOfServiceContent() : getPrivacyPolicyContent();

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(31, 35, 40, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '540px', maxWidth: '92%', border: '1px solid #d0d7de', boxShadow: '0 8px 24px rgba(140, 149, 159, 0.25)' }}>
        <TermsModalHeader title={doc.title} onClose={onClose} />
        <TermsModalBody doc={doc} />
        <div style={{ padding: '12px 20px', borderTop: '1px solid #d0d7de', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f6f8fa', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, backgroundColor: '#0969da', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>확인</button>
        </div>
      </div>
    </div>
  );
}
