type AtsScoreBadgeProps = {
  score: number;
};

export default function AtsScoreBadge({ score }: AtsScoreBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.12)] px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
      <span className="text-xs font-medium text-[#22C55E]">ATS Score: {score}%</span>
    </div>
  );
}
