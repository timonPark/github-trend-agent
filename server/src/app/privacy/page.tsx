import React from 'react';
import Link from 'next/link';
import { getPrivacyPolicyContent, TermsDocument, TermsSection } from '@/lib/terms-content';

function PrivacyHeader({ doc }: { doc: TermsDocument }): React.JSX.Element {
  return (
    <div style={{ marginBottom: '24px', borderBottom: '1px solid #d0d7de', paddingBottom: '16px' }}>
      <Link href="/" style={{ color: '#0969da', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '8px' }}>
        ← 메인 포털로 돌아가기
      </Link>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 8px 0', color: '#1f2328' }}>{doc.title}</h1>
      <p style={{ fontSize: '13px', color: '#656d76', margin: 0 }}>버전: {doc.version} | 시행일자: {doc.effectiveDate}</p>
    </div>
  );
}

function SectionItem({ section }: { section: TermsSection }): React.JSX.Element {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#1f2328', marginBottom: '6px' }}>{section.title}</h2>
      <p style={{ fontSize: '13px', color: '#31373d', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>{section.content}</p>
    </div>
  );
}

export default function PrivacyPage(): React.JSX.Element {
  const doc: TermsDocument = getPrivacyPolicyContent();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa', padding: '32px 16px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #d0d7de', padding: '32px', boxShadow: '0 1px 3px rgba(31, 35, 40, 0.08)' }}>
        <PrivacyHeader doc={doc} />
        {doc.sections.map((s: TermsSection, i: number): React.JSX.Element => (
          <SectionItem key={i} section={s} />
        ))}
      </div>
    </div>
  );
}
