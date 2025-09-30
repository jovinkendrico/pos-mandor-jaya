import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TooltipCell({ text, maxWidth }: { text: string | number | null | undefined; maxWidth: number }) {
  if (!text) return <span>-</span>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block cursor-help truncate" style={{ maxWidth: `${maxWidth}px` }}>{text}</span>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}