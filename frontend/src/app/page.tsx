import { connection } from "next/server";
import styles from "./page.module.css";

type ServiceState = { online: boolean; detail: string };

async function checkEndpoint(path: string): Promise<ServiceState> {
  const apiUrl = process.env.API_URL ?? "http://localhost:8080";

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return { online: false, detail: `HTTP ${response.status}` };
    return { online: true, detail: "Terhubung" };
  } catch {
    return { online: false, detail: "Belum terhubung" };
  }
}

export default async function Home() {
  await connection();
  const [api, database] = await Promise.all([
    checkEndpoint("/api/v1/health"),
    checkEndpoint("/api/v1/ready"),
  ]);

  return (
    <main className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Belajar Scraping">
          <span className={styles.mark}>BS</span>
          <span>Belajar Scraping</span>
        </a>
        <span className={styles.edition}>Foundation / 01</span>
      </header>

      <section className={styles.hero} id="top">
        <p className={styles.eyebrow}>Project foundation</p>
        <h1>Fondasi siap.<br /><em>Data berikutnya.</em></h1>
        <p className={styles.lead}>
          Ruang kerja awal untuk membangun alur scraping yang terukur—dengan
          frontend Next.js, API Go Fiber, dan PostgreSQL.
        </p>
      </section>

      <section className={styles.statusSection} aria-labelledby="system-status">
        <div className={styles.sectionHeading}>
          <p>01 / Sistem</p>
          <h2 id="system-status">Status koneksi</h2>
        </div>
        <div className={styles.statusList}>
          <article className={styles.statusItem}>
            <span className={`${styles.dot} ${api.online ? styles.online : styles.offline}`} aria-hidden="true" />
            <div><h3>Go Fiber API</h3><p>Endpoint /api/v1/health</p></div>
            <span className={styles.state}>{api.detail}</span>
          </article>
          <article className={styles.statusItem}>
            <span className={`${styles.dot} ${database.online ? styles.online : styles.offline}`} aria-hidden="true" />
            <div><h3>PostgreSQL</h3><p>Readiness melalui GORM</p></div>
            <span className={styles.state}>{database.detail}</span>
          </article>
        </div>
      </section>

      <section className={styles.stack} aria-labelledby="technology-stack">
        <div className={styles.sectionHeading}>
          <p>02 / Stack</p>
          <h2 id="technology-stack">Empat lapis, satu alur</h2>
        </div>
        <ol className={styles.stackList}>
          <li><span>01</span><strong>Next.js</strong><small>Interface</small></li>
          <li><span>02</span><strong>Go Fiber</strong><small>API</small></li>
          <li><span>03</span><strong>GORM</strong><small>Data access</small></li>
          <li><span>04</span><strong>PostgreSQL</strong><small>Storage</small></li>
        </ol>
      </section>

      <footer className={styles.footer}>
        <p>Built as a clean starting point.</p>
        <p>Next.js 16 · Go 1.26</p>
      </footer>
    </main>
  );
}

