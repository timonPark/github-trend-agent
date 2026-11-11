import { LocalArchive } from './types';

export type ArchiveVisibilityFilter = 'all' | 'public' | 'private';

function matchesSearch(archive: LocalArchive, query: string): boolean {
  if (!query || query.trim().length === 0) {
    return true;
  }
  const q: string = query.trim().toLowerCase();
  const nameMatch: boolean = archive.repo_full_name.toLowerCase().includes(q);
  const summaryMatch: boolean = archive.discussion_summary.toLowerCase().includes(q);
  const digestMatch: boolean = archive.repo_digest.toLowerCase().includes(q);
  return nameMatch || summaryMatch || digestMatch;
}

function matchesVisibility(archive: LocalArchive, filter: ArchiveVisibilityFilter): boolean {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'public') {
    return archive.is_public;
  }
  return !archive.is_public;
}

export function filterArchives(
  archives: LocalArchive[],
  searchQuery: string,
  visibility: ArchiveVisibilityFilter
): LocalArchive[] {
  return archives.filter((a: LocalArchive): boolean => {
    return matchesSearch(a, searchQuery) && matchesVisibility(a, visibility);
  });
}
