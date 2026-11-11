import { describe, it, expect, beforeEach } from 'vitest';
import { getTermsOfServiceContent, getPrivacyPolicyContent, TermsDocument } from '../src/lib/terms-content';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { resetServerDbForTest, getServerDb } from '../src/lib/db';
import { User } from '../src/lib/types';

describe('Terms of Service and Privacy Policy Module', (): void => {
  beforeEach((): void => {
    resetServerDbForTest();
  });

  it('provides structured terms of service content', (): void => {
    const terms: TermsDocument = getTermsOfServiceContent();
    expect(terms.title).toContain('이용약관');
    expect(terms.version).toBe('1.0.0');
    expect(terms.sections.length).toBeGreaterThanOrEqual(4);
    expect(terms.sections[0].title).toContain('제1조');
  });

  it('provides structured privacy policy content', (): void => {
    const privacy: TermsDocument = getPrivacyPolicyContent();
    expect(privacy.title).toContain('개인정보');
    expect(privacy.version).toBe('1.0.0');
    expect(privacy.sections.length).toBeGreaterThanOrEqual(4);
    expect(privacy.sections[0].title).toContain('수집하는 개인정보');
  });

  it('blocks registration when terms_agreed is omitted or false', async (): Promise<void> => {
    const resOmitted: Response = await registerHandler(
      new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'termstest1', password: 'password123' }),
      })
    );
    expect(resOmitted.status).toBe(400);
    const dataOmitted: { error: string } = (await resOmitted.json()) as { error: string };
    expect(dataOmitted.error).toContain('약관');

    const resFalse: Response = await registerHandler(
      new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'termstest2', password: 'password123', terms_agreed: false }),
      })
    );
    expect(resFalse.status).toBe(400);
  });

  it('records terms_agreed_at in user database when registration succeeds', async (): Promise<void> => {
    const res: Response = await registerHandler(
      new Request('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'agreeduser', password: 'password123', terms_agreed: true }),
      })
    );
    expect(res.status).toBe(201);
    const data: { user: User } = (await res.json()) as { user: User };
    expect(data.user.terms_agreed_at).toBeDefined();

    const dbUser: User | null = await getServerDb().findUserByUsername('agreeduser');
    expect(dbUser?.terms_agreed_at).toBe(data.user.terms_agreed_at);
  });
});
