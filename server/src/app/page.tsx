export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>GitHub Trend Agent - Central Server</h1>
      <p>중앙 서버가 정상 구동 중입니다. (Next.js + Supabase Storage)</p>
      <ul>
        <li><a href="/api/health">Health Check API (/api/health)</a></li>
      </ul>
    </main>
  );
}
