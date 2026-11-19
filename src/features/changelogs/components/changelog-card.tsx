import { ArrowRightIcon, GitCommitHorizontalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Changelog } from "@/interface/changelog.interface";
import { formatReleaseDate, isHttpUrl } from "../changelog.constants";

export function ChangelogCard({
  entry,
  onSelect,
}: {
  entry: Changelog;
  onSelect: (id: string) => void;
}) {
  return (
    <article className="space-y-3 rounded-lg border-2 border-border bg-card p-4 shadow-neo-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="font-mono">{entry.version}</Badge>
            <h2 className="break-words font-bold">{entry.project.name}</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatReleaseDate(entry.released_at)} · Recorded by {entry.creator.name}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onSelect(entry.id)}>
          View release <ArrowRightIcon />
        </Button>
      </div>
      {entry.description && (
        <p className="whitespace-pre-wrap break-words text-sm">{entry.description}</p>
      )}
      {entry.changes.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {entry.changes.map((change) => (
            <li key={change.id} className="whitespace-pre-wrap break-words">
              {change.description}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No change items recorded.</p>
      )}
      {entry.commit_url && isHttpUrl(entry.commit_url) && (
        <a
          href={entry.commit_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-2 break-all text-sm text-muted-foreground hover:underline"
        >
          <GitCommitHorizontalIcon className="size-4 shrink-0" /> View commit
        </a>
      )}
    </article>
  );
}
