import type { Doc } from "../../../convex/_generated/dataModel";
import { PlayCircle } from "lucide-react";

interface VideoBlockProps {
    block: Doc<"block_instances">;
}

export function VideoBlock({ block }: VideoBlockProps) {
    const url = block.config?.url || "";
    const title = block.config?.title || "Training Video";
    const description = block.config?.description || "";

    // Simple helper to detect if YouTube/Vimeo or direct file
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

    const getEmbedUrl = (inputUrl: string) => {
        if (inputUrl.includes("youtube.com/watch?v=")) {
            return inputUrl.replace("watch?v=", "embed/");
        }
        if (inputUrl.includes("youtu.be/")) {
            return inputUrl.replace("youtu.be/", "youtube.com/embed/");
        }
        return inputUrl;
    };

    return (
        <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <PlayCircle size={20} className="text-brand-blue" />
                {title}
            </h3>

            <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video shadow-sm border border-gray-200">
                {url ? (
                    isYouTube ? (
                        <iframe
                            src={getEmbedUrl(url)}
                            title={title}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            controls
                            className="absolute top-0 left-0 w-full h-full"
                            src={url}
                        />
                    )
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No video URL configured.
                    </div>
                )}
            </div>

            {description && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {description}
                </p>
            )}
        </div>
    );
}
