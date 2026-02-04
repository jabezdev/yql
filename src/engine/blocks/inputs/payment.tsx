import type { ApplicantViewProps, ReviewerViewProps } from "../registry";

export const ConfigEditor = () => (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-gray-500">
        Payment Configuration (Coming Soon)
    </div>
);

export const ParticipantView = ({ block }: ApplicantViewProps<any, any>) => (
    <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{block.config?.title || "Payment Required"}</h3>
        <p className="text-gray-500">Payment integration is currently under development.</p>
    </div>
);

export const ReviewerView = ({ }: ReviewerViewProps<any, any, any>) => (
    <div className="text-sm text-gray-500 italic">No payment details available</div>
);

export const validate = () => {
    return null;
};
