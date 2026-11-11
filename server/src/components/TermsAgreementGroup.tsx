'use client';

import React from 'react';

interface TermsAgreementGroupProps {
  agreedTerms: boolean;
  agreedPrivacy: boolean;
  onChangeTerms: (checked: boolean) => void;
  onChangePrivacy: (checked: boolean) => void;
  onOpenTermsModal: (type: 'terms' | 'privacy') => void;
}

function AgreementRow({
  id,
  label,
  checked,
  onChange,
  onViewClick,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  onViewClick: () => void;
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1f2328', cursor: 'pointer' }}>
        <input id={id} type="checkbox" checked={checked} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => onChange(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#1f883d' }} />
        <span><strong style={{ color: '#cf222e' }}>[필수]</strong> {label}</span>
      </label>
      <button type="button" onClick={onViewClick} style={{ border: 'none', background: 'none', color: '#0969da', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>보기</button>
    </div>
  );
}

export function TermsAgreementGroup({
  agreedTerms,
  agreedPrivacy,
  onChangeTerms,
  onChangePrivacy,
  onOpenTermsModal,
}: TermsAgreementGroupProps): React.JSX.Element {
  const isAllAgreed: boolean = agreedTerms && agreedPrivacy;
  const handleToggleAll = (checked: boolean): void => {
    onChangeTerms(checked);
    onChangePrivacy(checked);
  };

  return (
    <div style={{ padding: '10px 12px', backgroundColor: '#f6f8fa', borderRadius: '6px', border: '1px solid #d0d7de', marginBottom: '14px' }}>
      <div style={{ paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #e1e4e8' }}>
        <label htmlFor="terms-agree-all" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1f2328', cursor: 'pointer' }}>
          <input id="terms-agree-all" type="checkbox" checked={isAllAgreed} onChange={(e: React.ChangeEvent<HTMLInputElement>): void => handleToggleAll(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#1f883d' }} />
          <span>모든 필수 약관에 전체 동의합니다.</span>
        </label>
      </div>
      <AgreementRow id="terms-agree-service" label="서비스 이용약관 동의" checked={agreedTerms} onChange={onChangeTerms} onViewClick={(): void => onOpenTermsModal('terms')} />
      <AgreementRow id="terms-agree-privacy" label="개인정보 수집 및 이용 동의" checked={agreedPrivacy} onChange={onChangePrivacy} onViewClick={(): void => onOpenTermsModal('privacy')} />
    </div>
  );
}
