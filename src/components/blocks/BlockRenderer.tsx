import type { Doc } from "../../../convex/_generated/dataModel";
import { RichTextDisplay } from "./RichTextDisplay"; // To be created
import { ShortAnswerBlock } from "./ShortAnswerBlock"; // To be created
import { LongAnswerBlock } from "./LongAnswerBlock"; // To be created
import { SingleSelectBlock } from "./SingleSelectBlock"; // To be created

import { MeetingSchedulerBlock } from "./MeetingSchedulerBlock"; // To be created
import { ReviewRubricBlock } from "./ReviewRubricBlock";
import { FileUploadBlock } from "./FileUploadBlock";
import { SignatureBlock } from "./SignatureBlock";
import { ProfileInputBlock } from "./ProfileInputBlock";
import { VideoBlock } from "./VideoBlock";

interface BlockRendererProps {
    block: Doc<"block_instances">;
    value: any;
    onChange: (value: any) => void;
    readOnly?: boolean;
}

export function BlockRenderer({ block, value, onChange, readOnly }: BlockRendererProps) {
    if (!block) return null;

    switch (block.type) {
        case "header":
        case "paragraph":
        case "display_text":
            return <RichTextDisplay block={block} />;

        case "short_answer":
            return <ShortAnswerBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "long_answer":
            return <LongAnswerBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "single_select":
            return <SingleSelectBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "meeting_scheduler":
            return <MeetingSchedulerBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "review_rubric":
            return <ReviewRubricBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "file_upload":
            return <FileUploadBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "signature":
            return <SignatureBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "profile_input":
            return <ProfileInputBlock block={block} value={value} onChange={onChange} readOnly={readOnly} />;

        case "video":
            return <VideoBlock block={block} />;

        default:
            return (
                <div className="p-4 border border-dashed border-gray-300 rounded bg-gray-50 text-gray-500 text-sm">
                    Unsupported block type: {block.type}
                </div>
            );
    }
}
