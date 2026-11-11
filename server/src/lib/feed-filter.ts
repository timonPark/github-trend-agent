import { DiscussionArchive } from './types';

export function matchArchiveQuery(archive: DiscussionArchive, query: string): boolean {
  if (!query) return true;
  const q: string = query.trim().toLowerCase();
  if (!q) return true;
  const matchRepo: boolean = archive.repo_full_name.toLowerCase().includes(q);
  const matchUser: boolean = archive.username.toLowerCase().includes(q);
  const matchSummary: boolean = archive.discussion_summary.toLowerCase().includes(q);
  const matchDigest: boolean = Boolean(archive.repo_digest?.toLowerCase().includes(q));
  return matchRepo || matchUser || matchSummary || matchDigest;
}

export function matchArchiveDate(archive: DiscussionArchive, targetDate: string): boolean {
  if (!targetDate || targetDate.trim() === '') return true;
  return archive.snapshot_date === targetDate.trim();
}

export function filterPublicArchives(
  archives: DiscussionArchive[],
  query: string,
  targetDate: string
): DiscussionArchive[] {
  return archives
    .filter(
      (a: DiscussionArchive): boolean =>
        matchArchiveQuery(a, query) && matchArchiveDate(a, targetDate)
    )
    .sort((a: DiscussionArchive, b: DiscussionArchive): number => {
      const timeA: number = new Date(a.created_at).getTime();
      const timeB: number = new Date(b.created_at).getTime();
      return timeB - timeA;
    });
}
